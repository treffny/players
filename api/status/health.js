import { loadJSON } from '../_util.js';
export default async function handler(req,res){
  const present={"players":!!(await loadJSON('data/players.json',null)),"rules":!!(await loadJSON('data/rules.json',null))};
  res.status(200).json({ ok:true, present, now:new Date().toISOString() });
}
