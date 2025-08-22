// api/posts/rss.js
import players from '../../data/players.json';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });

// ---- helpers ----
function parseDateSafe(d) {
  const t = Date.parse(d);
  return Number.isNaN(t) ? Date.now() : t;
}

async function fetchRssFeed(url) {
  // Native fetch timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    // Some servers don't set content-type correctly, so sniff
    const looksXml =
      contentType.includes('xml') ||
      contentType.includes('rss') ||
      text.trim().startsWith('<');

    if (!looksXml) throw new Error(`Non-XML content from ${url}`);

    const feed = await parser.parseString(text);

    const items = (feed.items || []).map((it) => ({
      title: it.title || '(no title)',
      link: it.link || it.guid || '',
      createdAt: it.isoDate || it.pubDate || new Date().toISOString(),
      sourceTitle: feed.title || url,
    }));

    return { ok: true, items, meta: { title: feed.title || url } };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---- route handler ----
export default async function handler(req, res) {
  // Always return JSON and never leak HTML error pages
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(200).json({
        count: 0,
        items: [],
        debug: { error: 'Use POST or GET' },
      });
    }

    const body = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const lookbackHours = Number(body.lookbackHours ?? 720); // 30 days
    const maxPerFeed = Number(body.maxPerFeed ?? 4);
    const tiers = Array.isArray(body.tiers)
      ? body.tiers
      : ['major', 'mid', 'light'];

    const cutoffMs = Date.now() - lookbackHours * 3600 * 1000;

    // Collect RSS URLs from players.json
    const urls = [];
    for (const p of players) {
      if (!tiers.includes(p.tier)) continue;
      for (const f of p.feeds || []) {
        if (f?.type === 'rss' && f?.url) {
          urls.push({ url: f.url, sourceName: p.name });
        }
      }
    }

    // Fetch all feeds safely
    const results = await Promise.all(urls.map((u) => fetchRssFeed(u.url)));

    const errors = [];
    const allItems = [];

    results.forEach((r, i) => {
      const srcName = urls[i].sourceName;
      const srcUrl = urls[i].url;

      if (!r.ok) {
        errors.push({ source: srcName, url: srcUrl, error: r.error });
        return;
      }

      // Filter by date and cap per feed
      const picked = r.items
        .filter((it) => parseDateSafe(it.createdAt) >= cutoffMs)
        .slice(0, maxPerFeed)
        .map((it) => ({
          title: it.title,
          link: it.link,
          createdAt: it.createdAt,
          source: srcName,
        }));

      allItems.push(...picked);
    });

    // De-dupe by link (or title if link missing)
    const seen = new Set();
    const deduped = [];
    for (const it of allItems) {
      const key = it.link || `t:${it.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(it);
    }

    // Sort newest first and cap
    deduped.sort(
      (a, b) => parseDateSafe(b.createdAt) - parseDateSafe(a.createdAt)
    );
    const capped = deduped.slice(0, 120);

    return res.status(200).json({
      count: capped.length,
      items: capped,
      debug: {
        feedsInEnv: urls.length,
        errors, // helpful for debugging in the Network tab
      },
    });
  } catch (e) {
    // Last line of defence: still return valid JSON
    return res.status(200).json({
      count: 0,
      items: [],
      debug: { error: String(e.message || e) },
    });
  }
}
