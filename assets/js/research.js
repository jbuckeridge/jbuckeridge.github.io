// Research Projects Dynamic Renderer
let allResearchData = [];

// Load research data from JSON
async function loadResearch() {
  try {
    const response = await fetch('assets/data/research.json');
    if (!response.ok) throw new Error('Failed to load research data');
    const researchData = await response.json();
    allResearchData = researchData;
    return researchData;
  } catch (error) {
    console.error('Error loading research:', error);
    return [];
  }
}

// Render individual research card
function renderResearchCard(item) {
  const tagClass = item.tag === 'software-codes' ? 'tag-software' : 'tag-research';
  const tagDisplay = item.tag === 'software-codes' ? 'software/codes' : 'research-topics';

  // Build links HTML if any links exist
  let linksHTML = '';
  if (item.github || item.documentation || item.paper) {
    const links = [];

    if (item.github) {
      links.push(`<a href="${item.github}" class="research-link" target="_blank" rel="noopener noreferrer" title="GitHub"><i class="fab fa-github"></i></a>`);
    }
    if (item.documentation) {
      links.push(`<a href="${item.documentation}" class="research-link" target="_blank" rel="noopener noreferrer" title="Documentation"><i class="fas fa-book"></i></a>`);
    }
    if (item.paper) {
      links.push(`<a href="${item.paper}" class="research-link" target="_blank" rel="noopener noreferrer" title="Paper"><i class="fas fa-file-alt"></i></a>`);
    }

    linksHTML = `<div class="research-links">${links.join('')}</div>`;
  }

  return `
    <div class="research-item card" data-tag="${item.tag}">
      <div class="research-image">
        <img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)';">
      </div>
      <div class="research-content">
        <h3>${item.title}</h3>
        <div class="research-tags">
          <span class="research-tag ${tagClass}">${tagDisplay}</span>
          ${linksHTML}
        </div>
      </div>
    </div>
  `;
}

// Render research grid
async function renderResearchGrid() {
  const container = document.getElementById('research-container');
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div class="loading-spinner">Loading research projects...</div>';

  const researchData = await loadResearch();

  if (researchData.length === 0) {
    container.innerHTML = '<p class="text-center">No research projects available.</p>';
    return;
  }

  container.innerHTML = researchData.map(renderResearchCard).join('');
}

// Filter research by tag
function filterResearch(filterTag) {
  const items = document.querySelectorAll('.research-item');

  items.forEach(item => {
    if (filterTag === 'all' || item.dataset.tag === filterTag) {
      item.style.display = 'flex';
      item.style.animation = 'fadeIn 0.5s ease';
    } else {
      item.style.display = 'none';
    }
  });
}

// Initialize filter buttons
function initializeFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Filter research items
      const filterValue = this.getAttribute('data-filter');
      filterResearch(filterValue);
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await renderResearchGrid();
  initializeFilters();
});
