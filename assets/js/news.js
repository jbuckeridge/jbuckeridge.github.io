// News rendering JavaScript
(function() {
    'use strict';

    // Fetch and render news
    async function loadNews() {
        try {
            const response = await fetch('assets/data/blog.json');
            const newsData = await response.json();

            // Sort by date (newest first)
            newsData.sort((a, b) => new Date(b.date) - new Date(a.date));

            return newsData;
        } catch (error) {
            console.error('Error loading news:', error);
            return [];
        }
    }

    // Format date to readable string
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Get article link (use dynamic page if markdown exists, otherwise use static link)
    function getArticleLink(newsItem) {
        if (newsItem.markdown) {
            return `blog-article.html?id=${newsItem.id}`;
        }
        return newsItem.link;
    }

    // Render news card for home page
    function renderNewsCardHome(newsItem) {
        const tagsHTML = newsItem.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        const articleLink = getArticleLink(newsItem);

        return `
            <article class="news-post">
                <div class="news-image">
                    <img src="${newsItem.image}" alt="${newsItem.title}">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span>By <strong>${newsItem.author}</strong></span>
                        <span>${formatDate(newsItem.date)}</span>
                    </div>
                    <h3><a href="${articleLink}">${newsItem.title}</a></h3>
                    <p>${newsItem.excerpt}</p>
                    <div class="news-tags">
                        ${tagsHTML}
                    </div>
                    <a href="${articleLink}" class="read-more">Read more →</a>
                </div>
            </article>
        `;
    }

    // Render news card for news page
    function renderNewsCardArchive(newsItem) {
        const tagsHTML = newsItem.tags.map(tag => `<a href="blog-tags.html?tag=${encodeURIComponent(tag)}" class="badge tag-badge">${tag}</a>`).join('');
        const articleLink = getArticleLink(newsItem);

        return `
            <article class="card">
                <div class="card-body" style="text-align: center;">
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        <i class="fas fa-calendar" style="color: var(--primary-color);"></i> ${formatDate(newsItem.date)}
                    </div>
                    <h3 class="card-title">
                        <a href="${articleLink}">
                            ${newsItem.title}
                        </a>
                    </h3>
                    <p style="color: var(--text-color); margin-bottom: 1rem;">${newsItem.excerpt}</p>
                    <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;">
                        ${tagsHTML}
                    </div>
                    <div style="display: flex; justify-content: center; margin-top: 1rem;">
                        <a href="${articleLink}" class="btn btn-primary" style="font-size: 0.9rem;">
                            Read more <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }

    // Render news on home page (latest 3)
    async function renderHomePageNews() {
        const newsGrid = document.getElementById('home-news-grid');
        if (!newsGrid) return;

        const newsData = await loadNews();
        const latestNews = newsData.slice(0, 3);

        newsGrid.innerHTML = latestNews.map(renderNewsCardHome).join('');
    }

    // Render news on news archive page (grouped by year)
    async function renderNewsArchive() {
        const newsArchive = document.getElementById('news-archive-content') || document.getElementById('news-container');
        if (!newsArchive) return;

        const newsData = await loadNews();

        // Render all news posts without year grouping
        const newsHTML = newsData.map(renderNewsCardArchive).join('');
        newsArchive.innerHTML = newsHTML;
    }

    // Add click handlers for year navigation
    function addYearNavigationHandlers() {
        const yearLinks = document.querySelectorAll('.year-link');
        const yearSections = document.querySelectorAll('.year-section');

        yearLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetYear = this.getAttribute('data-year');

                // Update active link
                yearLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Show/hide sections
                if (targetYear === 'all') {
                    // Show all year sections
                    yearSections.forEach(section => {
                        section.style.display = 'block';
                        section.style.animation = 'fadeInUp 0.5s ease-out';
                    });
                } else {
                    // Show only selected year
                    yearSections.forEach(section => {
                        if (section.getAttribute('data-year') === targetYear) {
                            section.style.display = 'block';
                            section.style.animation = 'fadeInUp 0.5s ease-out';
                        } else {
                            section.style.display = 'none';
                        }
                    });
                }
            });
        });
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Check which page we're on and render accordingly
        if (document.getElementById('home-news-grid')) {
            renderHomePageNews();
        }
        if (document.getElementById('news-archive-content') || document.getElementById('news-container')) {
            renderNewsArchive();
        }
    });
})();
