import { loadJSON, getJSONBody } from '../_util.js';
export default async function handler(req,res){
  try{
    const { items=[], prefer={majors:3,mids:2,niche:2}, filterThemes=[], preferredPlatform='both' } = await getJSONBody(req) || {};
    const players = await loadJSON('data/players.json', []);
    const handleMap = new Map(players.map(p=>[p.name.toLowerCase(), p.handles || {}]));
    const filtered = filterThemes.length ? items.filter(i => (i.themes||[]).some(t=>filterThemes.includes(t))) : items;

    const majors = filtered.filter(i => i.tier === 'major');
    const mids   = filtered.filter(i => i.tier === 'mid');
    const niche  = filtered.filter(i => i.tier === 'niche');

    const pick = (arr,n) => arr.slice(0, Math.max(0,n));
    let plan = [...pick(majors, prefer.majors), ...pick(mids, prefer.mids), ...pick(niche, prefer.niche)];
    const rest = filtered.filter(i => !plan.includes(i));
    while (plan.length < 7 && rest.length) plan.push(rest.shift());
    plan = plan.slice(0,7);

    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const rows = [];
    for (let i=0;i<plan.length;i++){
      const it=plan[i]; const h=handleMap.get((it.account||'').toLowerCase())||{};
      const base={ day:days[i], account:it.account, url:it.url, tier:it.tier, themes:it.themes||[],
        comment:"Briefing note: decision advantage, interoperability, resilience.",
        account_x: h.x ? '@'+String(h.x).replace(/^@/,'') : '', account_linkedin: h.linkedin || '' };
      if (preferredPlatform==='both'){
        rows.push({ platform:'x', target_handle: base.account_x, ...base });
        rows.push({ platform:'linkedin', target_handle: base.account_linkedin, ...base });
      } else if (preferredPlatform==='x'){
        rows.push({ platform:'x', target_handle: base.account_x, ...base });
      } else {
        rows.push({ platform:'linkedin', target_handle: base.account_linkedin, ...base });
      }
    }
    res.status(200).json({ week_plan: rows });
  }catch(e){ res.status(500).json({ error: e.message || 'plan_error' }); }
}
