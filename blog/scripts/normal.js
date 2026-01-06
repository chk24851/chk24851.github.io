async function loadAndInitializeNormal(dataUrl, characterKeyOrName, routeOrDifficulty) {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();

    let pageConfig;

    function handleInvalidData() {
      const match = window.location.pathname.match(/\/(th\d+)\//);
      if (match) {
        const gameKey = match[1];
        sessionStorage.setItem('errorMessage', '無効なパラメータです');
        window.location.href = `../${gameKey}/index.html`;
      }
    }

    if (routeOrDifficulty === 'final_a' || routeOrDifficulty === 'final_b') {
      const character = characterKeyOrName;
      const route = routeOrDifficulty;
      
      const characterData = data[character];
      if (!characterData) {
        handleInvalidData();
        return;
      }

      pageConfig = {
        label: characterData.label,
        description: characterData.description || '',
        videoId: characterData.videoIds[route],
        stageData: characterData.timestamps || {}
      };

      const originalLabel = pageConfig.label;
      pageConfig.title = getPageTitle(pageConfig.label, route);
      pageConfig.originalTitle = originalLabel;
      pageConfig.characterKey = character;
      pageConfig.stageLabels = getStageLabels(route, data.stageLabels);
      pageConfig.characterRoute = route;
    } else {
      const characterKey = characterKeyOrName;
      pageConfig = data[characterKey];
      if (!pageConfig) {
        handleInvalidData();
        return;
      }

      const originalLabel = pageConfig.label;
      pageConfig.title = `【Normal】${pageConfig.label}`;
      pageConfig.originalTitle = originalLabel;
      pageConfig.characterKey = characterKey;
      pageConfig.stageLabels = getStageLabels(characterKey, data.stageLabels);
      pageConfig.characterRoute = null;
    }
    
    initializeExplanationPage(pageConfig, data);
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
  }
}

function getStageLabels(characterKeyOrRoute, allLabels) {
  switch (characterKeyOrRoute) {
    case 'final_a':
      return allLabels.slice(0, 6);
    case 'final_b':
      return [...allLabels.slice(0, 5), allLabels[6]];
    default:
      return allLabels;
  }
}

function getYouTubeEmbedUrl(videoId, startTime = 0) {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}

function getPageTitle(label, route) {
  let title = `【Normal】${label}`;
  if (route === 'final_a') {
    title += '（FinalA）';
  } else if (route === 'final_b') {
    title += '（FinalB）';
  }
  return title;
}

function getCharacterTimeValue(timeData, characterKey, route) {
  if (typeof timeData === 'object' && timeData !== null) {
    const charTimeData = timeData[characterKey];
    
    if (typeof charTimeData === 'object' && charTimeData !== null && ('a' in charTimeData || 'b' in charTimeData)) {
      return route === 'final_b' ? charTimeData.b : charTimeData.a;
    }
    return charTimeData;
  }
  return timeData;
}

function getStageTimestamps(stageData, stage) {
  const stageInfo = stageData[stage];
  if (Array.isArray(stageInfo)) {
    return stageInfo;
  }
  return stageInfo?.timestamps || null;
}

function initializeExplanationPage(pageConfig, data) {
  if (!pageConfig) return;

  const stageData = pageConfig.timestamps || {};
  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;
  const stageLabels = pageConfig.stageLabels || [];
  const route = pageConfig.characterRoute || null;
  const maxStage = stageLabels.length;
  const INITIAL_STAGE = 1;
  let currentStage = INITIAL_STAGE;
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
  if (characterMsg) characterMsg.innerHTML = pageConfig.description || '';

  const instructionMsg = document.querySelector('#content-default #instruction-message');
  if (instructionMsg) instructionMsg.textContent = '※タイムスタンプを選択すると説明が表示されます。';

  const updateCurrentStage = (stage) => {
    currentStage = Math.max(INITIAL_STAGE, Math.min(maxStage, stage));
    if (dropdown) dropdown.value = currentStage;
    renderTimestamps(currentStage);
    showDefaultContent();
  };

  const dropdown = document.getElementById('stage-dropdown');
  if (dropdown) {
    stageLabels.forEach(function (label, index) {
      const option = document.createElement('option');
      option.value = index + 1;
      option.textContent = label;
      dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', function (e) {
      updateCurrentStage(parseInt(e.target.value));
    });
  }

  const prevBtn = document.getElementById('prev-stage');
  const nextBtn = document.getElementById('next-stage');

  if (prevBtn) prevBtn.addEventListener('click', () => updateCurrentStage(currentStage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => updateCurrentStage(currentStage + 1));

  const getStampContentsElements = () => contentPanel.querySelectorAll('.stamp-content');

  function renderTimestamps(stage) {
    let allTimestamps = [];
    
    const stageKey = (route === 'final_b' && stage === maxStage && maxStage === 6) ? '7' : String(stage);
    
    if (data.common && data.common.timestamps && data.common.timestamps[stageKey]) {
      const commonTimestamps = data.common.timestamps[stageKey];
      commonTimestamps.forEach((ts) => {
        if (!ts.label || !ts.description) {
          return;
        }
        
        const timeValue = getCharacterTimeValue(ts.time, pageConfig.characterKey, route);
        
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
    
    let stageTimestamps = getStageTimestamps(stageData, stage);
    
    if (stageTimestamps) {
      stageTimestamps.forEach((ts) => {
        if (!ts.time || !ts.label || !ts.description) {
          return;
        }
        
        const timeValue = getCharacterTimeValue(ts.time, pageConfig.characterKey, route);
        
        if (timeValue === undefined || timeValue === null) {
          return;
        }
        
        allTimestamps.push({
          time: timeValue,
          label: ts.label,
          content: ts.description,
          type: 'individual'
        });
      });
    }
    
    allTimestamps.sort((a, b) => a.time - b.time);
    
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
      a.className = 'timestamp-link';
      a.textContent = ts.label;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToTimestamp(stage, index, allTimestamps);
      });

      li.appendChild(a);
      listContainer.appendChild(li);

      const contentId = `content-${stage}-${index}`;
      const contentDiv = document.createElement('div');
      contentDiv.id = contentId;
      contentDiv.className = 'stamp-content hidden';
      contentDiv.innerHTML = `<h3>${ts.label}</h3><p>${ts.content || ''}</p>`;
      contentPanel.appendChild(contentDiv);
    });
  }

  function jumpToTimestamp(stage, index, allTimestamps) {
    const ts = allTimestamps && allTimestamps[index] ? allTimestamps[index] : null;
    if (!ts) return;

    if (videoId && videoFrame) {
      videoFrame.src = getYouTubeEmbedUrl(videoId, ts.time);
    }

    getStampContentsElements().forEach(el => el.classList.add('hidden'));

    const contentId = `content-${stage}-${index}`;
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
      selectedContent.classList.remove('hidden');
    }
  }

  function showDefaultContent() {
    getStampContentsElements().forEach(el => el.classList.add('hidden'));
    if (defaultContent) defaultContent.classList.remove('hidden');
  }

  renderTimestamps(INITIAL_STAGE);
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