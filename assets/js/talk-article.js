// News article rendering with markdown support
(function() {
    'use strict';

    // Get article ID from URL parameter
    function getArticleId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Fetch news metadata from JSON
    async function getArticleMetadata(articleId) {
        try {
            const response = await fetch('assets/data/news.json');
            const newsData = await response.json();
            return newsData.find(article => article.id === articleId);
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
    function renderTags(tags) {
        if (!tags || tags.length === 0) return '';
        return tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    // Configure marked.js options
    function configureMarked() {
        // Set marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });

        // Custom renderer for links to open external links in new tab
        const renderer = new marked.Renderer();
        const originalLinkRenderer = renderer.link;

        renderer.link = function(href, title, text) {
            const html = originalLinkRenderer.call(this, href, title, text);
            // If link is external (starts with http), add target="_blank"
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
            }
            return html;
        };

        marked.use({ renderer });
    }

    // Render the article
    async function renderArticle() {
        const articleId = getArticleId();

        if (!articleId) {
            showError();
            return;
        }

        // Get article metadata
        const metadata = await getArticleMetadata(articleId);

        if (!metadata) {
            showError();
            return;
        }

        // Get markdown content
        const markdownPath = metadata.markdown || `assets/content/talks/${articleId}.md`;
        const markdownContent = await getMarkdownContent(markdownPath);

        if (!markdownContent) {
            showError();
            return;
        }

        // Configure marked.js
        configureMarked();

        // Convert markdown to HTML
        const htmlContent = marked.parse(markdownContent);

        // Update page title
        document.title = `${metadata.title} - SLIMES Research Group`;

        // Update Open Graph meta tags
        const fullImageUrl = `https://slimeslab.github.io/${metadata.image}`;
        const ogImage = document.querySelector('meta[property="og:image"]');
        const twitterImage = document.querySelector('meta[property="twitter:image"]');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const twitterTitle = document.querySelector('meta[property="twitter:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const twitterDescription = document.querySelector('meta[property="twitter:description"]');

        if (ogImage) ogImage.setAttribute('content', fullImageUrl);
        if (twitterImage) twitterImage.setAttribute('content', fullImageUrl);
        if (ogTitle) ogTitle.setAttribute('content', `${metadata.title} - SLIMES Research Group`);
        if (twitterTitle) twitterTitle.setAttribute('content', `${metadata.title} - SLIMES Research Group`);
        if (ogDescription && metadata.excerpt) {
            ogDescription.setAttribute('content', metadata.excerpt);
            if (twitterDescription) twitterDescription.setAttribute('content', metadata.excerpt);
        }

        // Update breadcrumb and header
        document.getElementById('article-title').textContent = metadata.title;
        document.getElementById('breadcrumb-title').textContent = metadata.title;

        // Update article metadata
        document.getElementById('article-image').src = metadata.image;
        document.getElementById('article-image').alt = metadata.title;
        document.getElementById('article-author').textContent = metadata.author;
        document.getElementById('article-date').textContent = formatDate(metadata.date);
        document.getElementById('article-tags').innerHTML = renderTags(metadata.tags);

        // Render markdown content
        document.getElementById('article-content').innerHTML = htmlContent;

        // Hide loader and show article
        hideLoader();
        showArticle();

        // Make all links in markdown content open in new tab if external
        const contentLinks = document.querySelectorAll('.markdown-content a');
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
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }

    function showArticle() {
        const article = document.getElementById('article-section');
        if (article) {
            article.style.display = 'block';
            setTimeout(() => {
                article.style.opacity = '1';
            }, 10);
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
