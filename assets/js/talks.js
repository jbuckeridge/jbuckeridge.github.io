// Talks rendering JavaScript
(function() {
    'use strict';

    // Fetch and render talks
    async function loadTalks() {
        try {
            const response = await fetch('assets/data/talks.json');
            const talksData = await response.json();
            return talksData;
        } catch (error) {
            console.error('Error loading talks:', error);
            return [];
        }
    }

    // Format date to readable string
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Render talk card (Centered: Title, Date, and Location)
    function renderTalkCard(talk) {
        const tagsHTML = talk.tags ? talk.tags.map(tag =>
            `<a href="talk-tags.html?tag=${encodeURIComponent(tag)}" class="badge tag-badge">${tag}</a>`
        ).join('') : '';

        return `
            <div class="card talk-card" style="border-top: 3px solid var(--primary-color); max-width: 800px; margin: 0 auto 1.25rem auto;">
                <div class="card-body" style="text-align: center; padding: 1.5rem;">
                    <h3 class="card-title" style="line-height: 1.4; margin-bottom: 0.75rem;">
                        <a href="blog-article.html?type=talk&id=${talk.id}">${talk.title}</a>
                    </h3>
                    <div class="talk-meta" style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem; gap: 0.25rem;">
                        <span style="display: inline-flex; align-items: center; gap: 0.35rem;"><i class="far fa-calendar-alt" style="color: var(--primary-color);"></i> ${formatDate(talk.date)}</span>
                        <span class="talk-meta-separator" style="margin: 0 0.75rem; color: #ccc;">|</span>
                        <span style="display: inline-flex; align-items: center; gap: 0.35rem;"><i class="fas fa-map-marker-alt" style="color: var(--primary-color);"></i> ${talk.location}</span>
                    </div>
                    <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;">
                        ${tagsHTML}
                    </div>
                    <div style="display: flex; justify-content: center; margin-top: 1rem;">
                        <a href="blog-article.html?type=talk&id=${talk.id}" class="btn btn-primary" style="font-size: 0.9rem;">
                            Read more <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Render all talks
    async function renderTalks() {
        const upcomingContainer = document.getElementById('upcoming-talks-container');
        const archiveContent = document.getElementById('talks-archive-content');
        
        if (!upcomingContainer || !archiveContent) return;

        const talksData = await loadTalks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingTalks = [];
        const previousTalks = [];

        talksData.forEach(talk => {
            const talkDate = new Date(talk.date);
            if (talkDate >= today) {
                upcomingTalks.push(talk);
            } else {
                previousTalks.push(talk);
            }
        });

        // --- Render Upcoming Talks ---
        if (upcomingTalks.length === 0) {
            upcomingContainer.innerHTML = '<p class="text-muted text-center w-100" style="font-style: italic;">There are no upcoming talks scheduled at this time.</p>';
        } else {
            upcomingTalks.sort((a, b) => new Date(a.date) - new Date(b.date));
            upcomingContainer.innerHTML = upcomingTalks.map(renderTalkCard).join('');
        }

        // --- Render Previous Talks (Grouped by Year) ---
        if (previousTalks.length === 0) {
            archiveContent.innerHTML = '<p class="text-center w-100">No previous talks found.</p>';
            return;
        }

        previousTalks.sort((a, b) => new Date(b.date) - new Date(a.date));

        const talksByYear = {};
        previousTalks.forEach(talk => {
            const year = new Date(talk.date).getFullYear();
            if (!talksByYear[year]) {
                talksByYear[year] = [];
            }
            talksByYear[year].push(talk);
        });

        const years = Object.keys(talksByYear).sort((a, b) => b - a);

        let archiveHTML = '';
        years.forEach(year => {
            const yearTalksHTML = talksByYear[year].map(renderTalkCard).join('');
            archiveHTML += `
                <div class="year-section mb-5 w-100" style="display: flex; flex-direction: column; align-items: center;">
                    <h3 class="year-title h4 mb-4" style="color: var(--primary-color); font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 0.5rem; display: inline-block; width: fit-content; text-align: center;">${year}</h3>
                    <div class="talks-grid w-100" style="display: flex; flex-direction: column; align-items: center;">
                        ${yearTalksHTML}
                    </div>
                </div>
            `;
        });

        archiveContent.innerHTML = archiveHTML;
    }


    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        renderTalks();
    });
})();


