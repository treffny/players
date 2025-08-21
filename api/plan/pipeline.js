import { loadJSON } from '../_util.js';
async function post(url, body){ return await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(r=>r.json()); }
export default async function handler(req,res){
  try{
    const url = new URL(req.url, 'http://x');
    const preset = url.searchParams.get('preset') || 'standard';
    const confs = await loadJSON('data/pipeline_config.json', {});
    const cfg = confs[preset] || confs.standard || {};

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host  = req.headers['host'];
    const base  = `${proto}://${host}`;

    const rss = await post(`${base}/api/posts/rss`, { tiers: cfg.tiers, lookbackHours: cfg.lookbackHours, maxPerFeed: cfg.maxPerFeed });
    const tagged = await post(`${base}/api/tags/auto`, { items: rss.items || [] });
    const plan = await post(`${base}/api/plan/week`, { items: tagged.items || [], prefer: cfg.prefer, filterThemes: cfg.filterThemes || [], preferredPlatform: cfg.preferredPlatform || 'both' });
    const policy = await post(`${base}/api/policy/apply`, { week_plan: plan.week_plan || [] });
    const valid = await post(`${base}/api/validate/plan`, { week_plan: policy.week_plan || [], strict: cfg.strict === true, autofix: cfg.autofix !== false });

    res.status(200).json({ week_plan: valid.week_plan || [], counts: { fetched: (rss.items||[]).length, planned: (valid.week_plan||[]).length } });
  }catch(e){ res.status(500).json({ error: e.message || 'pipeline_error' }); }
}
