// Blog tags filtering and rendering
(function () {
    'use strict';

    // Get tag from URL parameter
    function getTagParam() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tag');
    }

    // Fetch blog data
    async function loadBlogData() {
        try {
            const response = await fetch('assets/data/blog.json');
            const blogData = await response.json();
            return blogData;
        } catch (error) {
            console.error('Error loading blog data:', error);
            return [];
        }
    }

    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Render a single blog card
    function renderBlogCard(item) {
        const tagsHTML = item.tags.map(tag =>
            `<a href="blog-tags.html?tag=${encodeURIComponent(tag)}" class="badge tag-badge">${tag}</a>`
        ).join('');

        const articleLink = item.markdown ? `blog-article.html?id=${item.id}` : item.link;

        return `
            <article class="card">
                <div class="card-body" style="text-align: center;">
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        <i class="fas fa-calendar" style="color: var(--primary-color);"></i> ${formatDate(item.date)}
                    </div>
                    <h3 class="card-title">
                        <a href="${articleLink}">${item.title}</a>
                    </h3>
                    <p style="color: var(--text-color); margin-bottom: 1rem;">${item.excerpt}</p>
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

    // Initialize the tag page
    async function initTagPage() {
        const blogContainer = document.getElementById('blog-container');
        const tagNav = document.getElementById('tag-navigation');
        const tagTitle = document.getElementById('tag-results-title');
        const breadcrumbTag = document.getElementById('breadcrumb-tag');

        if (!blogContainer) return;

        const blogData = await loadBlogData();
        const currentTag = getTagParam();

        // Extract all unique tags
        const allTags = new Set();
        blogData.forEach(item => {
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
            return `<a href="blog-tags.html?tag=${encodeURIComponent(tag)}" class="badge" style="padding: 0.4rem 0.9rem; border-radius: var(--border-radius, 6px); border: 1px solid; text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: all 0.3s ease; ${style}">${tag}</a>`;
        }).join('');

        // Filter and render posts
        let filteredPosts = blogData;
        if (currentTag) {
            filteredPosts = blogData.filter(item => item.tags && item.tags.includes(currentTag));
            tagTitle.innerHTML = `<h2 class="h3">Posts tagged with "<span style="color: var(--primary-color);">${currentTag}</span>"</h2>`;
            if (breadcrumbTag) breadcrumbTag.textContent = currentTag;
            document.title = `Blog: ${currentTag} | Dr John Buckeridge`;
        } else {
            tagTitle.innerHTML = `<h2 class="h3">All Posts</h2>`;
        }

        // Sort by date (newest first)
        filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredPosts.length === 0) {
            blogContainer.innerHTML = '<p class="text-center w-100">No posts found with this tag.</p>';
        } else {
            blogContainer.innerHTML = filteredPosts.map(renderBlogCard).join('');
        }
    }

    document.addEventListener('DOMContentLoaded', initTagPage);
})();
