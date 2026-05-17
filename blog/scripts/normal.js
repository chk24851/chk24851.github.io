async function loadAndInitializeNormal(dataUrl, characterKeyOrName, routeOrDifficulty) {
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

  let pageConfig;
  
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

    if (routeOrDifficulty === 'final_a' || routeOrDifficulty === 'final_b') {
      const character = characterKeyOrName;
      const route = routeOrDifficulty;
      
      const characterData = data[character];
      if (!characterData) {
        handleInvalidData();
        return;
      }

      if (overviewData && overviewData.normal) {
        const overviewItem = overviewData.normal.find(item => item.character === character);
        if (overviewItem) {
          characterData.label = overviewItem.label;
          characterData.shortLabel = overviewItem.shortLabel;
        }
      }

      const displayLabel = getDisplayLabel(characterData);
      pageConfig = {
        label: characterData.label,
        description: characterData.description || '',
        videoId: characterData.videoIds[route],
        stageData: characterData.timestamps || {}
      };

      pageConfig.title = getPageTitle(displayLabel.label, route);
      pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
      pageConfig.characterKey = character;
      pageConfig.stageLabels = getStageLabels(route, data.stageLabels);
      pageConfig.characterRoute = route;
    } else if (/^[abc][12]$/.test(routeOrDifficulty)) {
      const route = routeOrDifficulty;
      let routeData = data[route];
      
      if (!routeData && data.normal && Array.isArray(data.normal)) {
        const routeItem = data.normal.find(item => item.route === route);
        if (routeItem) {
          routeData = routeItem;
        }
      }
      
      if (!routeData) {
        handleInvalidData();
        return;
      }

      if (overviewData && overviewData.normal) {
        const overviewItem = overviewData.normal.find(item => item.route ? item.route === route : item.character === route);
        if (overviewItem) {
          routeData.label = overviewItem.label;
          routeData.shortLabel = overviewItem.shortLabel;
        }
      }

      const displayLabel = getDisplayLabel(routeData);
      pageConfig = {
        label: routeData.label,
        description: routeData.description || '',
        videoId: routeData.videoId,
        stageData: routeData.timestamps || {}
      };

      pageConfig.title = `【Normal】${displayLabel.label}`;
      pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
      pageConfig.characterKey = route;
      pageConfig.stageLabels = getStageLabels('default', data.stageLabels);
      pageConfig.characterRoute = null;
    } else {
      const characterKey = characterKeyOrName;
      pageConfig = data[characterKey];
      if (!pageConfig) {
        handleInvalidData();
        return;
      }

      if (overviewData && overviewData.normal) {
        const overviewItem = overviewData.normal.find(item => item.character === characterKey);
        if (overviewItem) {
          pageConfig.label = overviewItem.label;
          pageConfig.shortLabel = overviewItem.shortLabel;
        }
      }

      const displayLabel = getDisplayLabel(pageConfig);
      pageConfig.title = `【Normal】${displayLabel.label}`;
      pageConfig.originalTitle = { label: displayLabel.label, shortLabel: displayLabel.shortLabel };
      pageConfig.characterKey = characterKey;
      pageConfig.stageLabels = getStageLabels(characterKey, data.stageLabels);
      pageConfig.characterRoute = null;
    }
    
    initializeExplanationPage(pageConfig, data);
}

function getStageLabels(characterKeyOrRoute, allLabels) {
  switch (characterKeyOrRoute) {
    case 'final_a':
      return allLabels.slice(0, 6);
    case 'final_b':
      return [...allLabels.slice(0, 5), allLabels[6]];
    case 'default':
      return allLabels || [];
    default:
      return allLabels;
  }
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
        
        const timeValue = getCharacterTimeValue(ts.time, pageConfig.characterKey, route);
        
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