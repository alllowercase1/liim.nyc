/**
 * LIIM LASALLE - Main JavaScript
 * liim.nyc
 */

(function() {
  'use strict';

  // ============================================
  // Mobile Navigation Toggle
  // ============================================
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      this.setAttribute('aria-expanded', !isExpanded);
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navLinks.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!navToggle.contains(event.target) && !navLinks.contains(event.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = document.querySelector('.nav-wrapper').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================
  // Video Background Fallback
  // ============================================
  const heroVideo = document.querySelector('.hero-video');

  if (heroVideo) {
    // Handle video loading errors
    heroVideo.addEventListener('error', function() {
      console.log('Hero video failed to load, falling back to poster image');
      this.style.display = 'none';
    });

    // Reduce motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroVideo.pause();
      heroVideo.style.display = 'none';
    }
  }

  // ============================================
  // News Page - Dynamic Content Loading
  // ============================================
  const newsContainer = document.getElementById('news-container');

  if (newsContainer) {
    loadNews();
  }

  async function loadNews() {
    try {
      const response = await fetch('data/news.json');
      if (!response.ok) throw new Error('Failed to load news');

      const data = await response.json();
      renderNews(data.news);
    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback content is already in noscript tag
      renderFallbackNews();
    }
  }

  function renderNews(newsItems) {
    if (!newsItems || newsItems.length === 0) {
      newsContainer.innerHTML = '<p class="text-center">No news available at this time.</p>';
      return;
    }

    const html = newsItems.map(function(item) {
      const thumbnailHtml = item.thumbnail
        ? `<img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.source)}" class="news-thumbnail" loading="lazy">`
        : `<div class="news-thumbnail news-thumbnail-placeholder"><span>${escapeHtml(item.source)}</span></div>`;

      return `
        <article class="news-card">
          ${thumbnailHtml}
          <div class="news-content">
            <span class="news-source">${escapeHtml(item.source)}</span>
            <h3 class="news-headline">${escapeHtml(item.headline)}</h3>
            <p class="news-date">${escapeHtml(item.date)}</p>
            <a
              href="${escapeHtml(item.url)}"
              class="news-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Article &rarr;
            </a>
          </div>
        </article>
      `;
    }).join('');

    newsContainer.innerHTML = html;
  }

  function renderFallbackNews() {
    // Static fallback if JSON fails to load
    const fallbackNews = [
      {
        headline: "Liim: Billboard's Hip-Hop Rookie of the Month",
        source: "Billboard",
        date: "November 2025",
        thumbnail: "",
        url: "https://www.billboard.com/music/rb-hip-hop/liim-billboard-hip-hop-rookie-of-the-month-november-2025-1236098831/"
      },
      {
        headline: "Liim Lasalle Opens Up on Love, Loss and His Debut Album",
        source: "BET",
        date: "2024",
        thumbnail: "",
        url: "https://www.bet.com/article/hjqjah/liim-lasalle-opens-up-on-love-loss-and-his-debut-album-liim-lasalle-loves-you"
      },
      {
        headline: "Liim Is Ready to Take Over New York",
        source: "Rolling Stone",
        date: "2024",
        thumbnail: "",
        url: "https://www.rollingstone.com/music/music-features/liim-new-york-rapper-debut-album-interview-1235425442/"
      }
    ];

    renderNews(fallbackNews);
  }

  // ============================================
  // Utility Functions
  // ============================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Intersection Observer for Animations
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements that should animate on scroll
  document.querySelectorAll('.browser-window, .show-card, .merch-card, .video-card, .news-card').forEach(function(el) {
    observer.observe(el);
  });

  // ============================================
  // Marquee Animation Enhancement
  // ============================================
  const marquee = document.querySelector('.marquee');

  if (marquee) {
    // Pause marquee on hover
    marquee.addEventListener('mouseenter', function() {
      this.style.animationPlayState = 'paused';
    });

    marquee.addEventListener('mouseleave', function() {
      this.style.animationPlayState = 'running';
    });
  }

  // ============================================
  // Console Easter Egg
  // ============================================
  console.log('%c LIIM LASALLE ', 'background: #2d4a3e; color: #f5f0e6; font-size: 24px; font-weight: bold; padding: 10px 20px;');
  console.log('%c liim.nyc ', 'color: #2d4a3e; font-size: 14px;');
  console.log('%c NYC\'s New Sound ', 'color: #666; font-style: italic;');

})();
