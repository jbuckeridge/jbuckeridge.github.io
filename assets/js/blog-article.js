// Blog/Talk article rendering with markdown support
(function () {
    'use strict';

    // Get article ID from URL parameter
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Fetch article metadata from JSON
    async function getArticleMetadata(articleId, type) {
        try {
            const dataFile = type === 'talk' ? '/assets/data/talks.json' : '/assets/data/blog.json';
            const response = await fetch(dataFile);
            const data = await response.json();
            return data.find(article => article.id === articleId);
        } catch (error) {
            console.error('Error loading article metadata:', error);
            return null;
        }
    }

    // Fetch markdown content
    async function getMarkdownContent(markdownPath) {
        try {
            const response = await fetch(markdownPath);
            if (!response.ok) {
                throw new Error('Markdown file not found');
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading markdown content:', error);
            return null;
        }
    }

    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options);
    }

    // Render article tags
    function renderTags(tags, type) {
        if (!tags || tags.length === 0) return '';
        const baseUrl = type === 'talk' ? 'talk-tags.html' : 'blog-tags.html';
        return tags.map(tag => `<a href="${baseUrl}?tag=${encodeURIComponent(tag)}" class="badge" style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: var(--border-radius); font-size: 0.85rem; margin-right: 0.5rem; margin-top: 0.25rem; margin-bottom: 0.25rem; display: inline-block; text-decoration: none;">${tag}</a>`).join('');
    }

    // Configure marked.js options
    function configureMarked() {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true
        });

        // Custom renderer for links
        const renderer = new marked.Renderer();
        const originalLinkRenderer = renderer.link;

        renderer.link = function (href, title, text) {
            const html = originalLinkRenderer.call(this, href, title, text);
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
            }
            return html;
        };

        marked.use({ renderer });
    }

    // Render the article
    async function renderArticle() {
        const articleId = getQueryParam('id');
        const type = getQueryParam('type') || 'blog';

        if (!articleId) {
            showError();
            return;
        }

        // Get article metadata
        const metadata = await getArticleMetadata(articleId, type);

        if (!metadata) {
            showError();
            return;
        }

        // Get markdown content
        const markdownPath = type === 'talk' ? '/assets/content/talks/' + articleId + '.md' : '/assets/content/blog/' + articleId + '.md';
        let markdownContent = await getMarkdownContent(markdownPath);

        if (!markdownContent) {
            showError();
            return;
        }

        // Remove metadata lines from markdown content (Date, Author, etc.)
        // These are typically found after the title in blog posts
        markdownContent = markdownContent.replace(/^\*\*Date:\*\*.*$/gm, '');
        markdownContent = markdownContent.replace(/^\*\*Author:\*\*.*$/gm, '');
        markdownContent = markdownContent.replace(/^\*\*Event:\*\*.*$/gm, '');
        markdownContent = markdownContent.replace(/^\*\*Location:\*\*.*$/gm, '');

        // Configure marked.js
        configureMarked();

        // Convert markdown to HTML
        let htmlContent = marked.parse(markdownContent);

        // Remove the first h1 from markdown content (since we're displaying it separately)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const firstH1 = tempDiv.querySelector('h1');
        if (firstH1) {
            firstH1.remove();
        }
        htmlContent = tempDiv.innerHTML;

        // Update page title
        document.title = metadata.title + ' | Dr John Buckeridge';

        // Update article header
        const titleElement = document.getElementById('article-title');
        if (titleElement) titleElement.textContent = metadata.title;

        // Update article metadata
        const authorElement = document.getElementById('article-author');
        if (authorElement) authorElement.textContent = metadata.author || 'Dr John Buckeridge';

        const dateElement = document.getElementById('article-date');
        if (dateElement) dateElement.textContent = formatDate(metadata.date);

        const tagsElement = document.getElementById('article-tags');
        if (tagsElement) tagsElement.innerHTML = renderTags(metadata.tags, type);

        // Render markdown content
        const contentElement = document.getElementById('article-content');
        if (contentElement) contentElement.innerHTML = htmlContent;

        // Update back button link and text (only for the button in the article, not navbar)
        const backLink = document.querySelector('.card-body a[href="/blog.html"]');
        if (backLink && type === 'talk') {
            backLink.href = '/talks.html';
            backLink.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Talks';
        }

        // Hide loader and show article
        hideLoader();
        showArticle();

        // Make all links in content open in new tab if external
        const contentLinks = document.querySelectorAll('#article-content a');
        contentLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // Show/hide functions
    function hideLoader() {
        const loader = document.getElementById('article-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    function showArticle() {
        const article = document.getElementById('article-section');
        if (article) {
            article.style.display = 'block';
        }
    }

    function showError() {
        const loader = document.getElementById('article-loader');
        const error = document.getElementById('error-section');

        if (loader) {
            loader.style.display = 'none';
        }
        if (error) {
            error.style.display = 'block';
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', renderArticle);
})();

