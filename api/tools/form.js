export default async function handler(req,res){
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>The Sixth Field — Tools</title>
  <style>:root{--bg:#0c1116;--panel:#0f141a;--line:#1b242d;--fg:#e5f0e9;--muted:#9fb4a3;--accent:#6ac38b}
  *{box-sizing:border-box}body{background:var(--bg);color:var(--fg);font:15px/1.55 system-ui;margin:0}
  .wrap{max-width:1000px;margin:0 auto;padding:28px 16px}.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 16px}
  textarea,input,select{width:100%;background:#111820;color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:10px}textarea{min-height:180px;resize:vertical}
  .btn{padding:10px 14px;border-radius:10px;border:1px solid #23302b;background:linear-gradient(180deg,#12201a,#0f1a15);color:var(--fg);cursor:pointer}
  table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px solid var(--line);padding:8px 6px;text-align:left}th{color:var(--muted)}</style></head>
  <body><div class="wrap"><h1>Players Watch — Tools</h1>
  <div class="card"><h3>1) Build Plan</h3>
    <button class="btn" onclick="buildPlan('standard')">Standard (both)</button>
    <button class="btn" onclick="buildPlan('linkedin')">LinkedIn only</button>
    <button class="btn" onclick="buildPlan('xfast')">X only</button>
    <label>Plan JSON</label><textarea id="plan"></textarea>
    <button class="btn" onclick="validatePlan()">Validate (auto-fix handles)</button> <span id="val" style="color:#9fb4a3"></span>
  </div>
  <div class="card"><h3>2) Export CSV</h3>
    <label>Preset</label><select id="preset"><option>standard</option><option>linkedin</option><option>xfast</option></select>
    <label>Timezone</label><input id="tz" value="Europe/Amsterdam"/>
    <label>X time</label><input id="tx" value="09:00"/>
    <label>LinkedIn time</label><input id="tli" value="11:00"/>
    <button class="btn" onclick="exportCSV()">Export CSV (auto-dates next week)</button>
  </div>
  <script>
    const el=s=>document.querySelector(s);
    async function buildPlan(p){ const r=await fetch('/api/plan/pipeline?preset='+p,{method:'POST'}); const j=await r.json(); el('#plan').value=JSON.stringify(j.week_plan||[],null,2); }
    async function validatePlan(){
      const plan = JSON.parse(el('#plan').value||'[]');
      const r = await fetch('/api/validate/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({week_plan:plan,strict:false,autofix:true})});
      const j = await r.json(); if(j.week_plan) el('#plan').value=JSON.stringify(j.week_plan,null,2); el('#val').textContent = (j.ok?'✓ OK ':'⚠ Issues ')+ (j.issues?j.issues.length:0);
    }
    async function exportCSV(){
      const week_plan = JSON.parse(el('#plan').value||'[]');
      const preset = el('#preset').value, tz=el('#tz').value, tx=el('#tx').value, tli=el('#tli').value;
      const r = await fetch('/api/export/csv-scheduler?preset='+preset,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({week_plan,timezone:tz,timeByPlatform:{x:tx,linkedin:tli}})});
      const txt = await r.text(); const blob = new Blob([txt],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='players_watch.csv'; a.click();
    }
  </script>
  </div></body></html>`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.status(200).send(html);
}
