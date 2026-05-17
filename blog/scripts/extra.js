async function loadAndInitializeExtra(dataUrl, characterKey, difficulty = 'extra') {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();

  const gameMatch = dataUrl.match(/\/(\w+)-\w+\.json/);
  const gameKey = gameMatch ? gameMatch[1] : null;
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
      const match = window.location.pathname.match(/\/(th\d+)\//);
      if (match) {
        const gameKey = match[1];
        sessionStorage.setItem('errorMessage', CONSTANTS.INVALID_PARAMS_ERROR);
        window.location.href = `/blog/${gameKey}/index.html`;
      }
    }
    if (!characterKey) {
      const keys = Object.keys(data).filter(k => typeof data[k] === 'object' && data[k] !== null && !Array.isArray(data[k]));
      characterKey = keys.length > 0 ? keys[0] : null;
    }
    
    let pageConfig = data[characterKey];
    
    if (!pageConfig) {
      handleInvalidData();
      return;
    }

    if (overviewData) {
      const difficultyKey = difficulty === 'phantasm' ? 'phantasm' : 'extra';
      if (overviewData[difficultyKey]) {
        let overviewItem;
        if (Array.isArray(overviewData[difficultyKey])) {
          overviewItem = overviewData[difficultyKey].find(item => item.route ? item.route === difficultyKey : item.character === characterKey);
        } else {
          overviewItem = overviewData[difficultyKey][characterKey];
        }
        if (overviewItem) {
          pageConfig.label = overviewItem.label;
          pageConfig.shortLabel = overviewItem.shortLabel;
        }
      }
    }

    const displayLabel = getDisplayLabel(pageConfig);
    const showDifficultyLabel = characterKey !== 'default';
    pageConfig.title = showDifficultyLabel
      ? (difficulty === 'phantasm' ? `【Phantasm】${displayLabel.label}` : `【Extra】${displayLabel.label}`)
      : displayLabel.label;
    pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
    pageConfig.characterKey = characterKey;

    initializeExplanationPage(pageConfig, data);
}

function getCharacterTimeValue(timeData, characterKey) {
  if (typeof timeData === 'object' && timeData !== null) {
    const charTimeData = timeData[characterKey];
    
    if (typeof charTimeData === 'object' && charTimeData !== null && ('a' in charTimeData || 'b' in charTimeData)) {
      return charTimeData.a;
    }
    return charTimeData;
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
    defaultH3.innerHTML = `<span class="label">${pageConfig.originalTitle.label}</span><span class="shortLabel">${pageConfig.originalTitle.shortLabel}</span>`;
  }

  const characterMsg = document.querySelector('#content-default #character-message');
  if (characterMsg) characterMsg.innerHTML = pageConfig.description || '';

  const instructionMsg = document.querySelector('#content-default #instruction-message');
  if (instructionMsg) instructionMsg.textContent = '※タイムスタンプを選択すると説明が表示されます。';

  const getStampContentsElements = () => contentPanel.querySelectorAll('.stamp');

  let cachedAllTimestamps = null;

  const getAllTimestamps = () => {
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
        
        const timeValue = getCharacterTimeValue(ts.time, pageConfig.characterKey);
        
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
    const allTimestamps = getAllTimestamps();
    
    if (!listContainer) return;

    getStampContentsElements().forEach(el => {
      if (el.id !== 'content-default') el.remove();
    });
    listContainer.innerHTML = '';

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