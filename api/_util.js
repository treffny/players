import fs from 'fs/promises';
export async function loadJSON(path, fallback=null){ try { return JSON.parse(await fs.readFile(path,'utf-8')); } catch { return fallback; } }
export function csvEscape(s=""){ const t=String(s).replace(/"/g,'""'); return /[",\n]/.test(t) ? `"${t}"` : t; }
export function toCSV(rows, header){ const lines=[header.join(',')]; for(const r of rows){ lines.push(header.map(k=>{ const v = Array.isArray(r[k]) ? r[k].join('|') : (r[k] ?? ''); return csvEscape(String(v)); }).join(',')); } return lines.join('\n'); }
async function readBody(req){ const chunks=[]; for await (const c of req) chunks.push(c); if (!chunks.length) return null; try { return JSON.parse(Buffer.concat(chunks).toString('utf-8')); } catch { return null; } }
export async function getJSONBody(req){ return (req.method==='POST'||req.method==='PUT'||req.method==='PATCH') ? (await readBody(req) || {}) : {}; }
