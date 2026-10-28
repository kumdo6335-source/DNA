import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import handler from './api/index.mjs';
const root=path.resolve('public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/'))return handler(req,res);
 try{const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const content=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(Number(process.env.PORT)||3000)));
