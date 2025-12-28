async function loadAndInitializeExtra(dataUrl, characterKey, difficulty = 'extra') {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();

    let pageConfig = data[characterKey];

    if (!pageConfig) {
      const match = window.location.pathname.match(/\/(th\d+)\//);
      if (match) {
        const gameKey = match[1];
        sessionStorage.setItem('errorMessage', '無効なパラメータです');
        window.location.href = `../${gameKey}/index.html`;
      }
      return;
    }

    const originalLabel = pageConfig.label;
    pageConfig.title = difficulty === 'phantasm' ? `【Phantasm】${pageConfig.label}` : `【Extra】${pageConfig.label}`;
    pageConfig.originalTitle = originalLabel;
    pageConfig.characterKey = characterKey;

    initializeExplanationPage(pageConfig, data);
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
  }
}

function getYouTubeEmbedUrl(videoId, startTime = 0) {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}

function initializeExplanationPage(pageConfig, data) {
  if (!pageConfig) return;

  const timestamps = pageConfig.timestamps || [];
  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;
  const listContainer = document.querySelector('#timestamps-list ul');
  const contentPanel = document.getElementById('content-panel');
  const videoPanel = document.querySelector('.video-panel');
  const timestampsPanel = document.querySelector('.timestamps-panel');
  const defaultContent = document.getElementById('content-default');

  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = pageConfig.title;

  const defaultH3 = document.querySelector('#content-default h3');
  if (defaultH3) defaultH3.textContent = pageConfig.originalTitle || pageConfig.title;

  const characterMsg = document.querySelector('#content-default #character-message');
  if (characterMsg) characterMsg.textContent = pageConfig.description || '';

  const instructionMsg = document.querySelector('#content-default #instruction-message');
  if (instructionMsg) instructionMsg.textContent = '※タイムスタンプを選択すると説明が表示されます。';

  const getStampContentsElements = () => contentPanel.querySelectorAll('.stamp-content');

  const getAllTimestamps = () => {
    let allTimestamps = [];
    
    if (data && data.common && data.common.timestamps && Array.isArray(data.common.timestamps)) {
      data.common.timestamps.forEach((ts) => {
        if (!ts.label || !ts.description) {
          return;
        }
        
        let timeValue = ts.time;
        if (typeof ts.time === 'object' && ts.time !== null) {
          timeValue = ts.time[pageConfig.characterKey];
        }
        
        if (timeValue === undefined || timeValue === null) {
          return;
        }
        
        allTimestamps.push({
          time: timeValue,
          label: ts.label,
          content: ts.description,
          type: 'common'
        });
      });
    }
    
    if (timestamps && Array.isArray(timestamps)) {
      timestamps.forEach((ts) => {
        if (!ts.time || !ts.label || !ts.description) {
          return;
        }
        allTimestamps.push({
          time: ts.time,
          label: ts.label,
          content: ts.description,
          type: 'individual'
        });
      });
    }
    
    return allTimestamps.sort((a, b) => a.time - b.time);
  };

  function renderTimestamps() {
    const allTimestamps = getAllTimestamps();
    
    if (!listContainer) return;

    listContainer.innerHTML = '';
    getStampContentsElements().forEach(el => {
      if (el.id !== 'content-default') el.remove();
    });

    if (allTimestamps.length === 0) {
      const li = document.createElement('li');
      li.textContent = '（タイムスタンプなし）';
      li.style.textAlign = 'center';
      li.style.opacity = '0.5';
      listContainer.appendChild(li);
      return;
    }

    allTimestamps.forEach((ts, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'timestamp-link';
      a.textContent = ts.label;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToTimestamp(index);
      });

      li.appendChild(a);
      listContainer.appendChild(li);

      const contentId = `content-${index}`;
      const contentDiv = document.createElement('div');
      contentDiv.id = contentId;
      contentDiv.className = 'stamp-content hidden';
      contentDiv.innerHTML = `<h3>${ts.label}</h3><p>${ts.content || ''}</p>`;
      contentPanel.appendChild(contentDiv);
    });
  }

  function jumpToTimestamp(index) {
    const allTimestamps = getAllTimestamps();
    const ts = allTimestamps && allTimestamps[index] ? allTimestamps[index] : null;
    if (!ts) return;

    if (videoId && videoFrame) {
      videoFrame.src = getYouTubeEmbedUrl(videoId, ts.time);
    }

    getStampContentsElements().forEach(el => el.classList.add('hidden'));

    const contentId = `content-${index}`;
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
      selectedContent.classList.remove('hidden');
    }
  }

  function showDefaultContent() {
    getStampContentsElements().forEach(el => el.classList.add('hidden'));
    if (defaultContent) defaultContent.classList.remove('hidden');
  }

  renderTimestamps();
  if (videoId && videoFrame) {
    videoFrame.src = getYouTubeEmbedUrl(videoId);
  }
  showDefaultContent();

  const SYNC_DELAY = 100;
  const syncPanelHeights = () => {
    videoPanel && timestampsPanel && (timestampsPanel.style.height = videoPanel.getBoundingClientRect().height + 'px');
  };

  if (window.lastSyncPanelHeights) {
    ['load', 'resize'].forEach(event => window.removeEventListener(event, window.lastSyncPanelHeights));
  }
  window.lastSyncPanelHeights = syncPanelHeights;
  ['load', 'resize'].forEach(event => window.addEventListener(event, syncPanelHeights));
  setTimeout(syncPanelHeights, SYNC_DELAY);
}