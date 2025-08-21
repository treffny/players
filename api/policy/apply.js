import { loadJSON, getJSONBody } from '../_util.js';
export default async function handler(req,res){
  try{
    const { week_plan=[], policy=null } = await getJSONBody(req) || {};
    const pol = policy || await loadJSON('data/platform_policy.json', { x:{includeUrl:false}, linkedin:{includeUrl:true} });
    const out = week_plan.map(r=>{
      const p = String(r.platform||'').toLowerCase();
      const include = (p==='linkedin') ? pol.linkedin?.includeUrl !== false : (p==='x') ? pol.x?.includeUrl === true : true;
      let comment=String(r.comment||''), url=r.url||'';
      if (!include){ comment = comment.replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim(); url=''; }
      return { ...r, comment, url };
    });
    res.status(200).json({ week_plan: out });
  }catch(e){ res.status(500).json({ error: e.message || 'policy_error' }); }
}
