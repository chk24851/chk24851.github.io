// header.js - Consolidated header generation for all pages

const headerHTML = `<header><nav><ul>
    <li><a href="/index.html">ちこいアーカイブ</a></li>
    <li><a href="/about/index.html">自己紹介</a></li>
    <li><a href="/blog/">ブログ</a></li>
    <li><a href="/sitemap.html">サイトマップ</a></li>
</ul></nav></header>`;

// DOMContentLoaded と window.onload の両方で実行
function injectHeader() {
    const body = document.body;
    if (body) {
        body.insertAdjacentHTML('afterbegin', headerHTML);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
} else {
    injectHeader();
}

