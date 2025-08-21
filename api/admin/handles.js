import { loadJSON, getJSONBody } from '../_util.js';
let cache = null;
export default async function handler(req,res){
  try{
    if (!cache) cache = await loadJSON('data/players.json', []);
    if (req.method==='GET'){
      const out={}; for (const p of cache) out[p.name]=p.handles||{};
      return res.status(200).json({ handles: out });
    }
    if (req.method==='POST'){
      const { updates=[] } = await getJSONBody(req) || {};
      const map=new Map(cache.map(p=>[p.name.toLowerCase(), p]));
      for (const u of updates){
        const key=String(u.name||'').toLowerCase();
        if (!map.has(key)) cache.push({ name:u.name, tier:'mid', handles:{} });
        const p = map.get(key) || cache.find(x=>x.name.toLowerCase()===key);
        p.handles = { ...(p.handles||{}), ...(u.x?{x:u.x}:{}), ...(u.linkedin?{linkedin:u.linkedin}:{}) };
      }
      return res.status(200).json({ ok:true, handles: cache.map(p=>({name:p.name, handles:p.handles})) });
    }
    res.status(405).json({ error:'method_not_allowed' });
  }catch(e){ res.status(500).json({ error: e.message || 'handles_error' }); }
}
