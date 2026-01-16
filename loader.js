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
        blog: `${blogPrefix}/index.html`,
        sitemap: `${prefix}/sitemap.html`
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
        blog: `${blogLink}/index.html`,
        sitemap: `${prefix}/sitemap.html`
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
        blog: 'index.html',
        sitemap: `${prefix}/sitemap.html`
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
        blog: `${prefix}/blog/index.html`,
        sitemap: `${prefix}/sitemap.html`
      },
      css: `${prefix}/style.css`
    };
  } else {
    return {
      isHomePage,
      links: {
        home: 'index.html',
        achievements: 'achievements/index.html',
        blog: 'blog/index.html',
        sitemap: 'sitemap.html'
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
    getTitleFromFile(context.links.blog, 'title'),
    getTitleFromFile(context.links.sitemap, 'title')
  ]).then(([homeTitle, achievementsTitle, blogTitle, sitemapTitle]) => {
    const headerHTML = `
      <header>
        <button id="hamburger-menu" aria-label="メニューを開く">☰</button>
        <nav id="header-nav">
          <ul>
            <li><a href="${context.links.home}">${homeTitle}</a></li>
            <li><a href="${context.links.achievements}">${achievementsTitle}</a></li>
            <li><a href="${context.links.blog}">${blogTitle}</a></li>
            <li><a href="${context.links.sitemap}">${sitemapTitle}</a></li>
          </ul>
        </nav>
      </header>`;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const hamburgerBtn = document.getElementById('hamburger-menu');
    const headerNav = document.getElementById('header-nav');

    hamburgerBtn.addEventListener('click', () => {
      headerNav.classList.toggle('active');
      hamburgerBtn.setAttribute('aria-expanded', headerNav.classList.contains('active'));
    });

    document.querySelectorAll('#header-nav a').forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('header') && headerNav.classList.contains('active')) {
        headerNav.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
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
          <a href="https://www.youtube.com/@chikoi" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
          <a href="https://x.com/chk24851" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
        </div>
      </div>
    </footer>
    <button id="scroll-top-btn" aria-label="ページトップへ">↑</button>`;

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

function setOGPTags() {
  const pageTitle = document.title;
  const pageUrl = window.location.href;
  const ogpImage = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'><rect fill='%23d97037' width='1200' height='630'/><text y='350' font-size='200' text-anchor='middle' x='600' fill='white'>🐮</text><text y='450' font-size='48' text-anchor='middle' x='600' fill='white'>ちこいアーカイブ</text></svg>";

  const ogpMeta = [
    { property: 'og:title', content: pageTitle },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: ogpImage }
  ];

  ogpMeta.forEach(meta => {
    if (!document.querySelector(`meta[property="${meta.property}"]`)) {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('property', meta.property);
      metaTag.setAttribute('content', meta.content);
      document.head.appendChild(metaTag);
    }
  });
}

function setRobotsMeta() {
  if (!document.querySelector('meta[name="robots"]')) {
    const robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', 'index, follow');
    document.head.appendChild(robotsMeta);
  }
}

function setupPWA() {
  // manifest.json リンク
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }

  // theme-color メタタグ
  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    themeColorMeta.setAttribute('content', '#d97037');
    document.head.appendChild(themeColorMeta);
  }

  // Apple用のアイコン
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect fill="%23d97037" width="180" height="180"/><text y="130" font-size="130" text-anchor="middle" x="90" fill="white">🐮</text></svg>';
    document.head.appendChild(appleTouchIcon);
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

function setupStructuredData() {
  if (document.querySelector('script[type="application/ld+json"]')) {
    return; // 既に存在する場合はスキップ
  }

  const breadcrumbList = generateBreadcrumbList();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ちこいアーカイブ",
    "url": "https://chk24851.github.io/",
    "logo": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect fill='%23d97037' width='200' height='200'/><text y='150' font-size='140' text-anchor='middle' x='100' fill='white'>🐮</text></svg>"
  };

  // Organization スキーマを追加
  const orgScript = document.createElement('script');
  orgScript.type = 'application/ld+json';
  orgScript.textContent = JSON.stringify(organizationSchema);
  document.head.appendChild(orgScript);

  // BreadcrumbList スキーマがある場合は追加
  if (breadcrumbList) {
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.textContent = JSON.stringify(breadcrumbList);
    document.head.appendChild(breadcrumbScript);
  }
}

function generateBreadcrumbList() {
  const path = window.location.pathname;
  
  // ホームページの場合はスキップ
  if (path === '/' || path === '/index.html') {
    return null;
  }

  const segments = path.split('/').filter(s => s && s !== 'index.html');
  const breadcrumbs = [];
  let currentPath = '';

  // ホーム
  breadcrumbs.push({
    "@type": "ListItem",
    "position": 1,
    "name": "ホーム",
    "item": "https://chk24851.github.io/"
  });

  // 各パス段階
  segments.forEach((segment, index) => {
    currentPath += '/' + segment;
    const name = formatBreadcrumbName(segment);
    breadcrumbs.push({
      "@type": "ListItem",
      "position": index + 2,
      "name": name,
      "item": "https://chk24851.github.io" + currentPath + "/"
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };
}

function formatBreadcrumbName(segment) {
  // URLセグメントを日本語表示名に変換
  const nameMap = {
    'blog': 'ブログ',
    'achievements': 'アチーブメント',
    'th6': '東方紅魔郷',
    'th7': '東方妖妖夢',
    'th8': '東方永夜抄',
    'th10': '東方風神録',
    'th11': '東方地霊殿',
    'th12': '東方星蓮船',
    'th128': '東方星蓮船 1.28',
    'th13': '東方神霊廟',
    'th14': '東方輝針城',
    'th15': '東方紺珠伝',
    'th16': '東方天空璋',
    'th17': '東方鬼形獣',
    'th18': '東方虹龍洞',
    'th20': '東方毘沙門天',
    'alco': 'アルコホリック・スパイダー',
    'tmgc': 'トルテルマジック',
    'setup': 'セットアップ'
  };
  return nameMap[segment] || segment;
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
  setOGPTags();
  setRobotsMeta();
  setupPWA();
  setupCSP();
  setupStructuredData();
  setSiteTitle();
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeHTML();
  initializeErrorBanner();
  await loadHeader();
  loadFooter();
});