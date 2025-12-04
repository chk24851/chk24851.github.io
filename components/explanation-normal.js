async function loadAndInitializeNormal(dataUrl, characterKey) {
    try {
        const response = await fetch(dataUrl);
        const data = await response.json();
        const pageConfig = data[characterKey];
        const stageLabels = data.stageLabels;
        
        if (!pageConfig) return;
        
        pageConfig.stageLabels = stageLabels;
        initializeExplanationPage(pageConfig);
    } catch (error) {
        console.error('Failed to load normal data:', error);
    }
}

function initializeExplanationPage(pageConfig) {
    if (!pageConfig) return;
    
    const stageData = pageConfig.stageData || {};
    const videoFrame = document.getElementById('videoFrame');
    const videoId = pageConfig.videoId;
    const stageLabels = pageConfig.stageLabels || [];
    let currentStage = 1;

    // ページタイトル設定
    const h1 = document.querySelector('h1');
    if (h1) h1.textContent = pageConfig.title;
    
    const defaultMsg = document.querySelector('#content-default p');
    if (defaultMsg) defaultMsg.textContent = 'タイムスタンプを選択してください。';

    // ドロップダウン初期化
    const dropdown = document.getElementById('stage-dropdown');
    if (dropdown) {
        stageLabels.forEach(function(label, index) {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = label;
            dropdown.appendChild(option);
        });
        
        dropdown.addEventListener('change', function(e) {
            currentStage = parseInt(e.target.value);
            renderTimestamps(currentStage);
            showDefaultContent();
        });
    }

    // 前後ボタン
    const prevBtn = document.getElementById('prev-stage');
    const nextBtn = document.getElementById('next-stage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentStage = Math.max(1, currentStage - 1);
            if (dropdown) dropdown.value = currentStage;
            renderTimestamps(currentStage);
            showDefaultContent();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const maxStage = Object.keys(stageData).length;
            currentStage = Math.min(maxStage, currentStage + 1);
            if (dropdown) dropdown.value = currentStage;
            renderTimestamps(currentStage);
            showDefaultContent();
        });
    }

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
            a.textContent = ts.label || 'タイムスタンプ';
            
            a.addEventListener('click', function(e) {
                e.preventDefault();
                jumpToTimestamp(stage, index);
            });
            
            li.appendChild(a);
            listContainer.appendChild(li);
        });
    }

    function jumpToTimestamp(stage, index) {
        const ts = stageData[stage] ? stageData[stage].timestamps[index] : null;
        if (!ts) return;
        
        if (videoId && videoFrame) {
            videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + ts.time + '&autoplay=1';
        }
        
        // コンテンツ表示
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        const contentId = 'content-' + stage + '-' + index;
        const selectedContent = document.getElementById(contentId);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
    }

    function showDefaultContent() {
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        const defaultContent = document.getElementById('content-default');
        if (defaultContent) defaultContent.classList.remove('hidden');
    }

    // 初期化
    renderTimestamps(1);
    if (videoId && videoFrame) {
        videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    }
    showDefaultContent();
}
