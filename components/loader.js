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

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
});