/**
 * Normal難度用解説ページ共通JavaScript
 * 6ステージ対応
 * 
 * 使用方法:
 * 1. HTMLの末尾で読み込む: <script src="../../components/explanation-normal.js"></script>
 * 2. data-video-idを設定
 * 3. stageDataとcontentIdsを定義して、initializeExplanationPage()を呼び出す
 */

function initializeExplanationPage(stageData, contentIds) {
    if (typeof contentIds === 'undefined') contentIds = {};
    
    const videoFrame = document.getElementById('videoFrame');
    const videoId = videoFrame ? videoFrame.dataset.videoId : null;
    let currentStage = 1;

    // タイムスタンプリストをレンダリング
    function renderTimestamps(stage) {
        const timestamps = stageData[stage] ? stageData[stage].timestamps : [];
        const listContainer = document.querySelector('#timestamps-list ul');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        timestamps.forEach(function(ts, index) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'timestamp-link';
            a.dataset.time = ts.time;
            a.dataset.stage = stage;
            a.dataset.index = index;
            a.textContent = ts.label;
            a.tabIndex = 0;
            
            a.addEventListener('click', function(e) {
                e.preventDefault();
                jumpToTimestamp(stage, index);
            });
            
            a.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpToTimestamp(stage, index);
                }
            });
            
            li.appendChild(a);
            listContainer.appendChild(li);
        });
    }

    // コンテンツを切り替え
    function switchStage(stage) {
        currentStage = stage;
        
        // ドロップダウンを更新
        const dropdown = document.getElementById('stage-dropdown');
        if (dropdown) dropdown.value = stage;
        
        // タイムスタンプリストをレンダリング
        renderTimestamps(stage);
        
        // コンテンツをクリア
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        // デフォルトコンテンツを表示
        const defaultContent = document.getElementById('content-default');
        if (defaultContent) defaultContent.classList.remove('hidden');
    }

    // タイムスタンプにジャンプ
    function jumpToTimestamp(stage, index) {
        const ts = stageData[stage] ? stageData[stage].timestamps[index] : null;
        if (!ts) return;
        
        const seconds = ts.time;
        
        if (videoId && videoFrame) {
            videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + seconds + '&autoplay=1';
        }
        
        // コンテンツを表示
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        const contentId = contentIds[stage + '-' + index] || ('content-' + stage + '-' + index);
        const selectedContent = document.getElementById(contentId);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
    }

    // ドロップダウンのイベントリスナー
    const dropdown = document.getElementById('stage-dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', function(e) {
            const stage = parseInt(e.target.value);
            switchStage(stage);
        });
    }

    // 矢印ボタンのイベントリスナー
    const prevBtn = document.getElementById('prev-stage');
    const nextBtn = document.getElementById('next-stage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            const prevStage = Math.max(1, currentStage - 1);
            switchStage(prevStage);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const maxStage = Object.keys(stageData).length;
            const nextStage = Math.min(maxStage, currentStage + 1);
            switchStage(nextStage);
        });
    }

    // 初期ロード
    renderTimestamps(1);
    
    // 動画を初期表示（時間指定なし、自動再生）
    if (videoId && videoFrame) {
        videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    }
    
    // デフォルトコンテンツを表示
    const defaultContent = document.getElementById('content-default');
    if (defaultContent) defaultContent.classList.remove('hidden');
}
