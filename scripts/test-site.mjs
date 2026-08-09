import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'static');
let failures = [];

async function walk(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full)); else files.push(full);
  } return files;
}

function diskTarget(href, fromFile) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || /^(?:https?:|mailto:|tel:|data:|#)/i.test(href)) return null;
  let target;
  if (clean.startsWith('/')) {
    const relativeFile = path.relative(root, fromFile);
    const projectFolder = ['ok-ww', 'app'].find(folder => relativeFile === folder || relativeFile.startsWith(folder + path.sep));
    const siteRoot = clean.startsWith('/assets/') ? root : path.join(root, projectFolder || '');
    target = path.join(siteRoot, clean.slice(1));
  } else {
    target = path.resolve(path.dirname(fromFile), clean);
  }
  return path.extname(target) ? target : path.join(target, 'index.html');
}

const mustExist = ['index.html', 'en/index.html', 'ok-ww/index.html', 'ok-ww/en/index.html', 'ok-ww/zh-TW/index.html', 'ok-ww/ja/index.html', 'app/index.html', 'app/en/index.html', 'assets/site.css', 'assets/site.js', 'assets/github-mark.svg', 'assets/qq.svg', 'assets/discord.svg', 'assets/project-icons/ok-script.svg', 'sitemap.xml', 'ok-ww/sitemap.xml', 'app/sitemap.xml', '.nojekyll'];
for (const rel of mustExist) {
  try { await fs.access(path.join(root, rel)); } catch { failures.push(`Missing required output: ${rel}`); }
}

const files = await walk(root); const htmlFiles = files.filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  if (!/<html lang="[^"]+"/.test(html)) failures.push(`Missing language: ${path.relative(root, file)}`);
  if (!/<meta name="description"/.test(html)) failures.push(`Missing description: ${path.relative(root, file)}`);
  if (!/<meta name="robots" content="index,follow/.test(html) || !/<meta name="keywords"/.test(html)) failures.push(`Missing search metadata: ${path.relative(root, file)}`);
  if (!/<meta property="og:site_name"/.test(html) || !/<meta name="twitter:card" content="summary_large_image"/.test(html)) failures.push(`Missing social metadata: ${path.relative(root, file)}`);
  const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!structuredData) failures.push(`Missing structured data: ${path.relative(root, file)}`);
  else { try { JSON.parse(structuredData); } catch { failures.push(`Invalid structured data: ${path.relative(root, file)}`); } }
  if (/<select\b/i.test(html)) failures.push(`Native select found in ${path.relative(root, file)}`);
  const attributes = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const value of attributes) {
    const target = diskTarget(value, file); if (!target) continue;
    try { await fs.access(target); } catch { failures.push(`Broken internal link in ${path.relative(root, file)}: ${value}`); }
  }
}

const rootLanding = await fs.readFile(path.join(root, 'en', 'index.html'), 'utf8');
const rootChinese = await fs.readFile(path.join(root, 'index.html'), 'utf8');
if (/One framework, many projects|Made for real automation work/.test(rootLanding)) failures.push('Removed section subtitles are still present.');
if (/Latest release<\/small><b>source<\/b>/i.test(rootLanding)) failures.push('Framework release still shows source instead of a version.');
if (!/href="https:\/\/pypi\.org\/project\/ok-script\/"/.test(rootLanding) || !/pip install ok-script==\d/.test(rootLanding)) failures.push('ok-script PyPI installation link is missing its latest version.');
if (rootLanding.includes('meta-release-button')) failures.push('Release download is still present in the stats row.');
if (rootLanding.includes('data-copy=')) failures.push('Non-Chinese pages expose QQ groups.');
if (!rootChinese.includes('data-copy="938132715"') || !rootChinese.includes('开发者群938132715')) failures.push('ok-script developer QQ group is not identified correctly.');
if (!/<section class="hero"><div class="container landing-container hero-grid/.test(rootLanding) || !/<section class="section section-muted"><div class="container landing-container">/.test(rootLanding) || !/id="projects"><div class="container landing-container">/.test(rootLanding)) failures.push('Hero, features, and projects do not share the landing container.');
if (rootLanding.indexOf('section-muted') > rootLanding.indexOf('id="projects"')) failures.push('Feature grid does not appear before projects.');
if (!/community-meta-row[\s\S]*?community-row[\s\S]*?community-stars/.test(rootLanding)) failures.push('Community links and GitHub stars are not combined in one row.');
if (!/community-meta-row[\s\S]*?community-stars[\s\S]*?community-updated/.test(rootLanding) || rootLanding.includes('class="meta-row"')) failures.push('Code-updated metadata is not merged into the community/stars row.');
if (!/class="project-meta"[\s\S]*?Latest release[\s\S]*?<time datetime="[^"]*">/.test(rootLanding)) failures.push('Project cards do not show the latest version and update date.');
if (!/data-description-source="github"/.test(rootLanding)) failures.push('Project descriptions are not sourced from GitHub metadata.');
const projectCardClasses = [...rootLanding.matchAll(/<article class="project-card([^"]*)"/g)].map(match => match[1]);
const firstLastProject = projectCardClasses.findIndex(className => className.includes('project-last'));
if (firstLastProject >= 0 && projectCardClasses.slice(firstLastProject).some(className => !className.includes('project-last'))) failures.push('Fresh projects appear after archived or six-month-stale projects.');
const projectsMarkup = rootLanding.match(/<section class="section" id="projects">([\s\S]*?)<\/section>/)?.[1] || '';
if (/community-(?:row|chip|icon)|class="status\b/.test(projectsMarkup)) failures.push('Project cards still expose community links or status badges.');
if (!/class="project-top-meta">\s*<a class="project-stars" href="https:\/\/github\.com\/[^"\/]+\/[^"\/]+"[^>]*>★[^<]+<\/a><a class="github-link"/.test(projectsMarkup)) failures.push('Project-card stars do not link to the GitHub repository.');
if (!/class="community-stars" href="https:\/\/github\.com\/ok-oldking\/ok-script"/.test(rootLanding) || /class="community-stars" href="[^"]*\/stargazers"/.test(rootLanding)) failures.push('Hero GitHub Stars do not link to the repository.');
if (/<a\b[^>]*href="https:\/\/(?:ok-script\.com|ok-ww\.ok-script\.com|app\.ok-script\.com)/i.test(rootLanding)) failures.push('Root landing page still contains domain-based internal navigation.');
const wwLanding = await fs.readFile(path.join(root, 'ok-ww', 'index.html'), 'utf8');
if (!wwLanding.includes('https://ok-ww.ok-script.com/')) failures.push('ok-ww canonical domain is missing.');
if (!wwLanding.includes('大陆版') || wwLanding.includes('中国版')) failures.push('Mainland download label is incorrect.');
if (!wwLanding.includes('faq-section') || wwLanding.indexOf('section-muted') > wwLanding.indexOf('faq-section')) failures.push('FAQ is missing or appears before capabilities.');
if (!/<section class="section faq-section">[\s\S]*?<h2>常见问题<\/h2>/.test(wwLanding) || /<h2>[^<]*(?:Troubleshooting|疑难解答)/i.test(wwLanding)) failures.push('FAQ heading still exposes the source troubleshooting title.');
if (wwLanding.includes('class="cta"')) failures.push('Project landing page still has a bottom download CTA.');
if (/product-window|code-panel|float-card/.test(wwLanding)) failures.push('Decorative fake code or floating release card still exists.');
if (wwLanding.includes('meta-release-button')) failures.push('Project release download is still present in the stats row.');
if (!/class="button primary download-main"[^>]*href="[^"]*China-setup\.exe"[^>]*>[\s\S]*?<strong>v?\d[^<]*<\/strong>/.test(wwLanding)) failures.push('Simplified Chinese does not default to the versioned China download button.');
if (!wwLanding.includes('class="dropdown-menu download-menu"') || !/China-setup\.exe/.test(wwLanding) || !/Global-setup\.exe/.test(wwLanding)) failures.push('China/Global download choices are missing.');
if (!wwLanding.includes('class="community-icon"')) failures.push('Community links are missing icons.');
if (!wwLanding.includes('src="../assets/qq.svg"') || !wwLanding.includes('src="../assets/discord.svg"')) failures.push('maa.plus QQ/Discord icons are missing.');
if (!wwLanding.includes('data-copy="1035795301"') || !wwLanding.includes('群1035795301')) failures.push('User QQ group is not formatted as a copy button.');
if (/926858895|开发者群/.test(wwLanding)) failures.push('Developer QQ group is still visible.');
if (/<a\b[^>]*href="https:\/\/(?:ok-script\.com|ok-ww\.ok-script\.com|app\.ok-script\.com)/i.test(wwLanding)) failures.push('Project landing page still contains domain-based internal navigation.');
if (!wwLanding.includes('href="../"') || !wwLanding.includes('href="../app/"')) failures.push('Project switcher does not use relative sibling paths.');
const wwDocs = await fs.readFile(path.join(root, 'ok-ww', 'docs', 'index.html'), 'utf8');
if (!/<div class="breadcrumb"><a href="\.\.\//.test(wwDocs)) failures.push('Documentation back link is not relative.');
const wwEnglish = await fs.readFile(path.join(root, 'ok-ww', 'en', 'index.html'), 'utf8');
if (!/class="button primary download-main"[^>]*href="[^"]*Global-setup\.exe"/.test(wwEnglish)) failures.push('Non-Chinese locale does not default to the Global installer.');
if (/class="section-kicker">Capabilities|From visual perception to input/.test(wwEnglish)) failures.push('Capabilities heading copy is still visible.');
if (wwEnglish.includes('data-copy=') || /qq\.svg/.test(wwEnglish)) failures.push('Non-Chinese project page exposes QQ links.');
const appChinese = await fs.readFile(path.join(root, 'app', 'index.html'), 'utf8');
if (!appChinese.includes('data-copy="1097603920"') || /938132715|开发者群/.test(appChinese)) failures.push('App community does not show only its user QQ group.');
const nteChinese = await fs.readFile(path.join(root, 'ok-nte', 'index.html'), 'utf8');
const nteEnglish = await fs.readFile(path.join(root, 'ok-nte', 'en', 'index.html'), 'utf8');
if (!nteChinese.includes('探索海特洛市') || !nteChinese.includes('https://ok-script.com/ok-nte/') || !nteChinese.includes('ok-nte-win32-China-setup.exe')) failures.push('ok-nte Chinese landing page is incomplete.');
if (!nteEnglish.includes('Explore Hethereau') || !nteEnglish.includes('ok-nte-win32-Global-setup.exe')) failures.push('ok-nte English landing page is incomplete.');
if (!nteChinese.includes('faq-section') || !nteEnglish.includes('faq-section')) failures.push('ok-nte FAQ content was not generated from MkDocs.');
if ((nteChinese.match(/data-copy="1105569444"/g) || []).length !== 1 || /1087276729|开发者群/.test(nteChinese)) failures.push('ok-nte does not show exactly its user QQ group.');
if (nteEnglish.includes('data-copy=') || /qq\.svg/.test(nteEnglish)) failures.push('ok-nte English landing page exposes QQ links.');
if (!rootChinese.includes('href=".\/ok-nte\/"')) failures.push('Project ecosystem does not link to the local ok-nte site.');
await fs.access(path.join(root, 'ok-nte', 'docs', 'guides', 'troubleshooting', 'index.html')).catch(() => failures.push('ok-nte Chinese MkDocs routes are missing.'));
await fs.access(path.join(root, 'ok-nte', 'en', 'docs', 'getting-started', 'installation', 'index.html')).catch(() => failures.push('ok-nte English MkDocs routes are missing.'));
const nteCombatPlanner = await fs.readFile(path.join(root, 'ok-nte', 'docs', 'development', 'combat-planner', 'index.html'), 'utf8');
if (!/href="https:\/\/github\.com\/BnanZ0\/ok-nte\/tree\/[a-f0-9]+\/src\/char"/.test(nteCombatPlanner) || nteCombatPlanner.includes('href="../../src/char"')) failures.push('ok-nte repository-source links are not rewritten to GitHub.');
const starResonance = await fs.readFile(path.join(root, 'ok-star-resonance', 'index.html'), 'utf8');
if (!starResonance.includes('星痕旅程') || !starResonance.includes('https://ok-script.com/ok-star-resonance/') || !starResonance.includes('ok-star-resonance-win32-China-setup.exe')) failures.push('ok-star-resonance landing page is incomplete.');
if (!starResonance.includes('faq-section') || !starResonance.includes('生活玩法自动化') || !starResonance.includes('夸克网盘')) failures.push('ok-star-resonance project content is incomplete.');
if (!rootChinese.includes('href="./ok-star-resonance/"')) failures.push('Project ecosystem does not link to the local ok-star-resonance site.');
await fs.access(path.join(root, 'ok-star-resonance', 'docs', 'guide', 'troubleshooting', 'index.html')).catch(() => failures.push('ok-star-resonance MkDocs routes are missing.'));
const kesChinese = await fs.readFile(path.join(root, 'ok-kes', 'index.html'), 'utf8');
const kesEnglish = await fs.readFile(path.join(root, 'ok-kes', 'en', 'index.html'), 'utf8');
if (!kesChinese.includes('突破卡厄思') || !kesChinese.includes('https://ok-script.com/ok-kes/') || !kesChinese.includes('ok-kes-win32-China-setup.exe')) failures.push('ok-kes Chinese landing page is incomplete.');
if (!kesEnglish.includes('Face the Chaos') || !kesEnglish.includes('https://github.com/baoxin1100/ok-kes/releases/tag/v1.3.36')) failures.push('ok-kes English landing page is incomplete.');
if (!kesChinese.includes('faq-section') || !kesChinese.includes('自动卡厄思') || !kesChinese.includes('data-copy="901988096"')) failures.push('ok-kes Chinese project content is incomplete.');
if (kesEnglish.includes('data-copy=') || /qq\.svg/.test(kesEnglish)) failures.push('ok-kes English landing page exposes QQ links.');
if (!/<link rel="alternate" hreflang="zh-CN" href="https:\/\/ok-script\.com\/ok-kes\/">/.test(kesChinese) || !/hreflang="en" href="https:\/\/ok-script\.com\/ok-kes\/en\/"/.test(kesChinese)) failures.push('ok-kes locale SEO links are missing.');
if (!rootChinese.includes('href="./ok-kes/"')) failures.push('Project ecosystem does not link to the local ok-kes site.');
await fs.access(path.join(root, 'ok-kes', 'docs', 'index.html')).catch(() => failures.push('ok-kes Chinese MkDocs routes are missing.'));
await fs.access(path.join(root, 'ok-kes', 'en', 'docs', 'index.html')).catch(() => failures.push('ok-kes English MkDocs routes are missing.'));
const workflow = await fs.readFile(path.join(root, '..', '.github', 'workflows', 'deploy.yml'), 'utf8');
if (/npm run deploy|DEPLOY_(?:HOST|USER|PASSWORD|PRIVATE_KEY|PATH)/.test(workflow) || !/actions\/configure-pages@v6/.test(workflow) || !/actions\/deploy-pages@v5/.test(workflow)) failures.push('GitHub Actions is not Pages-only or uses an outdated Pages configuration action.');
const css = await fs.readFile(path.join(root, 'assets', 'site.css'), 'utf8');
if (!/\.nav-links[^}]*font-size:\s*16px/.test(css) || !/\.dropdown-trigger[^}]*font-size:\s*15px/.test(css)) failures.push('Header typography was not enlarged.');
if (!/\.feature-card[^}]*grid-template-columns:\s*45px/.test(css) || /\.feature-icon[^}]*margin-bottom/.test(css)) failures.push('Feature cards are not using the compact horizontal layout.');
if (/\.hero \.container[^}]*1740px/.test(css) || !/\.landing-container[^}]*1180px/.test(css) || !/\.download-toggle[^}]*align-items:\s*center/.test(css)) failures.push('Landing-section width or dropdown-arrow alignment is incorrect.');
if (!/\.section-kicker[^}]*font-size:\s*18px/.test(css) || !/\.section-head p[^}]*width:\s*66\.666%/.test(css)) failures.push('Project ecosystem heading or lead width is incorrect.');
if (!/\.faq-content[^}]*width:\s*100%[^}]*max-width:\s*none/.test(css) || !/<section class="section faq-section"><div class="container landing-container">/.test(wwLanding)) failures.push('FAQ does not share the feature-grid width.');
if (!/\.faq-section \.section-head h2[^}]*color:\s*var\(--accent-strong\)[^}]*font-size:\s*clamp\(24px,\s*2\.4vw,\s*32px\)/.test(css) || !/\.faq-section \.faq-content > h2[^}]*font-size:\s*clamp\(20px,\s*2vw,\s*25px\)/.test(css)) failures.push('FAQ heading hierarchy is not visually distinct and compact.');
const rootSitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8');
if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(rootSitemap)) failures.push('Sitemap entries are missing last-modified dates.');

if (failures.length) {
  console.error([...new Set(failures)].slice(0, 40).join('\n'));
  process.exit(1);
}
console.log(`Validated ${htmlFiles.length} HTML pages and their internal assets.`);
