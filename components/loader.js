function getPageContext() {
  const pathname = window.location.pathname;
  const isHomePage = pathname === '/' || (pathname.endsWith('/index.html') && !pathname.includes('/about/') && !pathname.includes('/blog/') && !pathname.includes('/gallery/'));

  if (pathname.includes('/blog/th') || pathname.includes('/blog/alco') || pathname.includes('/blog/tmgc')) {
    return {
      isHomePage,
      links: {
        home: '../../index.html',
        about: '../../about/index.html',
        blog: '../index.html',
        sitemap: '../../sitemap.html'
      },
      css: '../../style.css'
    };
  } else if (pathname.includes('/blog/')) {
    return {
      isHomePage,
      links: {
        home: '../index.html',
        about: '../about/index.html',
        blog: 'index.html',
        sitemap: '../sitemap.html'
      },
      css: '../style.css'
    };
  } else if (pathname.includes('/about/') || pathname.includes('/gallery/')) {
    return {
      isHomePage,
      links: {
        home: '../index.html',
        about: 'index.html',
        blog: '../blog/index.html',
        sitemap: '../sitemap.html'
      },
      css: '../style.css'
    };
  } else {
    return {
      isHomePage,
      links: {
        home: 'index.html',
        about: 'about/index.html',
        blog: 'blog/index.html',
        sitemap: 'sitemap.html'
      },
      css: 'style.css'
    };
  }
}

function getTitleFromPage(filePath) {
  return fetch(filePath)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.querySelector('title').textContent;
    });
}

function loadHeader() {
  const context = getPageContext();

  Promise.all([
    getTitleFromPage(context.links.home),
    getTitleFromPage(context.links.about),
    getTitleFromPage(context.links.blog),
    getTitleFromPage(context.links.sitemap)
  ]).then(([homeTitle, aboutTitle, blogTitle, sitemapTitle]) => {
    const headerHTML = `
      <header>
        <nav>
          <ul>
            <li><a href="${context.links.home}">${homeTitle}</a></li>
            <li><a href="${context.links.about}">${aboutTitle}</a></li>
            <li><a href="${context.links.blog}">${blogTitle}</a></li>
            <li><a href="${context.links.sitemap}">${sitemapTitle}</a></li>
          </ul>
        </nav>
      </header>`;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  }).catch(error => {
    console.error('ヘッダー読み込みエラー:', error);
  }).finally(() => {
    document.body.style.display = 'block';
  });
}

function loadFooter() {
  const footerHTML = `
    <footer>
      <p>&copy; 2025 ちこい. All rights reserved.</p>
    </footer>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
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

  if (!context.isHomePage) {
    getTitleFromPage(context.links.home).then(homePageTitle => {
      const currentTitle = document.title;

      if (!currentTitle.includes(' - ')) {
        document.title = `${currentTitle} - ${homePageTitle}`;
      }
    });
  }
}

function initializeHTML() {
  const head = document.head;
  
  if (!document.querySelector('meta[charset]')) {
    const charsetMeta = document.createElement('meta');
    charsetMeta.setAttribute('charset', 'UTF-8');
    head.insertBefore(charsetMeta, head.firstChild);
  }
  
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewportMeta = document.createElement('meta');
    viewportMeta.setAttribute('name', 'viewport');
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    head.insertBefore(viewportMeta, head.querySelector('title') || head.firstChild);
  }

  const context = getPageContext();

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = context.css;

  if (!document.querySelector('link[rel="stylesheet"]')) {
    document.head.appendChild(link);
  }

  setFavicon();
  setSiteTitle();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeHTML();
  loadHeader();
  loadFooter();
});