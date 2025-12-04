function loadHeader() {
  const pathname = window.location.pathname;
  let links;

  if (pathname.includes('/blog/th')) {
    links = {
      home: '../../index.html',
      about: '../../about/index.html',
      blog: '../index.html',
      sitemap: '../../sitemap.html'
    };
  } else if (pathname.includes('/blog/')) {
    links = {
      home: '../index.html',
      about: '../about/index.html',
      blog: 'index.html',
      sitemap: '../sitemap.html'
    };
  } else if (pathname.includes('/about/') || pathname.includes('/gallery/')) {
    links = {
      home: '../index.html',
      about: 'index.html',
      blog: '../blog/index.html',
      sitemap: '../sitemap.html'
    };
  } else {
    links = {
      home: 'index.html',
      about: 'about/index.html',
      blog: 'blog/index.html',
      sitemap: 'sitemap.html'
    };
  }

  const headerHTML = `
    <header>
      <nav>
        <ul>
          <li><a href="${links.home}">ちこいアーカイブ</a></li>
          <li><a href="${links.about}">自己紹介</a></li>
          <li><a href="${links.blog}">ブログ</a></li>
          <li><a href="${links.sitemap}">サイトマップ</a></li>
        </ul>
      </nav>
    </header>`;

  document.body.insertAdjacentHTML('afterbegin', headerHTML);
}

function loadFooter() {
  const footerHTML = `
    <footer>
      <p>&copy; 2025 ちこい. All rights reserved.</p>
    </footer>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
}

function setFavicon() {
  const favicon = document.querySelector('link[rel="icon"]');
  const faviconSVG = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' text-anchor='middle' x='50'>🐮</text></svg>";

  if (favicon) {
    favicon.href = faviconSVG;
  } else {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconSVG;
    document.head.appendChild(link);
  }
}

function initializeHTML() {
  const pathname = window.location.pathname;
  let cssPath = 'style.css';

  if (pathname.includes('/blog/th')) {
    cssPath = '../../style.css';
  } else if (pathname.includes('/blog/') || pathname.includes('/about/') || pathname.includes('/gallery/')) {
    cssPath = '../style.css';
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssPath;

  if (!document.querySelector('link[rel="stylesheet"]')) {
    document.head.appendChild(link);
  }

  setFavicon();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeHTML();
  loadHeader();
  loadFooter();
});