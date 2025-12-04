function initializeExplanationPage(stageData, contentIds) {
    if (typeof contentIds === 'undefined') contentIds = {};
    
    const videoFrame = document.getElementById('videoFrame');
    const videoId = videoFrame ? videoFrame.dataset.videoId : null;
    let currentStage = 1;

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

    function switchStage(stage) {
        currentStage = stage;
        
        const dropdown = document.getElementById('stage-dropdown');
        if (dropdown) dropdown.value = stage;
        
        renderTimestamps(stage);
        
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        const defaultContent = document.getElementById('content-default');
        if (defaultContent) defaultContent.classList.remove('hidden');
    }

    function jumpToTimestamp(stage, index) {
        const ts = stageData[stage] ? stageData[stage].timestamps[index] : null;
        if (!ts) return;
        
        const seconds = ts.time;
        
        if (videoId && videoFrame) {
            videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + seconds + '&autoplay=1';
        }
        
        document.querySelectorAll('.stamp-content').forEach(function(el) {
            el.classList.add('hidden');
        });
        
        const contentId = contentIds[stage + '-' + index] || ('content-' + stage + '-' + index);
        const selectedContent = document.getElementById(contentId);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
    }

    const dropdown = document.getElementById('stage-dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', function(e) {
            const stage = parseInt(e.target.value);
            switchStage(stage);
        });
    }

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

    renderTimestamps(1);
    
    if (videoId && videoFrame) {
        videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    }
    
    const defaultContent = document.getElementById('content-default');
    if (defaultContent) defaultContent.classList.remove('hidden');
}
