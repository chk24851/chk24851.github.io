// header.js - Consolidated header generation for all pages

const headerHTML = `<header><nav><ul>
    <li><a href="/index.html">ちこいアーカイブ</a></li>
    <li><a href="/about/index.html">自己紹介</a></li>
    <li><a href="/blog/">ブログ</a></li>
    <li><a href="/sitemap.html">サイトマップ</a></li>
</ul></nav></header>`;

document.addEventListener('DOMContentLoaded', function() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
});
