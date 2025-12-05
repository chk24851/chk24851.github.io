async function loadAndInitializeNormal(dataUrl, characterKey, difficulty = 'normal') {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    const pageConfig = data[characterKey];

    if (!pageConfig) {
      window.location.href = '/404.html';
      return;
    }

    pageConfig.stageLabels = getStageLabels(characterKey, data.stageLabels);
    const originalTitle = pageConfig.title;
    const label = difficulty === 'lunatic' ? '【Lunatic】' : '【Normal】';
    pageConfig.title = `${label}${pageConfig.title}`;
    pageConfig.originalTitle = originalTitle;
    initializeExplanationPage(pageConfig);
  } catch (error) {
    console.error('Failed to load normal data:', error);
    window.location.href = '/404.html';
  }
}

function getStageLabels(characterKey, allLabels) {
  if (characterKey.includes('final_a')) {
    return allLabels.slice(0, 6);
  } else if (characterKey.includes('final_b')) {
    return allLabels.slice(0, 5).concat([allLabels[6]]);
  } else {
    return allLabels;
  }
}

function initializeExplanationPage(pageConfig) {
  if (!pageConfig) return;

  const stageData = pageConfig.stageData || {};
  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;
  const stageLabels = pageConfig.stageLabels || [];
  let currentStage = 1;

  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = pageConfig.title;

  const defaultH3 = document.querySelector('#content-default h3');
  if (defaultH3) defaultH3.textContent = pageConfig.originalTitle || pageConfig.title;

  const defaultMsg = document.querySelector('#content-default p');
  if (defaultMsg) defaultMsg.textContent = 'タイムスタンプを選択してください。';

  const dropdown = document.getElementById('stage-dropdown');
  if (dropdown) {
    stageLabels.forEach(function (label, index) {
      const option = document.createElement('option');
      option.value = index + 1;
      option.textContent = label;
      dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', function (e) {
      currentStage = parseInt(e.target.value);
      renderTimestamps(currentStage);
      showDefaultContent();
    });
  }

  const prevBtn = document.getElementById('prev-stage');
  const nextBtn = document.getElementById('next-stage');

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      currentStage = Math.max(1, currentStage - 1);
      if (dropdown) dropdown.value = currentStage;
      renderTimestamps(currentStage);
      showDefaultContent();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      const maxStage = Object.keys(stageData).length;
      currentStage = Math.min(maxStage, currentStage + 1);
      if (dropdown) dropdown.value = currentStage;
      renderTimestamps(currentStage);
      showDefaultContent();
    });
  }

  function renderTimestamps(stage) {
    const timestamps = stageData[stage] ? stageData[stage].timestamps : [];
    const listContainer = document.querySelector('#timestamps-list ul');
    const contentPanel = document.getElementById('content-panel');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    timestamps.forEach(function (ts, index) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'timestamp-link';
      a.textContent = ts.label || 'タイムスタンプ';

      a.addEventListener('click', function (e) {
        e.preventDefault();
        jumpToTimestamp(stage, index);
      });

      li.appendChild(a);
      listContainer.appendChild(li);

      const contentId = 'content-' + stage + '-' + index;
      if (!document.getElementById(contentId)) {
        const contentDiv = document.createElement('div');
        contentDiv.id = contentId;
        contentDiv.className = 'stamp-content hidden';
        contentDiv.innerHTML = `<h3>${ts.label || 'タイムスタンプ'}</h3><p>${ts.content || ''}</p>`;
        contentPanel.appendChild(contentDiv);
      }
    });
  }

  function jumpToTimestamp(stage, index) {
    const ts = stageData[stage] ? stageData[stage].timestamps[index] : null;
    if (!ts) return;

    if (videoId && videoFrame) {
      videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + ts.time + '&autoplay=1';
    }

    document.querySelectorAll('.stamp-content').forEach(function (el) {
      el.classList.add('hidden');
    });

    const contentId = 'content-' + stage + '-' + index;
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
      selectedContent.classList.remove('hidden');
    }
  }

  function showDefaultContent() {
    document.querySelectorAll('.stamp-content').forEach(function (el) {
      el.classList.add('hidden');
    });
    const defaultContent = document.getElementById('content-default');
    if (defaultContent) defaultContent.classList.remove('hidden');
  }

  renderTimestamps(1);
  if (videoId && videoFrame) {
    videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
  }
  showDefaultContent();
}
