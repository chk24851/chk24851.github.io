async function loadAndInitializeNormal(dataUrl, shottypeKey, route, gameKey, difficulty) {
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

  let pageConfig;
  
  const getDisplayLabel = (obj) => {
    return { label: obj.label, shortLabel: obj.shortLabel || obj.label };
  };

  function handleInvalidData() {
    sessionStorage.setItem('errorMessage', CONSTANTS.DATA_NOT_FOUND_ERROR);
    window.location.href = `/blog/${gameKey}/index.html`;
  }

  let overviewItem = null;
  if (overviewData && overviewData.normal) {
    overviewItem = overviewData.normal.find(item => item.shottype === shottypeKey);
    if (!overviewItem) {
      handleInvalidData();
      return;
    }
  }
  
  let shottypeData = data[shottypeKey];
  if (!shottypeData) {
    shottypeData = {
      label: '',
      shortLabel: '',
      description: '',
      videoIds: data.common?.videoIds || {},
      videoId: '',
      timestamps: data.common?.timestamps || {}
    };
  }

  if (overviewItem) {
    shottypeData.label = overviewItem.label;
    shottypeData.shortLabel = overviewItem.shortLabel;
  }

  const displayLabel = getDisplayLabel(shottypeData);
  
  if (route === 'final_a' || route === 'final_b') {
    pageConfig = {
      label: shottypeData.label,
      description: shottypeData.description || '',
      videoId: shottypeData.videoIds[route],
      timestamps: shottypeData.timestamps || {}
    };

    pageConfig.title = generatePageTitle(displayLabel.label, gameKey, difficulty, route);
    pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
    pageConfig.shottypeKey = shottypeKey;
    pageConfig.stageLabels = getStageLabels(route, data.stageLabels);
    pageConfig.route = route;
  } else {
    pageConfig = {
      label: shottypeData.label,
      description: shottypeData.description || '',
      videoId: shottypeData.videoId,
      timestamps: shottypeData.timestamps || {}
    };

    pageConfig.title = generatePageTitle(displayLabel.label, gameKey, difficulty, null);
    pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
    pageConfig.shottypeKey = shottypeKey;
    pageConfig.stageLabels = getStageLabels('default', data.stageLabels);
    pageConfig.route = null;
  }
  
  initializeExplanationPage(pageConfig, data);
}

function getStageLabels(route, allLabels) {
  switch (route) {
    case 'final_a':
      return allLabels.slice(0, 6);
    case 'final_b':
      return [...allLabels.slice(0, 5), allLabels[6]];
    default:
      return allLabels || [];
  }
}


function getShottypeTimeValue(timeData, shottypeKey, route) {
  if (typeof timeData === 'object' && timeData !== null) {
    const shottypeTimeData = timeData[shottypeKey];
    
    if (typeof shottypeTimeData === 'object' && shottypeTimeData !== null && ('a' in shottypeTimeData || 'b' in shottypeTimeData)) {
      return route === 'final_b' ? shottypeTimeData.b : shottypeTimeData.a;
    }
    return shottypeTimeData;
  }
  return timeData;
}

function getStageTimestamps(timestamps, stage) {
  const stageInfo = timestamps[stage];
  if (Array.isArray(stageInfo)) {
    return stageInfo;
  }
  return stageInfo?.timestamps || null;
}

function initializeExplanationPage(pageConfig, data) {
  if (!pageConfig) return;

  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;
  const stageLabels = pageConfig.stageLabels || [];
  const route = pageConfig.route || null;
  const maxStage = stageLabels.length;
  const INITIAL_STAGE = 1;
  let currentStage = INITIAL_STAGE;
  const listContainer = document.querySelector('#timestamps-list ul');
  const contentPanel = document.getElementById('content-panel');
  const videoPanel = document.querySelector('.video-panel');
  const timestampsPanel = document.querySelector('.timestamps-panel');
  const defaultContent = document.getElementById('content-default');
  const timestamps = pageConfig.timestamps || {};

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

  const updateArrowVisibility = () => {
    if (prevBtn) {
      prevBtn.style.visibility = currentStage > INITIAL_STAGE ? 'visible' : 'hidden';
      prevBtn.style.pointerEvents = currentStage > INITIAL_STAGE ? 'auto' : 'none';
    }
    if (nextBtn) {
      nextBtn.style.visibility = currentStage < maxStage ? 'visible' : 'hidden';
      nextBtn.style.pointerEvents = currentStage < maxStage ? 'auto' : 'none';
    }
  };

  const updateCurrentStage = (stage) => {
    currentStage = Math.max(INITIAL_STAGE, Math.min(maxStage, stage));
    if (dropdown) dropdown.value = currentStage;
    renderTimestamps(currentStage);
    showDefaultContent();
    updateArrowVisibility();
    window.lastSyncPanelHeights?.();
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

  updateArrowVisibility();

  const getStampContentsElements = () => contentPanel.querySelectorAll('.stamp');

  function renderTimestamps(stage) {
    let allTimestamps = [];
    
    const stageKey = (route === 'final_b' && stage === maxStage && maxStage === 6) ? '7' : String(stage);
    
    if (data.common && data.common.timestamps && data.common.timestamps[stageKey]) {
      const commonTimestamps = data.common.timestamps[stageKey];
      commonTimestamps.forEach((ts) => {
        if (!ts.label || !ts.description) {
          return;
        }
        
        const timeValue = getShottypeTimeValue(ts.time, pageConfig.shottypeKey, route);
        
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
    
    let stageTimestamps = getStageTimestamps(timestamps, stage);
    
    if (stageTimestamps) {
      stageTimestamps.forEach((ts) => {
        if (!ts.time || !ts.label || !ts.description) {
          return;
        }
        
        const timeValue = getShottypeTimeValue(ts.time, pageConfig.shottypeKey, route);
        
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
    
    allTimestamps.sort((a, b) => a.time - b.time);
    
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
        jumpToTimestamp(stage, index, allTimestamps);
      });

      li.appendChild(a);
      listContainer.appendChild(li);

      const contentId = `content-${stage}-${index}`;
      const contentDiv = document.createElement('div');
      contentDiv.id = contentId;
      contentDiv.className = 'stamp hidden';
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
    if (window.innerWidth <= 768) {
      timestampsPanel.style.height = '';
      const container = document.querySelector('.video-container');
      const stageSelector = document.querySelector('.stage-selector');
      if (container && timestampsPanel) {
        const containerHeight = container.getBoundingClientRect().height;
        const stageSelectorHeight = stageSelector ? stageSelector.getBoundingClientRect().height + 12 : 0;
        const availableHeight = containerHeight - stageSelectorHeight;
        timestampsPanel.style.maxHeight = availableHeight + 'px';
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