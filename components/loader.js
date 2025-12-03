// ページのURLに応じてナビゲーションリンクを取得
function getNavigationLinks() {
    const pathname = window.location.pathname;
    
    if (pathname.includes('/blog/th')) {
        // /blog/th*/index.html または /blog/th*/*.html の場合
        return {
            home: '../../index.html',
            about: '../../about/index.html',
            blog: '../index.html',
            sitemap: '../../sitemap.html'
        };
    } else if (pathname.includes('/blog/')) {
        // /blog/index.html の場合
        return {
            home: '../index.html',
            about: '../about/index.html',
            blog: 'index.html',
            sitemap: '../sitemap.html'
        };
    } else if (pathname.includes('/about/') || pathname.includes('/gallery/')) {
        // /about/index.html または /gallery/index.html の場合
        return {
            home: '../index.html',
            about: 'index.html',
            blog: '../blog/index.html',
            sitemap: '../sitemap.html'
        };
    } else {
        // トップページ /index.html の場合
        return {
            home: 'index.html',
            about: 'about/index.html',
            blog: 'blog/index.html',
            sitemap: 'sitemap.html'
        };
    }
}

// ヘッダーをHTMLで生成して挿入
function loadHeader() {
    const links = getNavigationLinks();
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

// フッターをHTMLで生成して挿入
function loadFooter() {
    const footerHTML = `
    <footer>
        <p>&copy; 2025 ちこい. All rights reserved.</p>
    </footer>`;
    
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}

// ページ読み込み時にヘッダーとフッターを挿入
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
});