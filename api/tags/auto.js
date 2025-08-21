import { loadJSON, getJSONBody } from '../_util.js';
export default async function handler(req,res){
  try{
    const { items=[] } = await getJSONBody(req) || {};
    const rules = await loadJSON('data/rules.json', {});
    const tagged = items.map(it=>{
      const t = (it.title + ' ' + (it.text || '')).toLowerCase();
      const themes=[];
      for (const [theme,kws] of Object.entries(rules)){
        if (kws.some(k => t.includes(k.toLowerCase()))) themes.push(theme);
      }
      return { ...it, themes };
    });
    res.status(200).json({ items: tagged });
  }catch(e){ res.status(500).json({ error: e.message || 'tag_error' }); }
}
