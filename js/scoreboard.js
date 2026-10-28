(function () {
  'use strict';

  const FEED_URL = 'https://raw.githubusercontent.com/curburenthusiasm/personal-site/master/data/scoreboard.json';
  const LIVE_QUOTES = {
    gold: {
      url: 'https://api.gold-api.com/price/XAU',
      source: 'Gold-API spot quote',
      label: 'Gold'
    },
    silver: {
      url: 'https://api.gold-api.com/price/XAG',
      source: 'Gold-API spot quote',
      label: 'Silver spot'
    },
    btc: {
      url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
      source: 'Coinbase spot quote',
      label: 'Bitcoin'
    }
  };
  const TRIGGER_LABELS = {
    genius_final_rules: 'GENIUS final rules',
    genius_effective: 'GENIUS effective',
    issuer_approvals: 'Issuer approvals',
    btc_reserve: 'Bitcoin reserve',
    btc_budget_neutral: 'BTC budget-neutral',
    clarity_act: 'CLARITY Act',
    hr8957: 'H.R. 8957',
    gold_revaluation: 'Gold revaluation',
    hard_asset_backing: 'Hard-asset backing'
  };
  const button = document.getElementById('scoreboard-refresh');
  const status = document.getElementById('scoreboard-status');
  let currentFeed = null;

  function requestJson(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 12000);
    return fetch(url, { cache: 'no-store', signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .finally(function () { window.clearTimeout(timeout); });
  }

  function shortDate(value) {
    if (!value) return 'date not supplied';
    const dateOnly = String(value).match(/^\d{4}-\d{2}-\d{2}$/);
    const date = dateOnly
      ? new Date(value + 'T12:00:00Z')
      : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      ...(dateOnly ? {} : { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    }).format(date);
  }

  function money(value) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: 'USD', maximumFractionDigits: 2
    }).format(Number(value));
  }

  function applyMetric(metric) {
    if (!metric || !metric.k) return;
    const value = document.getElementById('metric-' + metric.k);
    const meta = document.getElementById('metric-meta-' + metric.k);
    const source = document.getElementById('source-' + metric.k);
    if (value && typeof metric.v === 'string') value.textContent = metric.v;
    if (meta) {
      const state = metric.status === 'verified'
        ? 'Source reading'
        : metric.status === 'stale'
          ? 'Last verified reading'
          : 'Baseline snapshot';
      const detail = metric.note ? ' · ' + metric.note : '';
      meta.textContent = state + ' · ' + shortDate(metric.observed_at) + detail;
    }
    if (source && metric.source_url) {
      source.href = metric.source_url;
      source.textContent = (metric.source || 'Source') + ' ↗';
    }
  }

  function setRule(id, result, detail, isBaseline) {
    const node = document.getElementById(id);
    if (!node) return;
    node.classList.remove('fired', 'not-fired');
    if (result === true) {
      node.textContent = (isBaseline ? 'Baseline fired' : 'FIRED') + (detail ? ' · ' + detail : '');
      node.classList.add('fired');
    } else if (result === false) {
      node.textContent = (isBaseline ? 'Baseline not fired' : 'Not fired') + (detail ? ' · ' + detail : '');
      node.classList.add('not-fired');
    } else {
      node.textContent = isBaseline ? 'Baseline only · not evaluated as current' : 'Unknown · required evidence unavailable';
    }
  }

  function numericValue(metric) {
    if (!metric || metric.status !== 'verified') return null;
    const match = String(metric.v || '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function renderRules(feed) {
    const metrics = {};
    (feed.metrics || []).forEach(function (metric) { metrics[metric.k] = metric; });

    const oat = metrics.oat;
    const oatNumber = numericValue(oat);
    const oatDetail = oat && oat.status === 'verified'
      ? oat.v + ' · ' + shortDate(oat.observed_at)
      : (oat && oat.v ? oat.v + ' snapshot' : '');

    if (oatNumber === null) {
      const baselineOat = metrics.oat && metrics.oat.status === 'baseline'
        ? Number(String(metrics.oat.v).match(/-?\d+(?:\.\d+)?/)[0])
        : null;
      setRule('rule-oat90', baselineOat === null ? null : baselineOat > 90, oatDetail, true);
      setRule('rule-oat130', baselineOat === null ? null : baselineOat > 130, oatDetail, true);
    } else {
      setRule('rule-oat90', oatNumber > 90, oatDetail, false);
      setRule('rule-oat130', oatNumber > 130, oatDetail, false);
    }

    const signals = feed.signals || {};
    const signalMeta = feed.signal_meta || {};
    const jointVerified = signalMeta.gold_dxy_together && signalMeta.gold_dxy_together.status === 'verified';
    const jointBaseline = signalMeta.gold_dxy_together && signalMeta.gold_dxy_together.status === 'baseline';
    setRule('rule-golddxy', jointVerified ? signals.gold_dxy_together : (jointBaseline ? signals.gold_dxy_together : null), '', !jointVerified);

    const rules = [
      ['rule-auction', 'g7_auction_fail'],
      ['rule-dedollar', 'dedollar_official'],
      ['rule-recap', 'recap_policy_advance']
    ];
    rules.forEach(function (entry) {
      const verified = signalMeta[entry[1]] && signalMeta[entry[1]].status === 'verified';
      setRule(entry[0], verified ? signals[entry[1]] : null, '', !verified);
    });

    const triggerGrid = document.getElementById('trigger-grid');
    if (triggerGrid && Array.isArray(feed.triggers)) {
      const values = {};
      feed.triggers.forEach(function (trigger) { values[trigger.id] = trigger; });
      triggerGrid.textContent = '';
      Object.keys(TRIGGER_LABELS).forEach(function (key) {
        const card = document.createElement('div');
        card.className = 'trigger-card';
        const label = document.createElement('span');
        label.textContent = TRIGGER_LABELS[key];
        const state = document.createElement('strong');
        const item = values[key] || {};
        state.textContent = item.state && item.state !== 'UNKNOWN' ? item.state : 'Unverified';
        card.appendChild(label);
        card.appendChild(state);
        triggerGrid.appendChild(card);
      });
    }

    const eventsNode = document.getElementById('macro-events');
    if (eventsNode && Array.isArray(feed.events) && feed.events.length) {
      eventsNode.textContent = feed.events.slice(0, 3).join(' · ');
      if (feed.events_as_of) eventsNode.textContent += ' · As of ' + shortDate(feed.events_as_of);
    }
  }

  async function loadPublishedFeed() {
    const url = FEED_URL + '?refresh=' + Date.now();
    const feed = await requestJson(url);
    if (!feed || !Array.isArray(feed.metrics)) throw new Error('Feed schema is incomplete');
    currentFeed = feed;
    feed.metrics.forEach(applyMetric);
    renderRules(feed);
    return feed;
  }

  async function loadLiveQuote(key, definition) {
    const payload = await requestJson(definition.url);
    let price;
    let observedAt;
    if (key === 'btc') {
      price = Number(payload && payload.data && payload.data.amount);
      observedAt = new Date().toISOString();
    } else {
      price = Number(payload && payload.price);
      observedAt = payload && payload.updatedAt;
    }
    if (!Number.isFinite(price) || price <= 0) throw new Error('Quote missing');
    const metric = {
      k: key,
      v: money(price) + (key === 'btc' ? '' : '/oz'),
      source: definition.source,
      source_url: definition.url,
      status: 'verified',
      observed_at: observedAt,
      note: 'Indicative spot quote; not a settlement price.'
    };
    applyMetric(metric);
    return metric;
  }

  async function refreshScoreboard(isAutomatic) {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Refreshing…';
    if (!isAutomatic) status.textContent = 'Requesting the latest published feed and current public spot quotes…';

    const feedTask = loadPublishedFeed();
    const quoteTasks = Object.keys(LIVE_QUOTES).map(function (key) {
      return loadLiveQuote(key, LIVE_QUOTES[key]);
    });
    const outcomes = await Promise.allSettled([feedTask].concat(quoteTasks));
    const feedResult = outcomes[0];
    const liveCount = outcomes.slice(1).filter(function (item) { return item.status === 'fulfilled'; }).length;

    if (feedResult.status === 'fulfilled') {
      const feed = feedResult.value;
      const date = shortDate(feed.refreshed_at || feed.as_of);
      status.textContent = 'Published feed refreshed ' + date + ' · ' + liveCount + '/3 live spot quotes refreshed. Daily series follow source release times.';
    } else {
      status.textContent = 'Saved readings were kept; the public feed could not be reached. ' + liveCount + '/3 live spot quotes refreshed.';
    }

    button.disabled = false;
    button.textContent = 'Refresh latest data';
  }

  if (button && status) {
    button.addEventListener('click', function () { refreshScoreboard(false); });
    refreshScoreboard(true);
    window.setInterval(function () {
      if (document.visibilityState === 'visible') refreshScoreboard(true);
    }, 15 * 60 * 1000);
  }
})();
