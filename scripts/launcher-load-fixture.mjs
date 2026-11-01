// Local QA only: serve a production build with slow textures or one missing flight asset.
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const root = path.resolve('dist');
const mode = process.argv[2] || 'error';
const port = Number(process.argv[3] || 5178);
let missing;
let delayed = false;
const types = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.wav':'audio/wav' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  res.setHeader('Cache-Control','no-store');
  const flight = url.pathname.startsWith('/assets/neon/');
  if (mode === 'error' && flight) {
    missing ??= file;
    if (file === missing) { res.writeHead(404).end('QA missing flight texture'); return; }
  }
  try {
    const data = await readFile(file);
    const send = () => { res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'}); res.end(data); };
    if (mode === 'slow' && flight && !delayed) { delayed = true; setTimeout(send, 12000); } else send();
  } catch { res.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log(`Launcher ${mode} fixture: http://127.0.0.1:${port}`));
