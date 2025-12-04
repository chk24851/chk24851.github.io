function initializeExplanationPage(timestamps, contentIds) {
    if (typeof contentIds === 'undefined') contentIds = {};
    
    const videoFrame = document.getElementById('videoFrame');
    const videoId = videoFrame ? videoFrame.dataset.videoId : null;

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
        
        const contentId = contentIds[index] || ('content-' + index);
        const selectedContent = document.getElementById(contentId);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
    }

    renderTimestamps();
    
    if (videoId && videoFrame) {
        videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    }
    
    const defaultContent = document.getElementById('content-default');
    if (defaultContent) defaultContent.classList.remove('hidden');
}
