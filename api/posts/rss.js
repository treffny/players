import Parser from 'rss-parser';
import { loadJSON, getJSONBody } from '../_util.js';
const parser = new Parser();

export default async function handler(req,res){
  try{
    const body = await getJSONBody(req);
    const { lookbackHours=168, maxPerFeed=3, tiers=null } = body || {};
    const players = await loadJSON('data/players.json', []);
    const selected = Array.isArray(tiers) ? players.filter(p=>tiers.includes(p.tier)) : players;
    const cutoff = Date.now() - lookbackHours*3600*1000;
    const items = [];

    for (const p of selected){
      for (const feed of (p.feeds || [])){
        if (feed.type !== 'rss') continue;
        try {
          const f = await parser.parseURL(feed.url);
          for (const it of (f.items || []).slice(0, maxPerFeed*2)){
            const ts = Date.parse(it.isoDate || it.pubDate || '') || 0;
            if (!ts || ts < cutoff) continue;
            items.push({
              platform: 'web',
              account: p.name,
              tier: p.tier,
              title: it.title || '',
              url: it.link || '',
              createdAt: new Date(ts).toISOString(),
              text: String(it.contentSnippet || it.content || '').replace(/<[^>]+>/g,'').slice(0,500)
            });
          }
        } catch (e) {
          // ignore individual feed errors
        }
      }
    }

    items.sort((a,b)=> Date.parse(b.createdAt) - Date.parse(a.createdAt));
    res.status(200).json({ items: items.slice(0, 120) });
  }catch(e){
    res.status(500).json({ error: e.message || 'rss_error' });
  }
}
