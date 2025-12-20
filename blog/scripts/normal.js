async function loadAndInitializeNormal(dataUrl, characterKeyOrName, routeOrDifficulty) {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    
    let pageConfig;
    
    if (routeOrDifficulty === 'final_a' || routeOrDifficulty === 'final_b') {
      const character = characterKeyOrName;
      const route = routeOrDifficulty;
      
      const characterData = data[character];
      if (!characterData) return;

      pageConfig = {
        title: characterData.title,
        videoId: characterData.videoIds[route],
        message: characterData.message || '',
        stageData: {}
      };

      if (characterData.commonStages) {
        Object.assign(pageConfig.stageData, characterData.commonStages);
      }

      if (characterData.stage6) {
        const stage6Data = characterData.stage6[route];
        if (stage6Data && stage6Data.timestamps) {
          pageConfig.stageData['6'] = stage6Data;
        }
      }

      pageConfig.route = route;
      pageConfig.stageLabels = getStageLabels(route, data.stageLabels);
      const originalTitle = pageConfig.title;
      pageConfig.title = `【Normal】${pageConfig.title}`;
      if (route === 'final_a') {
        pageConfig.title += '（FinalA）';
      } else if (route === 'final_b') {
        pageConfig.title += '（FinalB）';
      }
      pageConfig.originalTitle = originalTitle;
    } else {
      const characterKey = characterKeyOrName;
      pageConfig = data[characterKey];
      if (!pageConfig) return;

      pageConfig.stageLabels = getStageLabels(characterKey, data.stageLabels);
      const originalTitle = pageConfig.title;
      pageConfig.title = `【Normal】${pageConfig.title}`;
      pageConfig.originalTitle = originalTitle;
    }
    
    initializeExplanationPage(pageConfig);
  } catch (error) {
    console.error('Failed to load normal data:', error);
  }
}

function getStageLabels(characterKeyOrRoute, allLabels) {
  const isRouteFinalA = characterKeyOrRoute === 'final_a' || characterKeyOrRoute.includes('final_a');
  const isRouteFinalB = characterKeyOrRoute === 'final_b' || characterKeyOrRoute.includes('final_b');
  
  if (isRouteFinalA) {
    return allLabels.slice(0, 6);
  } else if (isRouteFinalB) {
    return allLabels.slice(0, 5).concat([allLabels[6]]);
  } else {
    return allLabels;
  }
}

function getYouTubeEmbedUrl(videoId, startTime = 0) {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}

function initializeExplanationPage(pageConfig) {
  if (!pageConfig) return;

  const stageData = pageConfig.stageData || {};
  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;
  const stageLabels = pageConfig.stageLabels || [];
  const route = pageConfig.route || null;
  const maxStage = Object.keys(stageData).length;
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
  if (characterMsg) characterMsg.textContent = pageConfig.message;

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

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      updateCurrentStage(currentStage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      updateCurrentStage(currentStage + 1);
    });
  }

  const getStampContentsElements = () => contentPanel.querySelectorAll('.stamp-content');

  function renderTimestamps(stage) {
    const stageTimestamps = stageData[stage] && stageData[stage].timestamps ? stageData[stage].timestamps : [];
    if (!listContainer) return;

    listContainer.innerHTML = '';
    getStampContentsElements().forEach(el => {
      if (el.id !== 'content-default') el.remove();
    });

    if (stageTimestamps.length === 0) {
      const li = document.createElement('li');
      li.textContent = '（タイムスタンプなし）';
      li.style.textAlign = 'center';
      li.style.opacity = '0.5';
      listContainer.appendChild(li);
      return;
    }

    stageTimestamps.forEach((ts, index) => {
      if (!ts.label || ts.label.trim() === '') {
        return;
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'timestamp-link';
      a.textContent = ts.label;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToTimestamp(stage, index);
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

  function jumpToTimestamp(stage, index) {
    const ts = stageData[stage] && stageData[stage].timestamps ? stageData[stage].timestamps[index] : null;
    if (!ts) return;

    if (videoId && videoFrame) {
      let timeValue = ts.time;
      if (typeof ts.time === 'object' && route && ts.time[route]) {
        timeValue = ts.time[route];
      }
      videoFrame.src = getYouTubeEmbedUrl(videoId, timeValue);
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
