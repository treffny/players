// lib/fetchRss.js
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000 // ms, parser uses this for HTTP too
});

export async function fetchRssFeed(url) {
  // Native fetch timeout
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }

    // Basic content sniffing, some servers omit headers
    const ctype = res.headers.get('content-type') || '';
    const text = await res.text();
    const looksXml = ctype.includes('xml') || ctype.includes('rss') || text.trim().startsWith('<');

    if (!looksXml) {
      throw new Error(`Non XML content from ${url}`);
    }

    const feed = await parser.parseString(text);

    // Normalise
    const items = (feed.items || []).map(it => ({
      title: it.title || '(no title)',
      link: it.link || it.guid || '',
      createdAt: it.isoDate || it.pubDate || new Date().toISOString(),
      source: feed.title || url
    }));

    return { ok: true, items, meta: { title: feed.title || url } };
  } catch (err) {
    return { ok: false, error: `${err.message}` };
  } finally {
    clearTimeout(to);
  }
}
