function getYouTubeEmbedUrl(videoId, startTime = 0) {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}

document.addEventListener('DOMContentLoaded', function() {
  history.scrollRestoration = 'manual';
  
  const gameKey = window.location.pathname.match(/\/blog\/(th\d+|tmgc|alco)\//)?.[1];
  
  if (!gameKey) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  let difficulty = params.get('difficulty');
  let character = params.get('character');
  let route = params.get('route');

  validateGameParameters({ difficulty: true, route: true });

  const noOverviewGames = ['alco', 'tmgc'];
  if (noOverviewGames.includes(gameKey) && !difficulty && !character && !route) {
    if (gameKey === 'alco') {
      difficulty = 'normal';
      character = 'default';
    } else if (gameKey === 'tmgc') {
      difficulty = 'extra';
      character = 'default';
      route = 'extra';
    }
  }

  if (difficulty && (character || route || difficulty === 'extra')) {
    const script = document.createElement('script');
    script.src = difficulty === 'normal'
      ? '/blog/scripts/normal.js'
      : '/blog/scripts/extra.js';

    script.addEventListener('load', function () {
      const dataUrl = noOverviewGames.includes(gameKey)
        ? `/blog/data/${gameKey}.json`
        : `/blog/data/${gameKey}-${difficulty}.json`;

      const container = document.getElementById('container');
      const breadcrumbNav = container.querySelector('#breadcrumb-nav');
      const breadcrumbHTML = breadcrumbNav ? breadcrumbNav.outerHTML : '';
      
      container.innerHTML = `
        <h1></h1>
        <div class="video-container">
          <div class="video-panel">
            <div class="video-wrapper">
              <iframe id="videoFrame" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            </div>
          </div>
          <div class="timestamps-panel">
            ${difficulty === 'normal' ? `
            <div class="stage-selector">
              <button class="stage-arrow" id="prev-stage" tabindex="-1" aria-hidden="true">←</button>
              <select id="stage-dropdown"></select>
              <button class="stage-arrow" id="next-stage" tabindex="-1" aria-hidden="true">→</button>
            </div>
            ` : ''}
            <div class="timestamps-list" id="timestamps-list">
              <ul></ul>
            </div>
          </div>
        </div>
        <div class="content-panel" id="content-panel">
            <div id="content-default" class="stamp">
            <h3></h3>
            <p id="character-message"></p>
            <p id="instruction-message"></p>
          </div>
        </div>
      `;
      
      if (breadcrumbHTML) {
        container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
      }

      requestAnimationFrame(() => {
        if (difficulty === 'normal') {
          loadAndInitializeNormal(dataUrl, character, route);
        } else {
          loadAndInitializeExtra(dataUrl, character, difficulty);
        }
        document.body.style.display = 'block';
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      });
    });

    document.body.appendChild(script);
  } else {
    fetch(`/blog/data/${gameKey}.json`)
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('container');
        const breadcrumbNav = container.querySelector('#breadcrumb-nav');
        const breadcrumbHTML = breadcrumbNav ? breadcrumbNav.outerHTML : '';
        
        const difficultiesHtml = Object.keys(data)
          .filter(key => Array.isArray(data[key]))
          .map(difficultyKey => {
            const difficultyLabel = difficultyKey.charAt(0).toUpperCase() + difficultyKey.slice(1);
            const items = data[difficultyKey];
            return `
              <h2>${difficultyLabel}</h2>
              <nav>
                <ul>
                  ${items.map(character => {
                    const disabledClass = character.rating === 0 ? ' class="disabled"' : '';
                    const starSpan = character.rating > 0 ? `<span class="stars" data-rating="${character.rating}" title="${CONSTANTS.RATING_LABELS[character.rating]}"></span>` : '';
                    let link = '';
                    if (character.character && character.route) {
                      link = `?difficulty=${difficultyKey}&character=${character.character}&route=${character.route}`;
                    } else if (character.character) {
                      link = `?difficulty=${difficultyKey}&character=${character.character}`;
                    } else if (character.route && character.route !== 'extra') {
                      link = `?difficulty=${difficultyKey}&route=${character.route}`;
                    } else if (character.route === 'extra') {
                      link = `?difficulty=${difficultyKey}`;
                    }
                    return `<li>${starSpan}<a href="${link}"${disabledClass}><span class="label">${character.label}</span><span class="shortLabel">${character.shortLabel || character.label}</span></a></li>`;
                  }).join('')}
                </ul>
              </nav>
            `;
          })
          .join('');
        
        container.innerHTML = `
          <h1><span class="title">${data.title}</span><span class="short-title">${data.shortTitle || data.title}</span></h1>
          <p>${data.description}</p>
          ${difficultiesHtml}
        `;
        
        if (breadcrumbHTML) {
          container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
        }
        
        document.body.style.display = 'block';
      });
  }
});