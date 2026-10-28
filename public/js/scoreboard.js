(function () {
  'use strict';

  const FEED_URL = 'https://raw.githubusercontent.com/curburenthusiasm/personal-site/master/data/scoreboard.json';
  const LIVE_KEYS = ['debt', 'us10y', 'gold', 'silver', 'btc', 'stable', 'brent'];
  const TREASURY_DEBT_URL = 'https://fedgazette.com/fed-data/treasury-debt.json';
  const TREASURY_YIELD_URL = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=';
  const STABLECOIN_URL = 'https://stablecoins.llama.fi/stablecoins?includePrices=false';
  const EIA_BRENT_PAGE = 'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm';
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

  function requestText(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 12000);
    return fetch(url, { cache: 'no-store', signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
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
        ? 'Live source reading'
        : metric.status === 'stale'
          ? 'Last verified reading'
          : metric.status === 'snapshot'
            ? 'Published snapshot'
            : 'Baseline snapshot';
      const detail = metric.note ? ' · ' + metric.note : '';
      meta.textContent = state + ' · ' + shortDate(metric.observed_at) + detail;
    }
    if (source && metric.source_url) {
      source.href = metric.source_url;
      source.textContent = (metric.source || 'Source') + ' ↗';
    }
  }

  function setRule(id, result, detail, sourceStatus) {
    const node = document.getElementById(id);
    if (!node) return;
    node.classList.remove('fired', 'not-fired');
    const prefix = sourceStatus === 'baseline'
      ? 'Baseline '
      : sourceStatus === 'snapshot'
        ? 'Snapshot '
        : '';
    if (result === true) {
      node.textContent = prefix + (sourceStatus === 'verified' ? 'FIRED' : 'fired') + (detail ? ' · ' + detail : '');
      node.classList.add('fired');
    } else if (result === false) {
      node.textContent = prefix + (sourceStatus === 'verified' ? 'Not fired' : 'not fired') + (detail ? ' · ' + detail : '');
      node.classList.add('not-fired');
    } else {
      node.textContent = sourceStatus === 'baseline' ? 'Baseline only · not evaluated as current' : 'Unknown · required evidence unavailable';
    }
  }

  function numericValue(metric) {
    if (!metric || !['verified', 'snapshot'].includes(metric.status)) return null;
    if (metric.status === 'snapshot' && !isRecent(metric.observed_at, 4)) return null;
    const match = String(metric.v || '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function evidenceDate(signal) {
    if (!signal) return '';
    const dates = signal.confirmation_dates || [];
    return dates.length ? dates[dates.length - 1] : (signal.reference_date || '');
  }

  function isRecent(day, maxAgeDays) {
    if (!day) return false;
    const parsed = new Date(String(day).slice(0, 10) + 'T23:59:59Z');
    if (Number.isNaN(parsed.getTime())) return false;
    const age = (Date.now() - parsed.getTime()) / 86400000;
    return age >= -1 && age <= maxAgeDays;
  }

  function renderRules(feed) {
    const metrics = {};
    (feed.metrics || []).forEach(function (metric) { metrics[metric.k] = metric; });

    const oat = metrics.oat;
    const oatNumber = numericValue(oat);
    const oatDetail = oat && ['verified', 'snapshot'].includes(oat.status)
      ? oat.v + ' · ' + shortDate(oat.observed_at)
      : (oat && oat.v ? oat.v + ' snapshot' : '');

    if (oatNumber === null) {
      const baselineOat = metrics.oat && metrics.oat.status === 'baseline'
        ? Number(String(metrics.oat.v).match(/-?\d+(?:\.\d+)?/)[0])
        : null;
      const oatStatus = metrics.oat && metrics.oat.status === 'baseline' ? 'baseline' : 'unknown';
      setRule('rule-oat90', baselineOat === null ? null : baselineOat > 90, oatDetail, oatStatus);
      setRule('rule-oat130', baselineOat === null ? null : baselineOat > 130, oatDetail, oatStatus);
    } else {
      setRule('rule-oat90', oatNumber > 90, oatDetail, oat.status);
      setRule('rule-oat130', oatNumber > 130, oatDetail, oat.status);
    }

    const signals = feed.signals || {};
    const signalMeta = feed.signal_meta || {};
    const jointDate = evidenceDate(signalMeta.gold_dxy_together);
    const jointVerified = signalMeta.gold_dxy_together
      && ['verified', 'snapshot'].includes(signalMeta.gold_dxy_together.status)
      && (signalMeta.gold_dxy_together.status !== 'snapshot' || isRecent(jointDate, 5));
    const jointBaseline = signalMeta.gold_dxy_together && signalMeta.gold_dxy_together.status === 'baseline';
    const jointDetail = jointDate ? 'evidence through ' + shortDate(jointDate) : '';
    setRule('rule-golddxy', jointVerified ? signals.gold_dxy_together : (jointBaseline ? signals.gold_dxy_together : null), jointDetail, jointVerified ? signalMeta.gold_dxy_together.status : (jointBaseline ? 'baseline' : 'unknown'));

    const rules = [
      ['rule-auction', 'g7_auction_fail'],
      ['rule-dedollar', 'dedollar_official'],
      ['rule-recap', 'recap_policy_advance']
    ];
    rules.forEach(function (entry) {
      const verified = signalMeta[entry[1]] && signalMeta[entry[1]].status === 'verified';
      setRule(entry[0], verified ? signals[entry[1]] : null, '', verified ? 'verified' : 'unknown');
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

  async function loadPublishedFeed(isAutomatic) {
    const url = FEED_URL + '?refresh=' + Date.now();
    const feed = await requestJson(url);
    if (!feed || !Array.isArray(feed.metrics)) throw new Error('Feed schema is incomplete');
    currentFeed = feed;
    feed.metrics.forEach(function (metric) {
      if (LIVE_KEYS.includes(metric.k)) {
        metric.status = 'stale';
        metric.note = metric.k === 'brent' && isAutomatic
          ? 'EIA is checked on manual refresh only; latest saved observation shown.'
          : 'Refreshing from the source; saved reading retained until confirmed.';
      } else if (metric.k === 'oat' || metric.k === 'dxy') {
        metric.status = 'snapshot';
        metric.note = 'Latest published reading; this source blocks direct browser refresh.';
      }
      applyMetric(metric);
    });
    if (feed.signal_meta && feed.signal_meta.gold_dxy_together && feed.signal_meta.gold_dxy_together.status === 'verified') {
      feed.signal_meta.gold_dxy_together.status = 'snapshot';
    }
    renderRules(feed);
    return feed;
  }

  function metric(key, value, source, url, observedAt, note) {
    if (typeof value !== 'string' || !value || /NaN|Infinity/.test(value)) throw new Error('Source value missing');
    return { k: key, v: value, source: source, source_url: url, status: 'verified', observed_at: observedAt, note: note || '' };
  }

  function replaceMetric(next) {
    if (currentFeed) {
      const index = currentFeed.metrics.findIndex(function (item) { return item.k === next.k; });
      if (index >= 0) currentFeed.metrics[index] = next;
      else currentFeed.metrics.push(next);
    }
    applyMetric(next);
    if (currentFeed) renderRules(currentFeed);
  }

  function parseTreasuryYield(xmlText) {
    const documentXml = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (documentXml.querySelector('parsererror')) throw new Error('Treasury XML could not be parsed');
    const entries = Array.from(documentXml.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'entry'));
    const rows = entries.map(function (entry) {
      const properties = entry.getElementsByTagNameNS('http://schemas.microsoft.com/ado/2007/08/dataservices/metadata', 'properties')[0];
      if (!properties) return null;
      const values = {};
      Array.from(properties.children).forEach(function (node) { values[node.localName] = node.textContent; });
      const dateMatch = String(values.NEW_DATE || '').match(/^\d{4}-\d{2}-\d{2}/);
      const rate = Number(values.BC_10YEAR);
      return dateMatch && Number.isFinite(rate) ? { date: dateMatch[0], rate: rate } : null;
    }).filter(Boolean).sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (!rows.length) throw new Error('Treasury feed has no 10-year observations');
    const latest = rows[rows.length - 1];
    return metric('us10y', latest.rate.toFixed(2) + '%', 'US Treasury Daily Par Yield Curve', 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates', latest.date, 'Latest published daily par yield.');
  }

  function amountShort(value) {
    const magnitude = Math.abs(value);
    if (magnitude >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
    if (magnitude >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
    if (magnitude >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
    return money(value);
  }

  async function loadLiveMetric(key) {
    const now = new Date();
    let item;
    if (key === 'debt') {
      const payload = await requestJson(TREASURY_DEBT_URL);
      if (!payload || payload.ok !== true || !payload.asOf) throw new Error('Treasury debt mirror row missing');
      item = metric(key, amountShort(Number(payload.total)), 'Treasury Debt to the Penny · Fed Gazette mirror', TREASURY_DEBT_URL, payload.asOf, 'CORS-enabled mirror of official U.S. Treasury Fiscal Data; dated observation shown.');
    } else if (key === 'us10y') {
      item = parseTreasuryYield(await requestText(TREASURY_YIELD_URL + now.getUTCFullYear()));
    } else if (key === 'gold' || key === 'silver') {
      const symbol = key === 'gold' ? 'XAU' : 'XAG';
      const payload = await requestJson('https://api.gold-api.com/price/' + symbol);
      const price = Number(payload && payload.price);
      const observed = payload && payload.updatedAt ? payload.updatedAt : now.toISOString();
      item = metric(key, money(price) + '/oz', 'Gold-API spot quote', 'https://api.gold-api.com/price/' + symbol, observed, 'Indicative spot quote; not a settlement price.');
    } else if (key === 'btc') {
      const payload = await requestJson('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      const price = Number(payload && payload.data && payload.data.amount);
      item = metric(key, money(price), 'Coinbase spot quote', 'https://api.coinbase.com/v2/prices/BTC-USD/spot', now.toISOString(), 'Indicative spot quote; retrieval time shown.');
    } else if (key === 'stable') {
      const payload = await requestJson(STABLECOIN_URL);
      const assets = payload && payload.peggedAssets || [];
      const total = assets.reduce(function (sum, asset) {
        const amount = Number(asset && asset.circulating && asset.circulating.peggedUSD);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
      if (!total) throw new Error('Stablecoin circulation missing');
      item = metric(key, amountShort(total), 'DefiLlama stablecoin API', STABLECOIN_URL, now.toISOString(), 'Sum of reported USD-pegged circulating supply.');
    } else if (key === 'brent') {
      const params = new URLSearchParams({ api_key: 'DEMO_KEY', frequency: 'daily', 'data[0]': 'value', 'facets[series][]': 'RBRTE', 'sort[0][column]': 'period', 'sort[0][direction]': 'desc', length: '1' });
      const payload = await requestJson('https://api.eia.gov/v2/petroleum/pri/spt/data/?' + params.toString());
      const row = payload && payload.response && payload.response.data && payload.response.data[0];
      if (!row || !row.period) throw new Error('EIA Brent observation missing');
      item = metric(key, money(Number(row.value)) + '/bbl', 'US Energy Information Administration', EIA_BRENT_PAGE, row.period, 'Latest published daily spot observation; publication may lag.');
    }
    if (!item) throw new Error('No live reader for ' + key);
    replaceMetric(item);
    return item;
  }

  async function loadLiveMetricSafely(key) {
    try {
      return await loadLiveMetric(key);
    } catch (error) {
      if (currentFeed) {
        const prior = currentFeed.metrics.find(function (item) { return item.k === key; });
        if (prior) {
          prior.status = 'stale';
          prior.note = 'Live refresh unavailable; last published reading retained.';
          applyMetric(prior);
        }
      }
      return null;
    }
  }

  async function refreshScoreboard(isAutomatic) {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Refreshing…';
    if (!isAutomatic) status.textContent = 'Refreshing current public sources and loading the latest published evidence…';

    const feedOutcomes = await Promise.allSettled([loadPublishedFeed(isAutomatic)]);
    const feedResult = feedOutcomes[0];
    const requestedKeys = isAutomatic ? LIVE_KEYS.filter(function (key) { return key !== 'brent'; }) : LIVE_KEYS;
    const liveOutcomes = await Promise.allSettled(requestedKeys.map(function (key) {
      return loadLiveMetricSafely(key);
    }));
    const liveCount = liveOutcomes.filter(function (item) { return item.status === 'fulfilled' && item.value; }).length;

    if (feedResult.status === 'fulfilled') {
      const feed = feedResult.value;
      const date = shortDate(feed.refreshed_at || feed.as_of);
      const feedNote = isAutomatic
        ? 'EIA Brent is checked on manual refresh due to its shared demo quota.'
        : 'Brent stays at its last verified reading if the shared EIA demo quota is unavailable.';
      status.textContent = liveCount + '/' + requestedKeys.length + ' current source readings refreshed · evidence snapshot last published ' + date + '. OAT–Bund, DXY, signals, and policy states remain dated readings. ' + feedNote;
    } else {
      status.textContent = 'Published evidence feed unavailable; saved readings were kept. ' + liveCount + '/' + requestedKeys.length + ' current source readings refreshed.';
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
