const CONSTANTS = {
  LINKS: {
    home: '/index.html',
    about: '/about/index.html',
    blog: '/blog/index.html',
    sitemap: '/sitemap.html'
  },
  VALID_DIFFICULTIES: ['normal', 'extra', 'phantasm'],
  VALID_ROUTES: ['final_a', 'final_b'],
  ROUTE_PATTERN: /^[abc][12]$/,
  SITE_TITLE: "Chikoi's Nook",
  FOOTER_CREDIT: '&copy; 2026 ちこい',
  INVALID_PARAMS_ERROR: '無効なパラメータです',
  RATING_LABELS: {
    '1': 'やさしい',
    '2': 'すこしやさしい',
    '3': 'ふつう',
    '4': 'すこしむずかしい',
    '5': 'むずかしい'
  }
};

function showErrorMessage(message) {
  const banner = document.getElementById('error-banner');
  if (!banner) return;
  
  const messageText = document.getElementById('error-message-text');
  if (messageText) {
    messageText.textContent = message;
  }
  banner.style.display = 'block';
}

function redirectWithError(url) {
  sessionStorage.setItem('errorMessage', CONSTANTS.INVALID_PARAMS_ERROR);
  window.location.href = url;
}

function validateGameParameters(config) {
  const params = new URLSearchParams(window.location.search);
  
  if (config.difficulty) {
    const difficulty = params.get('difficulty');
    if (difficulty && !CONSTANTS.VALID_DIFFICULTIES.includes(difficulty)) {
      redirectWithError('/index.html');
      return false;
    }
  }
  
  if (config.route) {
    const route = params.get('route');
    if (route && !CONSTANTS.VALID_ROUTES.includes(route) && !CONSTANTS.ROUTE_PATTERN.test(route)) {
      redirectWithError('/index.html');
      return false;
    }
  }
  
  return true;
}

function initializeErrorBanner() {
  const errorMessage = sessionStorage.getItem('errorMessage');
  if (errorMessage) {
    showErrorMessage(errorMessage);
    sessionStorage.removeItem('errorMessage');
  }
}

function getPageContext() {
  const links = CONSTANTS.LINKS;
  
  const pathname = window.location.pathname;
  let breadcrumb = null;
  
  if (pathname.includes('/blog/') && !pathname.endsWith('/blog/index.html') && pathname !== '/blog/') {
    breadcrumb = generateBreadcrumb(pathname);
  }
  
  return { links, breadcrumb };
}

function generateBreadcrumb(pathname) {
  const pathParts = pathname.split('/').filter(p => p && p !== 'blog' && p !== 'index.html');
  
  const breadcrumb = [];
  
  breadcrumb.push({ label: '', href: '/blog/index.html' });
  
  let currentPath = '/blog';
  for (let i = 0; i < pathParts.length - 1; i++) {
    currentPath += `/${pathParts[i]}`;
    breadcrumb.push({ label: '', href: `${currentPath}/index.html` });
  }
  
  const isGameWithQuery = pathParts.length === 1 && /^th\d+$/.test(pathParts[0]) && window.location.search !== '';
  const finalHref = isGameWithQuery ? `/blog/${pathParts[0]}/index.html` : null;
  breadcrumb.push({ label: '', href: finalHref });
  
  return breadcrumb;
}

const TITLE_CACHE = {};

function getTitleFromFile(filePath) {
  const cacheKey = `${filePath}:title`;
  
  if (TITLE_CACHE[cacheKey]) {
    return Promise.resolve(TITLE_CACHE[cacheKey]);
  }
  
  return fetch(filePath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const element = doc.querySelector('title');
      if (!element) {
        throw new Error(`Title element not found in ${filePath}`);
      }
      const title = element.textContent;
      TITLE_CACHE[cacheKey] = title;
      return title;
    });
}

function loadHeader() {
  const context = getPageContext();

  return Promise.all([
    getTitleFromFile(context.links.about),
    getTitleFromFile(context.links.blog),
    getTitleFromFile(context.links.sitemap)
  ]).then(([aboutTitle, blogTitle, sitemapTitle]) => {
    const headerHTML = `
      <header>
        <div class="header-content">
          <a href="${context.links.home}" class="header-title">${CONSTANTS.SITE_TITLE}</a>
          <button class="hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="header-nav-mobile">
            <span></span><span></span><span></span>
          </button>
          <nav id="header-nav" class="header-nav-desktop">
            <ul>
              <li><a href="${context.links.about}">${aboutTitle}</a></li>
              <li><a href="${context.links.blog}">${blogTitle}</a></li>
              <li><a href="${context.links.sitemap}">${sitemapTitle}</a></li>
            </ul>
          </nav>
        </div>
        <nav id="header-nav-mobile" class="header-nav-mobile">
          <ul>
            <li><a href="${context.links.about}">${aboutTitle}</a></li>
            <li><a href="${context.links.blog}">${blogTitle}</a></li>
            <li><a href="${context.links.sitemap}">${sitemapTitle}</a></li>
          </ul>
        </nav>
      </header>`;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    const hamburger = document.querySelector('.hamburger');
    const navMobile = document.getElementById('header-nav-mobile');
    const header = document.querySelector('header');
    
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isOpen);
      navMobile.classList.toggle('open');
    });
    
    const mobileLinks = navMobile.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        navMobile.classList.remove('open');
      });
    });
    
    document.addEventListener('click', (e) => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      if (isOpen && !header.contains(e.target)) {
        hamburger.setAttribute('aria-expanded', 'false');
        navMobile.classList.remove('open');
      }
    });
    }).catch(() => {
    
  }).then(() => {
    document.body.style.display = 'block';
  });
}

async function loadBreadcrumb() {
  const context = getPageContext();
  
  if (!context.breadcrumb) {
    return;
  }
  
  const pathname = window.location.pathname;
  
  const titlePromises = context.breadcrumb.map(item => {
    if (item.label === '') {
      let filePath;
      if (item.href === null) {
        filePath = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
      } else {
        filePath = item.href;
      }
      return getTitleFromFile(filePath).catch(() => 'Untitled');
    } else {
      return Promise.resolve(item.label);
    }
  });
  
  const titles = await Promise.all(titlePromises);
  
  const breadcrumbWithTitles = context.breadcrumb.map((item, index) => ({
    ...item,
    label: titles[index]
  }));
  
  const breadcrumbHTML = `<div id="breadcrumb-nav" style="margin-bottom: 20px; font-size: 14px; color: #999;">` + 
    breadcrumbWithTitles.map(item => 
      item.href 
        ? `<a href="${item.href}" style="color: #d97037; text-decoration: none;">${item.label}</a>`
        : `<span>${item.label}</span>`
    ).join(' > ') + 
    `</div>`;
  
  const container = document.querySelector('.container');
  container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
}

function loadFooter() {
  return new Promise(resolve => {
    const footerHTML = `
    <footer>
      <div class="footer">
        <p>${CONSTANTS.FOOTER_CREDIT}</p>
        <div class="footer-links">
          <a href="https://www.youtube.com/@chikoi" target="_blank" rel="noopener noreferrer">▶</a>
          <a href="https://x.com/chk24851" target="_blank" rel="noopener noreferrer">𝕏</a>
        </div>
      </div>
    </footer>
    <button id="scroll-btn">↑</button>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
  
  const scrollTopBtn = document.getElementById('scroll-btn');
  
  let isScrolling = false;
  const toggleScrollTopBtn = () => {
    if (isScrolling) return;
    isScrolling = true;
    
    if (window.scrollY > 100) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
    
    setTimeout(() => { isScrolling = false; }, 100);
  };
  
  window.addEventListener('scroll', toggleScrollTopBtn);
  
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  resolve();
  });
}

function setFavicon() {
  const faviconSVG = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' text-anchor='middle' x='50'>🐮</text></svg>";
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconSVG;
  document.head.appendChild(link);
}

function setSiteTitle() {
  const currentTitle = document.title;
  document.title = `${currentTitle} - ${CONSTANTS.SITE_TITLE}`;
}

function initializePage() {
  setFavicon();
  initializeErrorBanner();
  setSiteTitle();
}

async function loadPageContent() {
  await loadHeader();
  await loadFooter();
  await loadBreadcrumb();
}

function triggerContainerAnimation() {
  const container = document.querySelector('.container');
  if (container) {
    container.style.animation = 'none';
    setTimeout(() => {
      container.style.animation = '';
    }, 10);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initializePage();
  await loadPageContent();
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    triggerContainerAnimation();
  }
});