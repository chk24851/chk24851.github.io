function showErrorMessage(message) {
  const banner = document.getElementById('error-message-banner');
  if (!banner) return;
  
  const messageText = document.getElementById('error-message-text');
  messageText.textContent = message;
  banner.style.display = 'block';
}

function redirectWithError(url) {
  sessionStorage.setItem('errorMessage', '無効なパラメータです');
  window.location.href = url;
}

function validateGameParameters(config) {
  const params = new URLSearchParams(window.location.search);
  
  if (config.difficulty) {
    const difficulty = params.get('difficulty');
    if (difficulty && difficulty !== 'normal' && difficulty !== 'extra' && difficulty !== 'phantasm') {
      redirectWithError('index.html');
      return false;
    }
  }
  
  if (config.route) {
    const route = params.get('route');
    if (route && route !== 'final_a' && route !== 'final_b' && 
        !route.match(/^[abc][1-9]\d*$/)) {
      redirectWithError('index.html');
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

const getRelativePath = (depth) => {
  return Array(depth).fill('..').join('/');
};

function getPageContext() {
  const pathname = window.location.pathname;
  const isHomePage = pathname === '/' || (pathname.endsWith('/index.html') && !pathname.includes('/achievements/') && !pathname.includes('/blog/'));

  if (pathname.includes('/blog/tmgc/setup')) {
    const depth = 3;
    const prefix = getRelativePath(depth);
    const blogPrefix = getRelativePath(2);
    const blogLink = getRelativePath(1);
    
    return {
      isHomePage,
      links: {
        home: `${prefix}/index.html`,
        achievements: `${prefix}/achievements/index.html`,
        blog: `${blogPrefix}/index.html`
      },
      css: `${prefix}/style.css`,
      breadcrumb: [
        { label: '', href: `${blogPrefix}/index.html` },
        { label: '', href: `${blogLink}/index.html` },
        { label: '', href: null }
      ]
    };
  } else if (pathname.includes('/blog/th') || pathname.includes('/blog/alco') || pathname.includes('/blog/tmgc')) {
    const match = pathname.match(/\/(th\d+|alco|tmgc)\//);
    const gameKey = match ? match[1] : null;
    const hasQueryParams = window.location.search !== '';
    const gameHref = gameKey && hasQueryParams ? `../${gameKey}/index.html` : null;
    const depth = 2;
    const prefix = getRelativePath(depth);
    const blogLink = getRelativePath(1);

    return {
      isHomePage,
      links: {
        home: `${prefix}/index.html`,
        achievements: `${prefix}/achievements/index.html`,
        blog: `${blogLink}/index.html`
      },
      css: `${prefix}/style.css`,
      breadcrumb: [
        { label: '', href: `${blogLink}/index.html` },
        { label: '', href: gameHref }
      ]
    };
  } else if (pathname.includes('/blog/')) {
    const depth = 1;
    const prefix = getRelativePath(depth);
    
    return {
      isHomePage,
      links: {
        home: `${prefix}/index.html`,
        achievements: `${prefix}/achievements/index.html`,
        blog: 'index.html'
      },
      css: `${prefix}/style.css`
    };
  } else if (pathname.includes('/achievements/')) {
    const depth = 1;
    const prefix = getRelativePath(depth);
    
    return {
      isHomePage,
      links: {
        home: `${prefix}/index.html`,
        achievements: 'index.html',
        blog: `${prefix}/blog/index.html`
      },
      css: `${prefix}/style.css`
    };
  } else {
    return {
      isHomePage,
      links: {
        home: 'index.html',
        achievements: 'achievements/index.html',
        blog: 'blog/index.html'
      },
      css: 'style.css'
    };
  }
}

const titleCache = {};

function getTitleFromFile(filePath, selector) {
  const cacheKey = `${filePath}:${selector}`;
  
  if (titleCache[cacheKey]) {
    return Promise.resolve(titleCache[cacheKey]);
  }
  
  return fetch(filePath)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const title = doc.querySelector(selector).textContent;
      titleCache[cacheKey] = title;
      return title;
    });
}

function loadHeader() {
  const context = getPageContext();

  Promise.all([
    getTitleFromFile(context.links.home, 'title'),
    getTitleFromFile(context.links.achievements, 'title'),
    getTitleFromFile(context.links.blog, 'title')
  ]).then(([homeTitle, achievementsTitle, blogTitle]) => {
    const sitemapHref = context.isHomePage ? 'sitemap.html' : `${getRelativePath(1)}/sitemap.html`;
    const headerHTML = `
      <header>
        <button id="hamburger-menu">☰</button>
        <nav id="header-nav">
          <ul>
            <li><a href="${context.links.home}">${homeTitle}</a></li>
            <li><a href="${context.links.achievements}">${achievementsTitle}</a></li>
            <li><a href="${context.links.blog}">${blogTitle}</a></li>
            <li><a href="${sitemapHref}">サイトマップ</a></li>
          </ul>
        </nav>
      </header>`;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const hamburgerBtn = document.getElementById('hamburger-menu');
    const headerNav = document.getElementById('header-nav');

    hamburgerBtn.addEventListener('click', () => {
      headerNav.classList.toggle('active');
    });

    document.querySelectorAll('#header-nav a').forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('header') && headerNav.classList.contains('active')) {
        headerNav.classList.remove('active');
      }
    });

    if (context.breadcrumb) {
      const processBreadcrumb = async () => {
        const breadcrumbWithTitles = [];
        
        for (const item of context.breadcrumb) {
          if (item.label === '') {
            try {
              const filePath = item.href || './';
              const title = await getTitleFromFile(filePath, 'title');
              breadcrumbWithTitles.push({ ...item, label: title });
            } catch (error) {
              console.error('パンくず取得エラー:', error);
              breadcrumbWithTitles.push(item);
            }
          } else {
            breadcrumbWithTitles.push(item);
          }
        }
        
        const breadcrumbHTML = `<div style="margin-bottom: 20px; font-size: 14px; color: #999;">` + 
          breadcrumbWithTitles.map(item => 
            item.href 
              ? `<a href="${item.href}" style="color: #d97037; text-decoration: none;">${item.label}</a>`
              : `<span>${item.label}</span>`
          ).join(' > ') + 
          `</div>`;
        
        const container = document.querySelector('.container');
        if (container) {
          container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
        }
      };
      
      return processBreadcrumb();
    }
    
    return Promise.resolve();
  }).then(() => {
    document.body.style.display = 'block';
  }).catch(error => {
    console.error('ヘッダー読み込みエラー:', error);
    document.body.style.display = 'block';
  });
}

function loadFooter() {
  const footerHTML = `
    <footer>
      <div class="footer-content">
        <p>&copy; 2026 ちこい</p>
        <div class="footer-links">
          <a href="https://www.youtube.com/@chikoi" target="_blank" rel="noopener noreferrer">▶</a>
          <a href="https://x.com/chk24851" target="_blank" rel="noopener noreferrer">𝕏</a>
        </div>
      </div>
    </footer>
    <button id="scroll-top-btn">↑</button>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
  
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  
  const toggleScrollTopBtn = () => {
    if (window.scrollY > 100) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  };
  
  window.addEventListener('scroll', toggleScrollTopBtn);
  
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
  const context = getPageContext();

  Promise.all([
    getTitleFromFile(context.links.home, 'h1'),
    getTitleFromFile(context.links.home, 'title')
  ]).then(([h1FromHome, titleFromHome]) => {
    const currentTitle = document.title;

    if (!currentTitle.includes(' - ') && titleFromHome !== h1FromHome) {
      document.title = `${currentTitle} - ${h1FromHome}`;
    }
  });
}



function setupPWA() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }

  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    themeColorMeta.setAttribute('content', '#d97037');
    document.head.appendChild(themeColorMeta);
  }
}

function setupCSP() {
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    cspMeta.setAttribute('content', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube.com; base-uri 'self'; form-action 'self';");
    document.head.appendChild(cspMeta);
  }
}

function initializeHTML() {
  const context = getPageContext();

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = context.css;

  if (!document.querySelector('link[rel="stylesheet"]')) {
    document.head.appendChild(link);
  }

  setFavicon();
  setupPWA();
  setupCSP();
  setSiteTitle();
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeHTML();
  initializeErrorBanner();
  await loadHeader();
  loadFooter();
});