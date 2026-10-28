(function () {
  'use strict';

  const FEED_URL = 'https://raw.githubusercontent.com/curburenthusiasm/personal-site/master/data/sports-picks.json';
  const REFRESH_MS = 60 * 1000;
  const feedNode = document.getElementById('sports-picks-feed');
  const statusNode = document.getElementById('sports-picks-status');
  const refreshButton = document.getElementById('sports-picks-refresh');
  const sportLabels = { NBA: 'NBA', NHL: 'NHL', MLB: 'MLB', NFL: 'NFL', NCAAF: 'College football' };

  if (!feedNode || !statusNode || !refreshButton) return;

  function dateLabel(value) {
    if (!value) return 'time not supplied';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric',
      minute: '2-digit', timeZoneName: 'short'
    }).format(date);
  }

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  }

  function render(feed) {
    if (!feed || feed.schema_version !== 1 || !Array.isArray(feed.feeds)) {
      throw new Error('Pick feed schema is incomplete');
    }

    feedNode.textContent = '';
    const feeds = feed.feeds.filter(function (item) {
      return item && typeof item.sport === 'string' && Array.isArray(item.picks);
    }).sort(function (a, b) {
      return String(b.posted_at || '').localeCompare(String(a.posted_at || ''));
    });

    if (!feeds.length) {
      feedNode.appendChild(element('p', 'feed-empty', 'No public pick posts have been published yet. The feed updates after the next successful free-channel post.'));
      statusNode.textContent = 'No published pick output yet · checking again in one minute.';
      return;
    }

    feeds.forEach(function (item) {
      const card = element('article', 'sports-feed-card');
      const header = element('div', 'sports-feed-header');
      header.appendChild(element('h3', '', sportLabels[item.sport] || item.sport));
      const posted = element('time', 'sports-feed-date', 'Posted ' + dateLabel(item.posted_at));
      if (item.posted_at) posted.dateTime = item.posted_at;
      header.appendChild(posted);
      card.appendChild(header);

      const postedTime = Date.parse(item.posted_at || '');
      if (Number.isFinite(postedTime) && Date.now() - postedTime > 36 * 60 * 60 * 1000) {
        card.appendChild(element('p', 'sports-feed-stale', 'Older publication · verify the slate before relying on it.'));
      }

      if (!item.picks.length) {
        card.appendChild(element('p', 'feed-empty', 'No public picks in this post.'));
      } else {
        const list = element('div', 'pick-list');
        item.picks.forEach(function (pick) {
          if (!pick || typeof pick.selection !== 'string') return;
          const row = element('article', 'pick-item');
          row.appendChild(element('span', 'pick-selection', pick.selection));
          const details = element('div', 'pick-details');
          if (pick.opponent) details.appendChild(element('span', '', 'vs ' + pick.opponent));
          if (pick.market) details.appendChild(element('span', '', pick.market));
          if (Number.isFinite(Number(pick.confidence))) details.appendChild(element('span', '', 'Bot score ' + Number(pick.confidence) + '%'));
          if (pick.odds) details.appendChild(element('span', '', 'Odds ' + pick.odds));
          if (pick.bookmaker) details.appendChild(element('span', '', pick.bookmaker));
          row.appendChild(details);
          list.appendChild(row);
        });
        card.appendChild(list);
      }
      feedNode.appendChild(card);
    });

    statusNode.textContent = 'Latest feed write: ' + dateLabel(feed.updated_at) + ' · checking every minute.';
  }

  async function refresh() {
    refreshButton.disabled = true;
    statusNode.textContent = 'Checking for new published picks…';
    try {
      const response = await fetch(FEED_URL + '?refresh=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      render(await response.json());
    } catch (error) {
      statusNode.textContent = 'Could not refresh the pick feed; the last page state is retained.';
      if (!feedNode.childElementCount) {
        feedNode.appendChild(element('p', 'feed-empty', 'Pick data is temporarily unavailable. Try refreshing again later.'));
      }
    } finally {
      refreshButton.disabled = false;
    }
  }

  refreshButton.addEventListener('click', refresh);
  refresh();
  window.setInterval(function () {
    if (document.visibilityState === 'visible') refresh();
  }, REFRESH_MS);
})();
