export default function handler(req,res){
  res.writeHead(302, { Location: '/tools/form' });
  res.end();
}
