import { toCSV, loadJSON, getJSONBody } from '../_util.js';
function nextMonday(){ const now=new Date(); const day=now.getDay(); const delta=((8-day)%7)||7; const d=new Date(now); d.setDate(now.getDate()+delta); d.setHours(0,0,0,0); return d; }
function dateStr(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
export default async function handler(req,res){
  try{
    const url = new URL(req.url, 'http://x');
    const presetName = url.searchParams.get('preset') || 'standard';
    const presets = await loadJSON('data/export_presets.json', {});
    const preset = presets[presetName] || {};
    const body = await getJSONBody(req) || {};
    const week_plan = body.week_plan || [];
    const timezone = body.timezone || preset.timezone || 'Europe/Amsterdam';
    const timeByPlatform = body.timeByPlatform || preset.timeByPlatform || {};
    const timeFallback = body.time || preset.time || '09:00';
    const type = (body.type || preset.type || 'buffer').toLowerCase();
    const base = nextMonday(); const dayIndex={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};
    const rows=[];
    for (const r of week_plan){
      const offset = dayIndex[r.day] ?? 0; const d=new Date(base); d.setDate(base.getDate()+offset);
      const date = dateStr(d); const plat=(r.platform||'').toLowerCase(); const time=timeByPlatform[plat] || timeFallback;
      const message = r.comment || `Update: ${r.account}`; const link=r.url||'';
      const profile = (plat==='x') ? (r.target_handle || r.account_x || '') : (r.target_handle || r.account_linkedin || '');
      if (type==='buffer') rows.push({ Text:message, Link:link, "Scheduled At": `${date} ${time}`, Timezone: timezone, Platform: plat, Profile: profile });
      else rows.push({ Date:date, Time:time, Message:message, Link:link, Profile:profile, Platform:plat, Timezone:timezone });
    }
    const header = (type==='buffer') ? ['Text','Link','Scheduled At','Timezone','Platform','Profile'] : ['Date','Time','Message','Link','Profile','Platform','Timezone'];
    const csv = toCSV(rows, header);
    res.setHeader('Content-Type','text/csv; charset=utf-8'); res.status(200).send(csv);
  }catch(e){ res.status(500).json({ error: e.message || 'csv_sched_error' }); }
}
