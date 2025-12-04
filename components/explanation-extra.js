function initializeExplanationPage(pageConfig) {
    if (typeof pageConfig === 'undefined' || !pageConfig) return;
    
    const timestamps = pageConfig.timestamps || [];
    const videoFrame = document.getElementById('videoFrame');
    const videoId = pageConfig.videoId || (videoFrame ? videoFrame.dataset.videoId : null);

    if (pageConfig.title) {
        document.title = pageConfig.title;
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = pageConfig.title;
    }

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

    function jumpToTimestamp(index) {
        const ts = timestamps[index];
        if (!ts) return;
        
        const seconds = ts.time;
        
        if (videoId && videoFrame) {
            videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + seconds + '&autoplay=1';
        }
        
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        const contentId = 'content-' + index;
        const selectedContent = document.getElementById(contentId);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
            if (ts.label) {
                const h3 = selectedContent.querySelector('h3');
                if (h3) h3.textContent = ts.label;
            }
            if (ts.content) {
                const p = selectedContent.querySelector('p');
                if (p) p.textContent = ts.content;
            }
        } else if (ts.label || ts.content) {
            const newDiv = document.createElement('div');
            newDiv.id = contentId;
            newDiv.className = 'stamp-content';
            if (ts.label) {
                const h3 = document.createElement('h3');
                h3.textContent = ts.label;
                newDiv.appendChild(h3);
            }
            if (ts.content) {
                const p = document.createElement('p');
                p.textContent = ts.content;
                newDiv.appendChild(p);
            }
            document.getElementById('content-panel').appendChild(newDiv);
            newDiv.classList.remove('hidden');
        }
    }

    function updateDefaultContent() {
        const defaultContent = document.getElementById('content-default');
        if (defaultContent) {
            const h3 = defaultContent.querySelector('h3');
            if (h3 && pageConfig.title) h3.textContent = pageConfig.title;
            
            const p = defaultContent.querySelector('p');
            if (p) p.textContent = 'タイムスタンプを選択してください。';
        }
    }

    updateDefaultContent();
    renderTimestamps();
    
    if (videoId && videoFrame) {
        videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    }
    
    const defaultContent = document.getElementById('content-default');
    if (defaultContent) defaultContent.classList.remove('hidden');
}

// fetch してデータを読み込む（HTMLから呼び出し時に使用）
async function loadAndInitializeExtra(dataUrl, characterKey) {
    try {
        const response = await fetch(dataUrl);
        const data = await response.json();
        const pageConfig = data[characterKey];
        if (pageConfig) {
            initializeExplanationPage(pageConfig);
        }
    } catch (error) {
        console.error('Failed to load extra data:', error);
    }
}
