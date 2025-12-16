function getPageContext() {
  const pathname = window.location.pathname;
  const isHomePage = pathname === '/' || (pathname.endsWith('/index.html') && !pathname.includes('/achievements/') && !pathname.includes('/blog/'));

  const getRelativePath = (depth) => {
    return Array(depth).fill('..').join('/');
  };

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

function getTitleFromPage(filePath) {
  return fetch(filePath)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.querySelector('h1').textContent;
    });
}

function getTitleFromPageByTitle(filePath) {
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
    getTitleFromPageByTitle(context.links.home),
    getTitleFromPageByTitle(context.links.achievements),
    getTitleFromPageByTitle(context.links.blog),
    getTitleFromPageByTitle(context.links.sitemap)
  ]).then(([homeTitle, achievementsTitle, blogTitle, sitemapTitle]) => {
    const headerHTML = `
      <header>
        <nav>
          <ul>
            <li><a href="${context.links.home}">${homeTitle}</a></li>
            <li><a href="${context.links.achievements}">${achievementsTitle}</a></li>
            <li><a href="${context.links.blog}">${blogTitle}</a></li>
            <li><a href="${context.links.sitemap}">${sitemapTitle}</a></li>
          </ul>
        </nav>
      </header>`;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    if (context.breadcrumb) {
      const processBreadcrumb = async () => {
        const breadcrumbWithTitles = [];
        
        for (const item of context.breadcrumb) {
          if (item.label === '') {
            try {
              const filePath = item.href || './';
              const title = await getTitleFromPageByTitle(filePath);
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
        
        const insertBreadcrumb = () => {
          const container = document.querySelector('.container');
          if (container) {
            container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
          } else {
            setTimeout(insertBreadcrumb, 50);
          }
        };
        insertBreadcrumb();
      };
      
      processBreadcrumb();
    }
  }).catch(error => {
    console.error('ヘッダー読み込みエラー:', error);
  }).finally(() => {
    document.body.style.display = 'block';
  });
}

function loadFooter() {
  const footerHTML = `
    <footer>
      <p>&copy; 2025 ちこい</p>
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

  getTitleFromPage(context.links.home).then(h1FromHome => {
    getTitleFromPageByTitle(context.links.home).then(titleFromHome => {
      const currentTitle = document.title;

      if (!currentTitle.includes(' - ')) {
        if (context.isHomePage && titleFromHome === h1FromHome) {
          return;
        } else {
          document.title = `${currentTitle} - ${h1FromHome}`;
        }
      }
    });
  });
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