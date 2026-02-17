// Publications rendering from ORCID API with OpenAlex enrichment
(function () {
    'use strict';

    const ORCID_ID = '0000-0002-2537-5082';
    const ORCID_API_URL = `https://pub.orcid.org/v3.0/${ORCID_ID}/works`;
    const HIGHLIGHT_AUTHOR = 'Buckeridge';

    // Fetch publications from ORCID
    async function fetchPublications() {
        try {
            const response = await fetch(ORCID_API_URL, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching publications:', error);
            return null;
        }
    }

    // Fetch metadata from OpenAlex API
    async function fetchMetadata(doi) {
        if (!doi) return null;

        try {
            const response = await fetch(`https://api.openalex.org/works/https://doi.org/${doi}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching metadata for DOI:', doi, error);
            return null;
        }
    }

    // Parse ORCID work to extract publication details
    function parseWork(work) {
        const workSummary = work['work-summary'][0];
        const title = workSummary.title?.title?.value || 'Untitled';
        const year = workSummary['publication-date']?.year?.value || 'Unknown';
        const journal = workSummary['journal-title']?.value || '';
        const type = workSummary.type || 'article';

        // Get DOI if available
        const externalIds = workSummary['external-ids']?.['external-id'] || [];
        const doiObj = externalIds.find(id => id['external-id-type'] === 'doi');
        const doi = doiObj ? doiObj['external-id-value'] : null;

        // Get URL
        const url = workSummary.url?.value || (doi ? `https://doi.org/${doi}` : null);

        return {
            title,
            year: parseInt(year),
            journal,
            type,
            doi,
            url,
            putCode: workSummary['put-code'],
            authors: null,
            volume: null,
            issue: null,
            pages: null
        };
    }

    // Enrich publication with metadata from OpenAlex
    async function enrichPublication(pub) {
        if (!pub.doi) return pub;

        const metadata = await fetchMetadata(pub.doi);
        if (!metadata) return pub;

        // Extract authors
        if (metadata.authorships && Array.isArray(metadata.authorships)) {
            pub.authors = metadata.authorships.map(authorship => {
                const name = authorship.author?.display_name || '';
                if (!name) return '';
                // Convert "First Last" to "Last, F."
                const parts = name.split(' ');
                if (parts.length >= 2) {
                    const family = parts[parts.length - 1];
                    const initials = parts.slice(0, -1).map(n => n.charAt(0) + '.').join(' ');
                    return `${family}, ${initials}`;
                }
                return name;
            }).filter(a => a);
        }

        // Extract volume, issue, pages
        const biblio = metadata.biblio || {};
        pub.volume = biblio.volume || null;
        pub.issue = biblio.issue || null;
        if (biblio.first_page) {
            pub.pages = biblio.last_page && biblio.last_page !== biblio.first_page
                ? `${biblio.first_page}-${biblio.last_page}`
                : biblio.first_page;
        }

        // Update journal if better info available
        const journalName = metadata.primary_location?.source?.display_name;
        if (journalName && !pub.journal) {
            pub.journal = journalName;
        }

        return pub;
    }

    // Group publications by year
    function groupByYear(publications) {
        const grouped = new Map();
        const yearMap = {};
        publications.forEach(pub => {
            if (!yearMap[pub.year]) {
                yearMap[pub.year] = [];
            }
            yearMap[pub.year].push(pub);
        });

        const sortedYears = Object.keys(yearMap)
            .map(y => parseInt(y))
            .sort((a, b) => b - a);

        sortedYears.forEach(year => {
            grouped.set(year, yearMap[year]);
        });

        return grouped;
    }

    // Generate BibTeX citation
    function generateBibTeX(pub) {
        const year = pub.year || '';
        const title = pub.title || '';
        const journal = pub.journal || '';
        const doi = pub.doi || '';
        const volume = pub.volume || '';
        const issue = pub.issue || '';
        const pages = pub.pages || '';

        let citationKey = 'publication';
        if (pub.authors && pub.authors.length > 0) {
            const firstAuthor = pub.authors[0].split(',')[0].toLowerCase().replace(/\s+/g, '');
            citationKey = `${firstAuthor}${year}`;
        }

        let bibtexAuthors = '';
        if (pub.authors && pub.authors.length > 0) {
            bibtexAuthors = pub.authors.join(' and ');
        }

        let bibtex = `@article{${citationKey},\n`;
        if (bibtexAuthors) bibtex += `  author = {${bibtexAuthors}},\n`;
        if (title) bibtex += `  title = {${title}},\n`;
        if (journal) bibtex += `  journal = {${journal}},\n`;
        if (volume) bibtex += `  volume = {${volume}},\n`;
        if (issue) bibtex += `  number = {${issue}},\n`;
        if (pages) bibtex += `  pages = {${pages}},\n`;
        if (year) bibtex += `  year = {${year}},\n`;
        if (doi) bibtex += `  doi = {${doi}}\n`;
        bibtex += `}`;

        return bibtex;
    }

    // Render a single publication with numbering and author highlighting
    function renderPublication(pub, number) {
        // Format authors with highlighted name bolded
        let authorsHTML = '';
        if (pub.authors && pub.authors.length > 0) {
            const formatted = pub.authors.map(author => {
                if (author.startsWith(HIGHLIGHT_AUTHOR)) {
                    return `<strong>${author}</strong>`;
                }
                return author;
            });
            authorsHTML = formatted.join('; ');
        }

        // Format journal info with volume/issue/pages
        let venueHTML = '';
        if (pub.journal) {
            let venueParts = [pub.journal];

            if (pub.volume) {
                venueParts.push(pub.volume);
            }
            if (pub.issue) {
                venueParts[venueParts.length - 1] += `(${pub.issue})`;
            }
            if (pub.pages) {
                venueParts.push(pub.pages);
            }
            if (pub.year) {
                venueParts.push(pub.year);
            }

            venueHTML = venueParts.join(', ') + '.';
        } else if (pub.year) {
            venueHTML = pub.year + '.';
        }

        // Build links
        const links = [];

        if (pub.url) {
            links.push(`<a href="${pub.url}" target="_blank" rel="noopener noreferrer">link</a>`);
        } else if (pub.doi) {
            links.push(`<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener noreferrer">link</a>`);
        }

        // Generate BibTeX
        const bibtex = generateBibTeX(pub);
        const bibtexId = `bibtex-${Math.random().toString(36).substr(2, 9)}`;

        return `
            <div class="publication-row">
                <div class="pub-number">${number}.</div>
                <div class="publication-item">
                    <div class="pub-title-line">${pub.title}</div>
                    ${authorsHTML ? `<div class="pub-authors-line">${authorsHTML}</div>` : ''}
                    ${venueHTML ? `<div class="pub-venue-line">${venueHTML}</div>` : ''}
                    <div class="pub-links-line">
                        ${links.join(' ')}
                        <span class="bibtex-toggle" data-target="${bibtexId}">
                            bibtex <i class="fas fa-chevron-down"></i>
                        </span>
                    </div>
                    <div class="bibtex-content" id="${bibtexId}">
                        <pre>${bibtex}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    // Render publications grouped by year with descending numbering
    function renderPublications(groupedPubs) {
        const container = document.getElementById('publications-container');
        if (!container) return;

        // Count total publications for descending numbering
        let totalCount = 0;
        groupedPubs.forEach(pubs => { totalCount += pubs.length; });
        let currentNumber = totalCount;

        let html = '';

        groupedPubs.forEach((pubs, year) => {
            const pubsHTML = pubs.map(pub => {
                const num = currentNumber--;
                return renderPublication(pub, num);
            }).join('');

            html += `
                <div class="year-section">
                    <div class="year-header">
                        <h2>${year}</h2>
                    </div>
                    <div class="year-content">
                        ${pubsHTML}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Add BibTeX toggle functionality
        attachBibtexHandlers();
    }

    // Attach event handlers for BibTeX toggle
    function attachBibtexHandlers() {
        const bibtexToggles = document.querySelectorAll('.bibtex-toggle');

        bibtexToggles.forEach(toggle => {
            toggle.addEventListener('click', function () {
                const targetId = this.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const icon = this.querySelector('i');

                if (content.classList.contains('active')) {
                    content.classList.remove('active');
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    content.classList.add('active');
                    icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    }

    // Update dynamic stats on the publications page
    function updatePublicationsPageStats(publications) {
        const totalPubs = publications.length;
        const roundedPubs = Math.floor(totalPubs / 5) * 5;

        // Find earliest year
        const years = publications.map(p => p.year).filter(y => y && !isNaN(y));
        const earliestYear = Math.min(...years);
        const currentYear = new Date().getFullYear();
        const yearsResearch = currentYear - earliestYear;

        // Update publications count on publications page
        const pubStatEl = document.getElementById('pub-stat-publications');
        if (pubStatEl) {
            pubStatEl.textContent = roundedPubs + '+';
        }

        // Fetch citation and h-index data from OpenAlex Author API
        fetch(`https://api.openalex.org/authors/https://orcid.org/${ORCID_ID}`, {
            headers: { 'Accept': 'application/json' }
        })
            .then(response => response.json())
            .then(authorData => {
                const citations = authorData.cited_by_count || 0;
                const roundedCitations = Math.floor(citations / 100) * 100;
                const hIndex = authorData.summary_stats?.h_index || 0;
                const roundedHIndex = Math.floor(hIndex / 5) * 5;

                const citStatEl = document.getElementById('pub-stat-citations');
                if (citStatEl) {
                    citStatEl.textContent = roundedCitations + '+';
                }

                const hStatEl = document.getElementById('pub-stat-hindex');
                if (hStatEl) {
                    hStatEl.textContent = roundedHIndex + '+';
                }
            })
            .catch(() => {
                // Keep hardcoded fallback values
            });
    }

    // Show error message
    function showError() {
        const container = document.getElementById('publications-container');
        if (!container) return;

        container.innerHTML = `
            <div class="publications-error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Unable to Load Publications</h3>
                <p>We're having trouble loading the publications list. Please try again later or visit the Google Scholar profile.</p>
            </div>
        `;
    }

    // Hide loader and show content
    function hideLoader() {
        const loader = document.getElementById('publications-loader');
        const container = document.getElementById('publications-container');

        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }

        if (container) {
            setTimeout(() => {
                container.style.opacity = '1';
            }, 300);
        }
    }

    // Try loading pre-cached publications JSON
    async function loadCachedPublications() {
        try {
            const response = await fetch('/assets/data/publications.json');
            if (!response.ok) return null;
            const data = await response.json();
            if (data && Array.isArray(data.publications) && data.publications.length > 0) {
                return data.publications;
            }
            return null;
        } catch (error) {
            console.warn('Cache not available, falling back to live API:', error.message);
            return null;
        }
    }

    // Fetch publications live from ORCID + OpenAlex (fallback)
    async function fetchAndEnrichPublications() {
        const data = await fetchPublications();

        if (!data || !data.group) return null;

        let publications = data.group
            .map(work => parseWork(work))
            .filter(pub => pub.year && !isNaN(pub.year))
            .sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return a.title.localeCompare(b.title);
            });

        if (publications.length === 0) return null;

        // Enrich publications with metadata from OpenAlex API
        const batchSize = 5;
        for (let i = 0; i < publications.length; i += batchSize) {
            const batch = publications.slice(i, i + batchSize);
            await Promise.all(batch.map(async (pub, index) => {
                publications[i + index] = await enrichPublication(pub);
            }));
        }

        return publications;
    }

    // Initialize publications page
    async function initializePublications() {
        // Try cache first, fall back to live API
        let publications = await loadCachedPublications();

        if (!publications) {
            publications = await fetchAndEnrichPublications();
        }

        if (!publications || publications.length === 0) {
            showError();
            hideLoader();
            return;
        }

        // Group by year
        const groupedPubs = groupByYear(publications);

        // Render publications
        renderPublications(groupedPubs);

        // Update dynamic stats on the publications page
        updatePublicationsPageStats(publications);

        // Hide loader
        hideLoader();
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', initializePublications);
})();
