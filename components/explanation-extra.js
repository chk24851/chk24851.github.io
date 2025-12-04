/**
 * Extra難度用解説ページ共通JavaScript
 * 単一ステージ対応
 * 
 * 使用方法:
 * 1. HTMLの末尾で読み込む: <script src="../../components/explanation-extra.js"></script>
 * 2. data-video-idを設定
 * 3. timestampsと contentIdsを定義して、initializeExplanationPage()を呼び出す
 */

function initializeExplanationPage(timestamps, contentIds) {
    if (typeof contentIds === 'undefined') contentIds = {};
    
    const videoFrame = document.getElementById('videoFrame');
    const videoId = videoFrame ? videoFrame.dataset.videoId : null;

    // タイムスタンプリストをレンダリング
    function renderTimestamps() {
        const listContainer = document.querySelector('#timestamps-list ul');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        timestamps.forEach(function(ts, index) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'timestamp-link';
            a.dataset.index = index;
            a.textContent = ts.label;
            a.tabIndex = 0;
            
            a.addEventListener('click', function(e) {
                e.preventDefault();
                jumpToTimestamp(index);
            });
            
            a.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpToTimestamp(index);
                }
            });
            
            li.appendChild(a);
            listContainer.appendChild(li);
        });
    }

    // タイムスタンプにジャンプ
    function jumpToTimestamp(index) {
        const ts = timestamps[index];
        if (!ts) return;
        
        const seconds = ts.time;
        
        if (videoId && videoFrame) {
            videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + seconds + '&autoplay=1';
        }
        
        // コンテンツを表示
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        const contentId = contentIds[index] || ('content-' + index);
        const selectedContent = document.getElementById(contentId);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
    }

    // 初期ロード
    renderTimestamps();
    
    // 動画を初期表示（時間指定なし、自動再生）
    if (videoId && videoFrame) {
        videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    }
    
    // デフォルトコンテンツを表示
    const defaultContent = document.getElementById('content-default');
    if (defaultContent) defaultContent.classList.remove('hidden');
}
