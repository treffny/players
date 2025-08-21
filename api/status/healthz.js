export default async function handler(req,res){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.status(200).send('<h1>OK</h1>');
}
