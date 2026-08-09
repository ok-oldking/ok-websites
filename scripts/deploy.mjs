import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localConfigPath = path.join(root, 'deploy.config.local.json');
let local = {};
try { local = JSON.parse(await fs.readFile(localConfigPath, 'utf8')); } catch {}

const config = {
  host: process.env.DEPLOY_HOST || local.host,
  port: Number(process.env.DEPLOY_PORT || local.port || 22),
  username: process.env.DEPLOY_USER || local.username,
  password: process.env.DEPLOY_PASSWORD || local.password,
  privateKey: process.env.DEPLOY_PRIVATE_KEY || local.privateKey,
  remotePath: process.env.DEPLOY_PATH || local.remotePath || '/var/www/ok-websites',
  hostFingerprint: process.env.DEPLOY_HOST_FINGERPRINT || local.hostFingerprint
};
if (!config.host || !config.username || (!config.password && !config.privateKey)) throw new Error('Deployment credentials are missing. Use deploy.config.local.json or DEPLOY_* environment variables.');
if (!/^\/[a-zA-Z0-9/_-]+$/.test(config.remotePath) || config.remotePath.split('/').filter(Boolean).length < 2) throw new Error('DEPLOY_PATH must be a specific absolute directory.');

const release = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ok-websites-'));
const archive = path.join(temp, 'site.tar.gz');
await exec('tar', ['-czf', archive, '-C', path.join(root, 'static'), '.']);

const fingerprint = raw => `SHA256:${crypto.createHash('sha256').update(raw).digest('base64').replace(/=+$/, '')}`;
const connection = new Client();
const connect = () => new Promise((resolve, reject) => {
  connection.once('ready', resolve).once('error', reject).connect({
    host: config.host, port: config.port, username: config.username, password: config.password,
    privateKey: config.privateKey ? config.privateKey.replace(/\\n/g, '\n') : undefined,
    readyTimeout: 20000,
    hostVerifier: key => {
      const actual = fingerprint(key);
      if (!config.hostFingerprint) { console.warn(`Trusting first-use SSH host key: ${actual}`); return true; }
      return actual === config.hostFingerprint;
    }
  });
});
const remoteExec = command => new Promise((resolve, reject) => connection.exec(command, (error, stream) => {
  if (error) return reject(error); let stdout = '', stderr = '';
  stream.on('data', data => stdout += data).stderr.on('data', data => stderr += data);
  stream.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr || stdout || `Remote command failed (${code})`)));
}));
const upload = (localPath, remotePath) => new Promise((resolve, reject) => connection.sftp((error, sftp) => {
  if (error) return reject(error); sftp.fastPut(localPath, remotePath, error2 => { sftp.end(); error2 ? reject(error2) : resolve(); });
}));

try {
  await connect();
  const remoteArchive = `/tmp/ok-websites-${release}.tar.gz`;
  const remoteNginx = `/tmp/ok-websites-${release}.nginx.conf`;
  await upload(archive, remoteArchive);
  await upload(path.join(root, 'deploy', 'nginx.conf'), remoteNginx);
  const q = value => `'${value.replace(/'/g, `'\\''`)}'`;
  const remote = q(config.remotePath); const versionPath = `${config.remotePath}/releases/${release}`;
  await remoteExec(`set -eu
if ! command -v nginx >/dev/null 2>&1; then apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y nginx; fi
mkdir -p ${q(versionPath)}
tar -xzf ${q(remoteArchive)} -C ${q(versionPath)}
ln -sfn ${q(versionPath)} ${q(`${config.remotePath}/current-next`)}
mv -Tf ${q(`${config.remotePath}/current-next`)} ${q(`${config.remotePath}/current`)}
sed 's|__SITE_ROOT__|${config.remotePath}/current|g' ${q(remoteNginx)} > /etc/nginx/sites-available/ok-websites.conf
ln -sfn /etc/nginx/sites-available/ok-websites.conf /etc/nginx/sites-enabled/ok-websites.conf
rm -f /etc/nginx/sites-enabled/default ${q(remoteArchive)} ${q(remoteNginx)}
nginx -t
systemctl enable nginx
systemctl restart nginx
curl --fail --silent --show-error --max-time 15 -H 'Host: ok-script.com' http://127.0.0.1/ >/dev/null
curl --fail --silent --show-error --max-time 15 -H 'Host: ok-ww.ok-script.com' http://127.0.0.1/ >/dev/null
curl --fail --silent --show-error --max-time 15 -H 'Host: app.ok-script.com' http://127.0.0.1/ >/dev/null`);
  console.log(`Deployed release ${release} to ${config.host}.`);
} finally {
  connection.end(); await fs.rm(temp, { recursive: true, force: true });
}
