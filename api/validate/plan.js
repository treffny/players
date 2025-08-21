import { loadJSON, getJSONBody } from '../_util.js';
export default async function handler(req,res){
  try{
    const { week_plan=[], strict=false, autofix=true } = await getJSONBody(req) || {};
    const players = await loadJSON('data/players.json', []);
    const map = new Map(players.map(p=>[p.name.toLowerCase(), p]));
    const issues=[]; const patched=week_plan.map(r=>({...r}));
    for (const r of patched){
      const p = map.get(String(r.account||'').toLowerCase());
      if(!p){ issues.push({type:'unknown_company', account:r.account}); continue; }
      const h = p.handles || {};
      if ((r.platform||'').toLowerCase()==='x'){
        if ((!r.target_handle || !r.target_handle.trim()) && autofix && h.x) r.target_handle='@'+String(h.x).replace(/^@/,'');
        if (!r.target_handle) issues.push({type:'missing_handle', platform:'x', account:r.account});
      } else {
        if ((!r.target_handle || !r.target_handle.trim()) && autofix && h.linkedin) r.target_handle=h.linkedin;
        if (!r.target_handle) issues.push({type:'missing_handle', platform:'linkedin', account:r.account});
      }
    }
    const ok = issues.length===0;
    if (strict && !ok) return res.status(422).json({ ok:false, issues, week_plan: patched });
    res.status(200).json({ ok, issues, week_plan: patched });
  }catch(e){ res.status(500).json({ error: e.message || 'validate_error' }); }
}
