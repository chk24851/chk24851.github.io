async function loadAndInitializeExtra(dataUrl, characterKey, difficulty = 'extra') {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    const pageConfig = data[characterKey];

    if (pageConfig) {
      const originalTitle = pageConfig.title;
      const label = difficulty === 'phantasm' ? '【Phantasm】' : '【Extra】';
      pageConfig.title = `${label}${pageConfig.title}`;
      pageConfig.originalTitle = originalTitle;
      initializeExplanationPage(pageConfig);
    }
  } catch (error) {
    console.error('Failed to load extra data:', error);
  }
}

function initializeExplanationPage(pageConfig) {
  if (!pageConfig) return;

  const timestamps = pageConfig.timestamps || [];
  const videoFrame = document.getElementById('videoFrame');
  const videoId = pageConfig.videoId;

  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = pageConfig.title;

  const defaultH3 = document.querySelector('#content-default h3');
  if (defaultH3) defaultH3.textContent = pageConfig.originalTitle || pageConfig.title;

  const characterMsg = document.querySelector('#content-default #character-message');
  if (characterMsg) characterMsg.textContent = pageConfig.message || '';

  const instructionMsg = document.querySelector('#content-default #instruction-message');
  if (instructionMsg) instructionMsg.textContent = '※タイムスタンプを選択すると説明が表示されます。';

  function renderTimestamps() {
    const listContainer = document.querySelector('#timestamps-list ul');
    const contentPanel = document.getElementById('content-panel');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    timestamps.forEach(function (ts, index) {
      if (!ts.label || ts.label.trim() === '') {
        return;
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'timestamp-link';
      a.textContent = ts.label;

      a.addEventListener('click', function (e) {
        e.preventDefault();
        jumpToTimestamp(index);
      });

      li.appendChild(a);
      listContainer.appendChild(li);

      const contentId = 'content-' + index;
      if (!document.getElementById(contentId)) {
        const contentDiv = document.createElement('div');
        contentDiv.id = contentId;
        contentDiv.className = 'stamp-content hidden';
        contentDiv.innerHTML = `<h3>${ts.label}</h3><p>${ts.content || ''}</p>`;
        contentPanel.appendChild(contentDiv);
      }
    });
  }

  function jumpToTimestamp(index) {
    const ts = timestamps[index];
    if (!ts) return;

    if (videoId && videoFrame) {
      videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?start=' + ts.time + '&autoplay=1';
    }

    document.querySelectorAll('.stamp-content').forEach(function (el) {
      el.classList.add('hidden');
    });

    const contentId = 'content-' + index;
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

  renderTimestamps();
  if (videoId && videoFrame) {
    videoFrame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
  }
  showDefaultContent();

  const SYNC_DELAY = 100;
  const syncPanelHeights = () => {
    const videoPanel = document.querySelector('.video-panel');
    const timestampsPanel = document.querySelector('.timestamps-panel');
    videoPanel && timestampsPanel && (timestampsPanel.style.height = videoPanel.getBoundingClientRect().height + 'px');
  };

  ['load', 'resize'].forEach(event => window.addEventListener(event, syncPanelHeights));
  setTimeout(syncPanelHeights, SYNC_DELAY);
}
