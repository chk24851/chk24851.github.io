async function loadAndInitializeExtra(dataUrl, characterKey) {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    const pageConfig = data[characterKey];

    if (pageConfig) {
      const originalTitle = pageConfig.title;
      pageConfig.title = `【Extra】${pageConfig.title}`;
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

  const defaultMsg = document.querySelector('#content-default p');
  if (defaultMsg) defaultMsg.textContent = 'タイムスタンプを選択してください。';

  function renderTimestamps() {
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
        jumpToTimestamp(index);
      });

      li.appendChild(a);
      listContainer.appendChild(li);

      const contentId = 'content-' + index;
      if (!document.getElementById(contentId)) {
        const contentDiv = document.createElement('div');
        contentDiv.id = contentId;
        contentDiv.className = 'stamp-content hidden';
        contentDiv.innerHTML = `<h3>${ts.label || 'タイムスタンプ'}</h3><p>${ts.content || ''}</p>`;
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
}
