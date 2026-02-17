// Talk tags filtering and rendering
(function () {
    'use strict';

    // Get tag from URL parameter
    function getTagParam() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tag');
    }

    // Fetch talk data
    async function loadTalksData() {
        try {
            const response = await fetch('assets/data/talks.json');
            const talksData = await response.json();
            return talksData;
        } catch (error) {
            console.error('Error loading talks data:', error);
            return [];
        }
    }

    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Render a single talk card (Centered: Title, Date, and Location)
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
                        <span style="margin: 0 0.75rem; color: #ccc;">|</span>
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

    // Initialize the tag page
    async function initTagPage() {
        const talksContainer = document.getElementById('talks-container');
        const tagNav = document.getElementById('tag-navigation');
        const tagTitle = document.getElementById('tag-results-title');

        if (!talksContainer) return;

        const talksData = await loadTalksData();
        const currentTag = getTagParam();

        // Extract all unique tags
        const allTags = new Set();
        talksData.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => allTags.add(tag));
            }
        });

        // Sort tags alphabetically
        const sortedTags = Array.from(allTags).sort();

        // Render tag navigation
        tagNav.innerHTML = sortedTags.map(tag => {
            const isActive = tag === currentTag;
            const style = isActive
                ? 'background: var(--primary-color); color: white; border-color: var(--primary-color);'
                : 'background: var(--light-gray, #f7f9fb); color: var(--text-color); border-color: var(--border-color, #e5e7eb);';
            return `<a href="talk-tags.html?tag=${encodeURIComponent(tag)}" class="badge" style="padding: 0.4rem 0.9rem; border-radius: var(--border-radius, 6px); border: 1px solid; text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: all 0.3s ease; ${style}">${tag}</a>`;
        }).join('');

        // Filter and render talks
        let filteredTalks = talksData;
        if (currentTag) {
            filteredTalks = talksData.filter(item => item.tags && item.tags.includes(currentTag));
            tagTitle.innerHTML = `<h2 class="h3">Talks tagged with "<span style="color: var(--primary-color);">${currentTag}</span>"</h2>`;
            document.title = `Talks: ${currentTag} | Dr John Buckeridge`;
        } else {
            tagTitle.innerHTML = `<h2 class="h3">All Talks</h2>`;
        }

        // Sort by date (newest first)
        filteredTalks.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredTalks.length === 0) {
            talksContainer.innerHTML = '<p class="text-center w-100">No talks found with this tag.</p>';
        } else {
            talksContainer.innerHTML = filteredTalks.map(renderTalkCard).join('');
        }
    }

    document.addEventListener('DOMContentLoaded', initTagPage);
})();
