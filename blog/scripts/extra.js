async function loadAndInitializeExtra(dataUrl, shottypeKey, difficulty = 'extra', gameKey) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();

  let overviewData = null;
  
  if (gameKey) {
    const overviewResponse = await fetch(`/blog/data/${gameKey}.json`);
    if (overviewResponse.ok) {
      overviewData = await overviewResponse.json();
    }
  }

  const getDisplayLabel = (obj) => {
    return { label: obj.label, shortLabel: obj.shortLabel || obj.label };
  };

  function handleInvalidData() {
    sessionStorage.setItem('errorMessage', CONSTANTS.DATA_NOT_FOUND_ERROR);
    window.location.href = `/blog/${gameKey}/index.html`;
  }
  let pageConfig = data[shottypeKey];
  
  if (!pageConfig) {
    handleInvalidData();
    return;
  }

  if (overviewData) {
    const difficultyKey = difficulty === 'phantasm' ? 'phantasm' : 'extra';
    if (overviewData[difficultyKey]) {
      let overviewItem;
      if (Array.isArray(overviewData[difficultyKey])) {
        overviewItem = overviewData[difficultyKey].find(item => item.shottype === shottypeKey);
      } else {
        overviewItem = overviewData[difficultyKey][shottypeKey];
      }
      if (overviewItem) {
        pageConfig.label = overviewItem.label;
        pageConfig.shortLabel = overviewItem.shortLabel;
      }
    }
  }

  const displayLabel = getDisplayLabel(pageConfig);
  pageConfig.title = generatePageTitle(displayLabel.label, gameKey, difficulty);
  pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
  pageConfig.shottypeKey = shottypeKey;

  initializeExplanationPage(pageConfig, data);
}

function getShottypeTimeValue(timeData, shottypeKey) {
  if (typeof timeData === 'object' && timeData !== null) {
    const shottypeTimeData = timeData[shottypeKey];
    
    if (typeof shottypeTimeData === 'object' && shottypeTimeData !== null && ('a' in shottypeTimeData || 'b' in shottypeTimeData)) {
      return shottypeTimeData.a;
    }
    return shottypeTimeData;
  }
  return timeData;
}

function initializeExplanationPage(pageConfig, data) {
  if (!pageConfig) return;

  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;
  const listContainer = document.querySelector('#timestamps-list ul');
  const contentPanel = document.getElementById('content-panel');
  const videoPanel = document.querySelector('.video-panel');
  const timestampsPanel = document.querySelector('.timestamps-panel');
  const defaultContent = document.getElementById('content-default');

  const h1 = document.querySelector('h1');
  if (h1) {
    if (typeof pageConfig.originalTitle === 'object' && pageConfig.originalTitle !== null) {
      const titlePrefix = pageConfig.title.split(pageConfig.originalTitle.label)[0];
      h1.innerHTML = `${titlePrefix}<span class="label">${pageConfig.originalTitle.label}</span><span class="shortLabel">${pageConfig.originalTitle.shortLabel}</span>`;
    } else {
      h1.textContent = pageConfig.title;
    }
  }

  const defaultH3 = document.querySelector('#content-default h3');
  if (defaultH3) {
    if (typeof pageConfig.originalTitle === 'object' && pageConfig.originalTitle !== null) {
      defaultH3.innerHTML = `<span class="label">${pageConfig.originalTitle.label}</span><span class="shortLabel">${pageConfig.originalTitle.shortLabel}</span>`;
    } else {
      defaultH3.textContent = pageConfig.originalTitle || pageConfig.title;
    }
  }

  const characterMsg = document.querySelector('#content-default #character-message');
  if (characterMsg) characterMsg.innerHTML = pageConfig.description || '';

  const instructionMsg = document.querySelector('#content-default #instruction-message');
  if (instructionMsg) instructionMsg.textContent = '※タイムスタンプを選択すると説明が表示されます。';

  const getStampContentsElements = () => contentPanel.querySelectorAll('.stamp');

  let cachedAllTimestamps = null;

  const mergeTimestamps = () => {
    if (cachedAllTimestamps !== null) {
      return cachedAllTimestamps;
    }

    let allTimestamps = [];
    
    const commonTimestamps = data?.common?.timestamps;
    if (Array.isArray(commonTimestamps)) {
      commonTimestamps.forEach((ts) => {
        if (!ts.label || !ts.description) {
          return;
        }
        
        const timeValue = getShottypeTimeValue(ts.time, pageConfig.shottypeKey);
        
        if (timeValue === undefined || timeValue === null) {
          return;
        }
        
        allTimestamps.push({
          time: timeValue,
          label: ts.label,
          content: ts.description
        });
      });
    }
    
    if (pageConfig.timestamps && Array.isArray(pageConfig.timestamps)) {
      pageConfig.timestamps.forEach((ts) => {
        if (!ts.time || !ts.label || !ts.description) {
          return;
        }
        allTimestamps.push({
          time: ts.time,
          label: ts.label,
          content: ts.description
        });
      });
    }
    
    cachedAllTimestamps = allTimestamps.sort((a, b) => a.time - b.time);
    return cachedAllTimestamps;
  };

  function renderTimestamps() {
    const allTimestamps = mergeTimestamps();
    
    if (!listContainer) return;

    getStampContentsElements().forEach(el => {
      if (el.id !== 'content-default') el.remove();
    });
    listContainer.innerHTML = '';

    if (allTimestamps.length === 0) {
      const li = document.createElement('li');
      li.className = 'no-timestamps';
      li.textContent = '（タイムスタンプなし）';
      li.style.textAlign = 'center';
      li.style.opacity = '0.5';
      listContainer.appendChild(li);
      listContainer.parentElement.classList.add('empty');
      return;
    }

    listContainer.parentElement.classList.remove('empty');

    allTimestamps.forEach((ts, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'timestamp';
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
      contentDiv.className = 'stamp hidden';
      contentDiv.innerHTML = `<h3>${ts.label}</h3><p>${ts.content || ''}</p>`;
      contentPanel.appendChild(contentDiv);
    });
  }

  function jumpToTimestamp(index) {
    const allTimestamps = mergeTimestamps();
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
    if (window.innerWidth <= 768) {
      timestampsPanel.style.height = '';
      const container = document.querySelector('.video-container');
      if (container && timestampsPanel) {
        const containerHeight = container.getBoundingClientRect().height;
        timestampsPanel.style.maxHeight = containerHeight + 'px';
      }
    } else {
      timestampsPanel.style.maxHeight = '';
      videoPanel && timestampsPanel && (timestampsPanel.style.height = videoPanel.getBoundingClientRect().height + 'px');
    }
  };

  window.lastSyncPanelHeights = syncPanelHeights;
  ['load', 'resize'].forEach(event => window.addEventListener(event, syncPanelHeights));
  setTimeout(syncPanelHeights, SYNC_DELAY);
}