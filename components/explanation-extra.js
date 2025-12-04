async function loadAndInitializeExtra(dataUrl, characterKey) {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();
    const pageConfig = data[characterKey];

    if (pageConfig) {
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

  const defaultMsg = document.querySelector('#content-default p');
  if (defaultMsg) defaultMsg.textContent = 'タイムスタンプを選択してください。';

  function renderTimestamps() {
    const listContainer = document.querySelector('#timestamps-list ul');
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
