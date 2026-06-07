function getYouTubeEmbedUrl(videoId, startTime = 0) {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}

function generatePageTitle(label, gameKey, difficulty, route = null) {
  if (gameKey === 'alco') return label;
  if (gameKey === 'tmgc') return `【Normal】${label}`;
  
  if (route) {
    let title = `【Normal】${label}`;
    if (route === 'final_a') title += '（FinalA）';
    else if (route === 'final_b') title += '（FinalB）';
    return title;
  }
  
  if (difficulty === 'phantasm') return `【Phantasm】${label}`;
  if (difficulty === 'extra') return `【Extra】${label}`;
  return `【Normal】${label}`;
}

document.addEventListener('DOMContentLoaded', function() {
  history.scrollRestoration = 'manual';
  
  const gameKey = window.location.pathname.match(/\/blog\/(th\d+|tmgc|alco)\//)?.[1];
  
  if (!gameKey) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const hasDifficulty = params.has('difficulty');
  const hasShottype = params.has('shottype');
  const hasRoute = params.has('route');

  let difficulty = params.get('difficulty');
  let shottype = params.get('shottype');
  let route = params.get('route');

  const errorUrl = `/blog/${gameKey}/index.html`;

  if ((hasDifficulty && !difficulty) || (hasShottype && !shottype) || (hasRoute && !route)) {
    redirectWithError(errorUrl);
    return;
  }

  if (!hasDifficulty && !hasShottype && !hasRoute) {
    if (CONSTANTS.NO_OVERVIEW_GAMES.includes(gameKey)) {
      if (gameKey === 'alco') {
        difficulty = 'normal';
        shottype = 'default';
      } else if (gameKey === 'tmgc') {
        difficulty = 'extra';
        shottype = 'default';
      }
    }
  } else if (hasDifficulty && hasShottype) {
    if (gameKey === 'th8' && difficulty === 'normal' && !hasRoute) {
      redirectWithError(errorUrl);
      return;
    }
    if (!validateGameParameters({ difficulty: true, route: true }, gameKey, difficulty, shottype, route)) {
      return;
    }
  } else {
    redirectWithError(errorUrl);
    return;
  }

  if (difficulty && (shottype || route)) {
    const script = document.createElement('script');
    script.src = difficulty === 'normal'
      ? '/blog/scripts/normal.js'
      : '/blog/scripts/extra.js';

    script.addEventListener('load', function () {
      const dataUrl = CONSTANTS.NO_OVERVIEW_GAMES.includes(gameKey)
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
          loadAndInitializeNormal(dataUrl, shottype, route, gameKey, difficulty);
        } else {
          loadAndInitializeExtra(dataUrl, shottype, difficulty, gameKey);
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
                    const isValidRating = character.rating >= 0 && character.rating <= 9;
                    const disabledClass = !isValidRating ? ' class="disabled"' : '';
                    const displayRating = isValidRating ? character.rating : 0;
                    const titleAttr = (displayRating >= 1 && displayRating <= 5) ? ` title="${CONSTANTS.RATING_LABELS[displayRating]}"` : '';
                    const starClass = isValidRating ? 'stars' : 'stars stars-disabled';
                    const starSpan = `<span class="${starClass}" data-rating="${displayRating}"${titleAttr}></span>`;
                    let link = '';
                    if (character.shottype && character.route) {
                      link = `?difficulty=${difficultyKey}&shottype=${character.shottype}&route=${character.route}`;
                    } else if (character.shottype) {
                      link = `?difficulty=${difficultyKey}&shottype=${character.shottype}`;
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