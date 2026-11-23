import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'static');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon'
};

function resolveFile(urlPath, siteRoot = root) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  const relative = decoded.replace(/^\/+/, '');
  const candidate = path.resolve(siteRoot, relative);
  if (!candidate.startsWith(siteRoot + path.sep) && candidate !== siteRoot) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  const index = path.join(candidate, 'index.html');
  if (fs.existsSync(index)) return index;
  return null;
}

const server = http.createServer((request, response) => {
  const requestHost = (request.headers.host || '').split(':')[0].toLowerCase();
  const projectHosts = { 'ok-ww.ok-script.com': 'ok-ww', 'app.ok-script.com': 'app' };
  const projectFolder = projectHosts[requestHost];
  const siteRoot = request.url.startsWith('/assets/') ? root : path.join(root, projectFolder || '');
  const file = resolveFile(request.url, siteRoot);
  if (!file) {
    const fallback = path.join(root, '404.html');
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(fs.existsSync(fallback) ? fallback : path.join(root, 'index.html')).pipe(response); return;
  }
  const ext = path.extname(file).toLowerCase();
  response.writeHead(200, {
    'Content-Type': mime[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=604800, immutable',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
});

server.listen(port, host, () => console.log(`OK websites available at http://localhost:${port}`));
