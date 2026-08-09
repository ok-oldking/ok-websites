import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let local = {};
try { local = JSON.parse(await fs.readFile(path.join(root, 'deploy.config.local.json'), 'utf8')); } catch {}
const config = {
  host: process.env.DEPLOY_HOST || local.host, port: Number(process.env.DEPLOY_PORT || local.port || 22),
  username: process.env.DEPLOY_USER || local.username, password: process.env.DEPLOY_PASSWORD || local.password,
  privateKey: process.env.DEPLOY_PRIVATE_KEY || local.privateKey,
  hostFingerprint: process.env.DEPLOY_HOST_FINGERPRINT || local.hostFingerprint
};
const fingerprint = raw => `SHA256:${crypto.createHash('sha256').update(raw).digest('base64').replace(/=+$/, '')}`;
const client = new Client();
const ready = new Promise((resolve, reject) => client.once('ready', resolve).once('error', reject));
client.connect({ ...config, privateKey: config.privateKey?.replace(/\\n/g, '\n'), hostVerifier: key => !config.hostFingerprint || fingerprint(key) === config.hostFingerprint });
await ready;
const command = `set -u
echo "nginx=$(systemctl is-active nginx 2>/dev/null || true)"
echo "release=$(readlink -f /var/www/ok-websites/current 2>/dev/null || true)"
echo "listeners=$(ss -ltnH '( sport = :80 or sport = :443 )' 2>/dev/null | tr '\\n' ';')"
echo "certificates=$(find /etc/letsencrypt/live -maxdepth 1 -mindepth 1 -type l -printf '%f ' 2>/dev/null || true)"
echo "dns_root=$(getent ahostsv4 ok-script.com 2>/dev/null | awk 'NR==1{print $1}')"
echo "dns_ww=$(getent ahostsv4 ok-ww.ok-script.com 2>/dev/null | awk 'NR==1{print $1}')"
echo "root_http=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -H 'Host: ok-script.com' http://127.0.0.1/ || true)"
echo "ww_http=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -H 'Host: ok-ww.ok-script.com' http://127.0.0.1/ || true)"
echo "app_http=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -H 'Host: app.ok-script.com' http://127.0.0.1/ || true)"`;
const output = await new Promise((resolve, reject) => client.exec(command, (error, stream) => {
  if (error) return reject(error); let stdout = '', stderr = '';
  stream.on('data', data => stdout += data).stderr.on('data', data => stderr += data);
  stream.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr || `Status command failed (${code})`)));
}));
client.end();
console.log(output.trim());
