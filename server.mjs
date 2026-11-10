import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.env.SERVE_DIR||'.');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
http.createServer(async(req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.split('/').some(p=>p.startsWith('.'))||pathname.includes('\\')||pathname.includes('\0'))throw Error();let file=resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+sep))throw Error();if((await stat(file)).isDirectory())file=resolve(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,host,()=>console.log(`Trackstead: http://${host}:${port}`));
