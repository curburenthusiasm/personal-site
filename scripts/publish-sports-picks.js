'use strict';

// Called by the sports bot only after a successful free-channel Discord post.
// The public schema is deliberately allowlisted: no stakes, bankroll, EV,
// reasoning text, account data, or private-channel picks enter the site feed.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SITE_ROOT = path.resolve(process.env.PERSONAL_SITE_REPO || path.join(__dirname, '..'));
const FEED_RELATIVE_PATH = 'data/sports-picks.json';
const FEED_PATH = path.join(SITE_ROOT, FEED_RELATIVE_PATH);
const SPORTS = new Set(['NBA', 'NHL', 'NFL', 'NCAAF', 'MLB']);

function git(args, options = {}) {
  return execFileSync('git', ['-C', SITE_ROOT, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  }).trim();
}

function cleanText(value, limit = 100) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function scorePercent(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  const normalized = score >= 0 && score <= 1 ? score * 100 : score;
  if (normalized < 0 || normalized > 100) return null;
  return Math.round(normalized * 10) / 10;
}

function oddsLabel(pick) {
  const value = pick.bestOdds && pick.bestOdds.price !== undefined ? pick.bestOdds.price : pick.odds;
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') return value > 0 ? '+' + value : String(value);
  return cleanText(value, 20);
}

function candidatesFor(sport, picks) {
  const list = Array.isArray(picks) ? picks : [];
  const sorted = list.filter((pick) => pick && scorePercent(pick.confidence) !== null)
    .sort((a, b) => scorePercent(b.confidence) - scorePercent(a.confidence));
  if (sport === 'MLB') {
    return [
      ...sorted.filter((pick) => scorePercent(pick.confidence) >= 65).slice(0, 3),
      ...sorted.filter((pick) => scorePercent(pick.confidence) >= 55 && scorePercent(pick.confidence) < 65).slice(0, 3)
    ];
  }
  if (sport === 'NBA') return sorted.slice(0, 6);
  if (sport === 'NHL') return sorted;
  return sorted.filter((pick) => scorePercent(pick.confidence) >= 72).slice(0, 3);
}

function publicPick(sport, pick) {
  const selection = cleanText(pick.pick || pick.team, 120);
  if (!selection) return null;

  let market = cleanText(pick.betType || pick.market, 60);
  const line = cleanText(pick.line || pick.recommendedLine, 30);
  if (market && line && !market.toLowerCase().includes(line.toLowerCase())) market += ' ' + line;
  if (!market && line) market = 'Spread ' + line;
  if (!market) market = sport === 'MLB' || sport === 'NHL' ? 'Moneyline' : 'Spread';

  const bestOdds = pick.bestOdds || {};
  const result = {
    selection,
    market,
    confidence: scorePercent(pick.confidence)
  };
  const opponent = cleanText(pick.opponent, 100);
  const odds = oddsLabel(pick);
  const bookmaker = cleanText(bestOdds.book || pick.book, 50);
  if (opponent) result.opponent = opponent;
  if (odds) result.odds = odds;
  if (bookmaker) result.bookmaker = bookmaker;
  return result;
}

function dateInNewYork(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function readFeed() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FEED_PATH, 'utf8'));
    if (parsed.schema_version !== 1 || !Array.isArray(parsed.feeds)) throw new Error('Unexpected feed schema');
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return { schema_version: 1, updated_at: null, feeds: [] };
    throw error;
  }
}

function writeFeedFile(sport, picks, postedAt) {
  const current = readFeed();
  const next = {
    schema_version: 1,
    updated_at: postedAt.toISOString(),
    feeds: current.feeds.filter((item) => item && item.sport !== sport)
  };
  next.feeds.push({
    sport,
    slate_date: dateInNewYork(postedAt),
    posted_at: postedAt.toISOString(),
    picks: candidatesFor(sport, picks).map((pick) => publicPick(sport, pick)).filter(Boolean)
  });
  next.feeds.sort((a, b) => a.sport.localeCompare(b.sport));

  const temporaryPath = FEED_PATH + '.tmp';
  fs.writeFileSync(temporaryPath, JSON.stringify(next, null, 2) + '\n', { mode: 0o644 });
  fs.renameSync(temporaryPath, FEED_PATH);
}

function withRepositoryLock(callback) {
  const gitDirectory = path.resolve(SITE_ROOT, git(['rev-parse', '--git-dir']));
  const lockPath = path.join(gitDirectory, 'sports-picks-feed.lock');
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another sports feed publication is in progress');
    throw error;
  }

  try {
    fs.writeFileSync(descriptor, `${process.pid}\n`);
    return callback();
  } finally {
    fs.closeSync(descriptor);
    fs.unlinkSync(lockPath);
  }
}

function publishFreeSportFeed(sport, picks, options = {}) {
  const normalizedSport = String(sport || '').toUpperCase();
  if (!SPORTS.has(normalizedSport)) throw new Error('Unsupported public sports feed');
  if (!fs.existsSync(FEED_PATH)) throw new Error('Personal site feed file is missing');

  return withRepositoryLock(() => {
    if (git(['branch', '--show-current']) !== 'master') {
      throw new Error('Sports feed publishing is paused unless the site checkout is on master');
    }
    if (git(['status', '--porcelain', '--', FEED_RELATIVE_PATH])) {
      throw new Error('Sports feed file has pre-existing local changes; publication skipped');
    }

    const postedAt = options.postedAt ? new Date(options.postedAt) : new Date();
    if (Number.isNaN(postedAt.getTime())) throw new Error('Invalid sports feed timestamp');
    writeFeedFile(normalizedSport, picks, postedAt);

    git(['add', '--', FEED_RELATIVE_PATH]);
    const staged = execFileSync('git', ['-C', SITE_ROOT, 'diff', '--cached', '--name-only', '--', FEED_RELATIVE_PATH], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
    if (staged) {
      execFileSync('git', [
        '-C', SITE_ROOT,
        '-c', 'user.name=Field Notes',
        '-c', 'user.email=36742531+curburenthusiasm@users.noreply.github.com',
        'commit', '--only', '-m', 'data: publish free sports picks', '--', FEED_RELATIVE_PATH
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    }

    // Push only when every unpublished commit is limited to this feed file.
    git(['fetch', 'origin', 'master']);
    const changedPaths = git(['diff', '--name-only', 'origin/master..HEAD']).split('\n').filter(Boolean);
    if (changedPaths.length && changedPaths.every((item) => item === FEED_RELATIVE_PATH)) {
      git(['push', 'origin', 'master']);
      return { published: true, sport: normalizedSport, picks: candidatesFor(normalizedSport, picks).length };
    }
    if (changedPaths.length) throw new Error('Site checkout has unrelated unpushed commits; feed push skipped');
    return { published: false, sport: normalizedSport, picks: candidatesFor(normalizedSport, picks).length };
  });
}

module.exports = { publishFreeSportFeed, candidatesFor, publicPick };
