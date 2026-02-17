// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');

  // Toggle mobile menu
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');

      // Animate hamburger
      const spans = this.querySelectorAll('span');
      if (mobileMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translateY(7px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-7px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // Toggle mobile dropdowns
  mobileDropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdownMenu = this.nextElementSibling;
      if (dropdownMenu) {
        dropdownMenu.classList.toggle('active');

        // Rotate chevron
        const chevron = this.querySelector('i');
        if (chevron) {
          chevron.style.transform = dropdownMenu.classList.contains('active')
            ? 'rotate(180deg)'
            : 'rotate(0)';
        }
      }
    });
  });

  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Set active navigation link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu a, .mobile-menu > a');

  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Load dynamic research stats for homepage
  loadHomepageStats();
});

// Fetch and display dynamic research stats on the homepage
function loadHomepageStats() {
  const pubEl = document.getElementById('stat-publications');
  const citEl = document.getElementById('stat-citations');
  const hIndexEl = document.getElementById('stat-hindex');
  const yearEl = document.getElementById('stat-years');

  // Only run on homepage
  if (!pubEl && !citEl && !hIndexEl && !yearEl) return;

  const ORCID_ID = '0000-0002-2537-5082';

  // Fetch author stats from OpenAlex Author API
  fetch(`https://api.openalex.org/authors/https://orcid.org/${ORCID_ID}`, {
    headers: { 'Accept': 'application/json' }
  })
    .then(response => response.json())
    .then(authorData => {
      // Publications: round down to nearest 5
      const worksCount = authorData.works_count || 0;
      const roundedPubs = Math.floor(worksCount / 5) * 5;
      if (pubEl) pubEl.textContent = roundedPubs + '+';

      // Citations: round down to nearest 100
      const citations = authorData.cited_by_count || 0;
      const roundedCitations = Math.floor(citations / 100) * 100;
      if (citEl) citEl.textContent = roundedCitations + '+';

      // h-index: round down to nearest 5
      const hIndex = authorData.summary_stats?.h_index || 0;
      const roundedHIndex = Math.floor(hIndex / 5) * 5;
      if (hIndexEl) hIndexEl.textContent = roundedHIndex + '+';

      // Years of research: find earliest year from counts_by_year
      if (yearEl && authorData.counts_by_year && authorData.counts_by_year.length > 0) {
        const yearsWithWorks = authorData.counts_by_year
          .filter(y => y.works_count > 0)
          .map(y => y.year);
        if (yearsWithWorks.length > 0) {
          const earliestYear = Math.min(...yearsWithWorks);
          const currentYear = new Date().getFullYear();
          yearEl.textContent = (currentYear - earliestYear) + '+';
        }
      }
    })
    .catch(() => {
      // Keep hardcoded fallback values
    });

  // Also try cached publications for more accurate earliest year
  fetch('/assets/data/publications.json')
    .then(response => response.json())
    .then(data => {
      if (data && Array.isArray(data.publications) && data.publications.length > 0) {
        const years = data.publications.map(p => p.year).filter(y => y && !isNaN(y));
        if (years.length > 0 && yearEl) {
          const earliestYear = Math.min(...years);
          const currentYear = new Date().getFullYear();
          yearEl.textContent = (currentYear - earliestYear) + '+';
        }
      }
    })
    .catch(() => {
      // Ignore - OpenAlex data is sufficient
    });
}
