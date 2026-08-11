import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import YAML from 'yaml';
import OpenCC from 'opencc-js';
import sharp from 'sharp';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = path.join(root, 'static');
const cacheDir = path.join(root, '.cache', 'projects');
const config = JSON.parse(await fs.readFile(path.join(root, 'projects.json'), 'utf8'));
const generatedAt = new Date().toISOString();
const assetVersion = generatedAt.replace(/\D/g, '').slice(0, 14);
const simplifiedToTraditional = OpenCC.Converter({ from: 'cn', to: 'twp' });

const copy = {
  'zh-CN': {
    skip: '跳到正文', navDocs: '文档', navProjects: '项目', navGithub: 'GitHub', theme: '切换明暗模式', menu: '打开菜单',
    frameworkEyebrow: '开源 · Python · 视觉自动化', frameworkTitle: '让游戏自动化，\n变得简单。',
    frameworkLead: '一个现代、纯 Python 的计算机视觉自动化框架。用几百行代码构建支持 Windows、模拟器与 ADB 的工业级自动化工具。',
    onmyojiEyebrow: '阴阳师 · 后台自动化 · Windows', onmyojiTitle: '阴阳师的日常，\n交给 ok-Onmyoji。',
    onmyojiLead: '基于图像识别的阴阳师自动化工具，支持后台运行、多开、定时任务与常用战斗、日常流程。',
    appEyebrow: '鸣潮 · 后台自动化 · Windows', appTitle: '重复的日常，\n交给 ok-ww。',
    appLead: '基于计算机视觉的鸣潮自动化工具。支持后台运行、智能角色识别与 4K 分辨率，不读取内存、不修改游戏文件。',
    nteEyebrow: '异环 · 后台自动化 · Windows', nteTitle: '探索海特洛市，\n日常交给 ok-nte。',
    nteLead: '面向《异环》的计算机视觉自动化工具，支持后台运行、一键日常、智能战斗与都市闲趣，不读取游戏内存、不修改游戏文件。',
    starEyebrow: '星痕共鸣 · 视觉自动化 · Windows', starTitle: '星痕旅程，\n交给 ok-star-resonance。',
    starLead: '面向《星痕共鸣》的视觉与网络自动化工具，覆盖钓鱼、采集、副本和 MIDI 演奏等玩法，通过 Windows 接口模拟操作，不读取游戏内存、不修改游戏文件。',
    kesEyebrow: '卡厄思梦境 · 后台自动化 · Windows', kesTitle: '突破卡厄思，\n日常交给 ok-kes。',
    kesLead: '面向《卡厄思梦境》的计算机视觉自动化工具，支持自动卡厄思、自动出击、半自动剧情和后台运行，不读取游戏内存、不修改游戏文件。',
    endEyebrow: '终末地 · 后台自动化 · Windows', endTitle: '终末地日常，\n交给 ok-end-field。',
    endLead: '基于图像识别的《明日方舟：终末地》自动化工具，支持后台运行，不读取游戏内存、不修改游戏文件。',
    templateEyebrow: '项目模板 · Python · 可视化工具', templateTitle: '从可运行模板，\n开始自动化。',
    templateLead: '基于 ok-script 的完整自动化项目模板，包含 GUI、任务示例、OCR、模板匹配、测试与打包配置。',
    getStarted: '开始使用', download: '下载最新版本', downloadGithub: '从 GitHub 下载', downloading: '正在下载…', downloadGuide: '下载已开始，请查看浏览器右上角', viewSource: '查看源码', readDocs: '阅读文档',
    githubUnavailable: 'GitHub 下载不可用？', communityLabel: '加入社区',
    faqKicker: '常见问题',
    stars: 'GitHub Stars', release: '最新版本', updated: '代码更新', online: '开源可用',
    capabilities: '核心能力', capabilitiesTitle: '为真实自动化场景而生', capabilitiesLead: '从图像感知到输入执行，从开发调试到持续发布，一套工具覆盖完整工作流。',
    projectsKicker: '项目', projectsTitle: '一个框架，多个项目', projectsLead: '每个项目拥有独立入口与自己的多语言文档，同时共享一致、清晰的使用体验。',
    explore: '访问项目 →', active: '活跃', community: '社区', archived: '归档',
    ctaTitle: '从模板开始，构建你的自动化项目。', ctaLead: '阅读快速开始文档，连接 Windows 窗口或 ADB 设备，运行第一个计算机视觉任务。', ctaButton: '打开快速开始',
    docsFor: '文档目录', onPage: '本页内容', editGithub: '在 GitHub 查看源文件', lastGenerated: '页面生成时间',
    footer: '以 AGPL-3.0 协议开源。文档由项目源码自动生成。', allProjects: '全部项目'
  },
  en: {
    skip: 'Skip to content', navDocs: 'Docs', navProjects: 'Projects', navGithub: 'GitHub', theme: 'Toggle color theme', menu: 'Open menu',
    frameworkEyebrow: 'Open source · Python · Visual automation', frameworkTitle: 'Game automation,\nmade approachable.',
    frameworkLead: 'A modern, pure-Python computer-vision automation framework. Build production-grade tools for Windows, emulators, and ADB with only a few hundred lines of code.',
    onmyojiEyebrow: 'Onmyoji · Background automation · Windows', onmyojiTitle: 'Leave Onmyoji routines\nto ok-Onmyoji.',
    onmyojiLead: 'Image-recognition automation for Onmyoji with background mode, multi-instance support, scheduling, and common battle and daily workflows.',
    appEyebrow: 'Wuthering Waves · Background automation · Windows', appTitle: 'Leave the routine\nto ok-ww.',
    appLead: 'Computer-vision automation for Wuthering Waves with background mode, intelligent character detection, and 4K support—without reading memory or changing game files.',
    nteEyebrow: 'Neverness to Everness · Background automation · Windows', nteTitle: 'Explore Hethereau.\nLeave the routine to ok-nte.',
    nteLead: 'Computer-vision automation for Neverness to Everness with background operation, one-click dailies, intelligent combat, and city activities—without reading memory or modifying game files.',
    starEyebrow: 'Star Resonance · Visual automation · Windows', starTitle: 'Enjoy the adventure.\nLeave the routine to ok-star-resonance.',
    starLead: 'Visual and network-assisted automation for Star Resonance, covering fishing, gathering, dungeons, and MIDI performances through simulated Windows input without reading memory or modifying game files.',
    kesEyebrow: 'Chaos Zero Nightmare · Background automation · Windows', kesTitle: 'Face the Chaos.\nLeave the routine to ok-kes.',
    kesLead: 'Computer-vision automation for Chaos Zero Nightmare with Auto Chaos, Auto Sortie, semi-automatic story progression, and background operation—without reading memory or modifying game files.',
    endEyebrow: 'Arknights: Endfield · Background automation · Windows', endTitle: 'Leave Endfield routines\nto ok-end-field.',
    endLead: 'Image-recognition automation for Arknights: Endfield with background operation, without reading game memory or modifying game files.',
    templateEyebrow: 'Project template · Python · Visual tools', templateTitle: 'Start with a working template.\nBuild your automation.',
    templateLead: 'A complete ok-script application template with a GUI, task examples, OCR, template matching, tests, and release packaging.',
    getStarted: 'Get started', download: 'Download latest', downloadGithub: 'Download from GitHub', downloading: 'Downloading…', downloadGuide: 'Download started — check the top-right of your browser', viewSource: 'View source', readDocs: 'Read docs',
    githubUnavailable: 'GitHub download unavailable?', communityLabel: 'Join the community',
    faqKicker: 'FAQ',
    stars: 'GitHub stars', release: 'Latest release', updated: 'Code updated', online: 'Open source',
    capabilities: 'Capabilities', capabilitiesTitle: 'Made for real automation work', capabilitiesLead: 'From visual perception to input, development diagnostics to continuous releases—the complete workflow in one toolkit.',
    projectsKicker: 'Projects', projectsTitle: 'One framework, many projects', projectsLead: 'Each project gets its own home and multilingual documentation while sharing one consistent, focused experience.',
    explore: 'Explore project →', active: 'Active', community: 'Community', archived: 'Archived',
    ctaTitle: 'Start with the template. Build your own automation.', ctaLead: 'Follow the quick start, connect a Windows window or ADB device, and run your first computer vision task.', ctaButton: 'Open quick start',
    docsFor: 'Documentation', onPage: 'On this page', editGithub: 'View source on GitHub', lastGenerated: 'Page generated',
    footer: 'Open source under AGPL-3.0. Documentation is generated from project sources.', allProjects: 'All projects'
  },
  'zh-TW': {
    skip: '跳到正文', navDocs: '文件', navProjects: '專案', navGithub: 'GitHub', theme: '切換明暗模式', menu: '開啟選單',
    frameworkEyebrow: '開源 · Python · 視覺自動化', frameworkTitle: '讓遊戲自動化，\n變得簡單。', frameworkLead: '現代化的純 Python 圖像辨識自動化框架。',
    onmyojiEyebrow: '陰陽師 · 背景自動化 · Windows', onmyojiTitle: '陰陽師的日常，\n交給 ok-Onmyoji。', onmyojiLead: '基於圖像辨識的陰陽師自動化工具，支援背景執行、多開、排程與常用戰鬥、日常流程。',
    appEyebrow: '鳴潮 · 背景自動化 · Windows', appTitle: '重複的日常，\n交給 ok-ww。', appLead: '基於電腦視覺的鳴潮自動化工具，支援背景執行、智慧角色辨識與 4K 解析度，不讀取記憶體、不修改遊戲檔案。',
    templateEyebrow: '專案範本 · Python · 視覺工具', templateTitle: '從可執行範本，\n開始自動化。', templateLead: '包含 GUI、任務範例、OCR、模板比對、測試與打包設定的完整 ok-script 應用範本。',
    getStarted: '開始使用', download: '下載最新版本', downloadGithub: '從 GitHub 下載', downloading: '正在下載…', downloadGuide: '下載已開始，請查看瀏覽器右上角', viewSource: '查看原始碼', readDocs: '閱讀文件', githubUnavailable: 'GitHub 無法下載？', communityLabel: '加入社群', faqKicker: '常見問題', stars: 'GitHub Stars', release: '最新版本', updated: '程式更新', online: '開源可用',
    capabilities: '核心能力', capabilitiesTitle: '為實際自動化場景而生', capabilitiesLead: '完整涵蓋辨識、執行與日常使用。', projectsKicker: '專案', projectsTitle: '一個框架，多個專案', projectsLead: '每個專案都有獨立入口與多語言文件。',
    explore: '前往專案 →', active: '活躍', community: '社群', archived: '封存', ctaTitle: '立即下載，簡化你的每日流程。', ctaLead: '閱讀使用說明並確認風險提示後開始使用。', ctaButton: '開啟快速開始',
    docsFor: '文件目錄', onPage: '本頁內容', editGithub: '在 GitHub 查看來源', lastGenerated: '頁面產生時間', footer: '以 AGPL-3.0 授權開源。文件由專案原始碼自動產生。', allProjects: '全部專案'
  },
  ja: {
    skip: '本文へ移動', navDocs: 'ドキュメント', navProjects: 'プロジェクト', navGithub: 'GitHub', theme: 'テーマを切り替え', menu: 'メニューを開く',
    frameworkEyebrow: 'オープンソース · Python · 画像認識', frameworkTitle: 'ゲーム自動化を、\nもっと身近に。', frameworkLead: '純 Python の画像認識自動化フレームワーク。',
    appEyebrow: '鳴潮 · バックグラウンド自動化 · Windows', appTitle: '毎日のルーティンは、\nok-ww に。', appLead: 'コンピュータービジョンを活用した鳴潮自動化ツール。バックグラウンド動作、キャラクター自動認識、4K 解像度に対応し、メモリ読み取りやゲームファイルの変更は行いません。',
    templateEyebrow: 'プロジェクトテンプレート · Python · ビジュアルツール', templateTitle: '動くテンプレートから、\n自動化を始めよう。', templateLead: 'GUI、タスク例、OCR、テンプレートマッチング、テスト、配布設定を含む ok-script アプリテンプレート。',
    getStarted: 'はじめる', download: '最新版をダウンロード', downloadGithub: 'GitHub からダウンロード', downloading: 'ダウンロード中…', viewSource: 'ソースを見る', readDocs: 'ドキュメント', githubUnavailable: 'GitHub から取得できない場合', communityLabel: 'コミュニティ', faqKicker: 'よくある質問', stars: 'GitHub Stars', release: '最新リリース', updated: '最終更新', online: 'オープンソース',
    capabilities: '主な機能', capabilitiesTitle: '実用的な自動化のために', capabilitiesLead: '認識から操作、日常の実行までを一つのツールで。', projectsKicker: 'プロジェクト', projectsTitle: '一つの基盤、多彩なプロジェクト', projectsLead: 'プロジェクトごとに独立した入口と多言語ドキュメントを提供します。',
    explore: 'プロジェクトへ →', active: '開発中', community: 'コミュニティ', archived: 'アーカイブ', ctaTitle: '最新版をダウンロードして始めましょう。', ctaLead: '説明とリスクに関する注意事項を確認してからご利用ください。', ctaButton: 'クイックスタート',
    docsFor: 'ドキュメント', onPage: 'このページ', editGithub: 'GitHub でソースを見る', lastGenerated: 'ページ生成日時', footer: 'AGPL-3.0 でオープンソース。ドキュメントはプロジェクトソースから自動生成されます。', allProjects: '全プロジェクト'
  }
};

const features = {
  framework: {
    'zh-CN': [['⌁','自适应图像识别','模板匹配、OCR 与目标检测适配不同分辨率。'],['▣','多平台输入','同一套任务支持 Windows 窗口、模拟器与 ADB。'],['{ }','纯 Python 扩展','自由集成 PyPI、YOLO 及其他开源工具。'],['↗','完整工程链路','UI、调试、测试、打包和增量更新开箱即用。']],
    en: [['⌁','Adaptive vision','Template matching, OCR, and detection across resolutions.'],['▣','Multi-platform input','One task model for Windows, emulators, and ADB.'],['{ }','Pure Python','Bring any PyPI package, YOLO model, or open-source tool.'],['↗','Complete workflow','UI, diagnostics, tests, packaging, and updates included.']]
  },
  application: {
    'zh-CN': [['◫','后台模式','游戏最小化或被遮挡时仍可运行。'],['◎','智能识别','自动识别角色，无需手动配置技能序列。'],['4K','高分辨率','覆盖 720p 到 4K，并兼容部分超宽屏。'],['♪','自动静音','后台运行时可自动静音，不打扰日常使用。']],
    en: [['◫','Background mode','Keep running while the game is minimized or covered.'],['◎','Smart recognition','Detect characters without hand-authored skill rotations.'],['4K','High resolution','From 720p through 4K, with partial ultrawide support.'],['♪','Automatic mute','Silence the game while automation runs in the background.']],
    'zh-TW': [['◫','背景模式','遊戲最小化或被遮擋時仍可執行。'],['◎','智慧辨識','自動辨識角色，不必手動設定技能序列。'],['4K','高解析度','支援 720p 至 4K，並相容部分超寬螢幕。'],['♪','自動靜音','背景執行時可自動靜音。']],
    ja: [['◫','バックグラウンド','最小化・遮蔽された状態でも動作。'],['◎','自動認識','キャラクターを認識し、手動設定を削減。'],['4K','高解像度','720p から 4K、一部ウルトラワイドに対応。'],['♪','自動ミュート','バックグラウンド実行中の音声を自動消音。']]
  },
  'ok-nte': {
    'zh-CN': [['✓','一键日常','自动完成经验与材料、咖啡舍、影院约会和羁遇赠礼。'],['◫','后台运行','游戏窗口置于后台时继续执行自动化任务。'],['◎','智能战斗','角色中心、特征管理与声音反馈共同驱动战斗。'],['♪','都市闲趣','自动完成钓鱼、鼓组音游与粉爪大劫案等活动。']],
    en: [['✓','One-click dailies','Automate experience, materials, café tasks, cinema dates, and gifts.'],['◫','Background operation','Keep automation running while the game window stays in the background.'],['◎','Intelligent combat','Character profiles, feature recognition, and audio feedback drive combat.'],['♪','City activities','Automate fishing, rhythm games, and other Hethereau activities.']]
  },
  'ok-star-resonance': {
    'zh-CN': [['✓','生活玩法自动化','支持钓鱼、简易采集、月卡领取、组队确认与协会狩猎。'],['16:9','广泛分辨率支持','适配任意 16:9 分辨率、窗口模式和全屏模式。'],['♪','MIDI 与谱面演奏','自动演奏 MIDI 文件和教学谱面，扩展游戏内音乐体验。'],['{ }','自定义脚本','允许用户编写自己的自动化脚本，并通过 PushDeer 接收状态通知。']],
    en: [['✓','Activity automation','Fishing, gathering, daily rewards, team confirmation, and guild hunting.'],['16:9','Flexible resolution','Works at any 16:9 resolution in windowed or fullscreen mode.'],['♪','MIDI performances','Play MIDI files and teaching scores automatically.'],['{ }','Custom scripts','Extend automation with user scripts and PushDeer status notifications.']]
  },
  'ok-kes': {
    'zh-CN': [['◎','自动卡厄思','自动处理路线、事件、战斗、商店、卡牌管理与奖励结算。'],['✓','自动出击','按可配置优先级自动出牌、选择主战员并处理路线节点。'],['◫','后台运行','游戏窗口最小化或被遮挡时继续执行自动化任务。'],['↗','配置共享','支持配置导入导出、热门配置和匿名胜率统计。']],
    en: [['◎','Auto Chaos','Handle routes, events, battles, shops, card management, and rewards.'],['✓','Auto Sortie','Play cards, select members, and navigate nodes using configurable priorities.'],['◫','Background operation','Continue automation while the game is minimized or covered.'],['↗','Shared configurations','Import, export, and discover popular configurations with anonymous statistics.']]
  },
  'ok-end-field': {
    'zh-CN': [['✓','日常任务','自动完成送礼、据点兑换、委托奖励与日常领取。'],['◫','后台运行','游戏窗口置于后台时继续执行自动化任务。'],['◎','图像识别','通过 OCR 与模板识别定位界面和交互目标。'],['↗','自动战斗','进入战斗后自动执行技能循环并识别战斗状态。']],
    en: [['✓','Daily routines','Automate gifts, outpost exchanges, commissions, and daily rewards.'],['◫','Background operation','Keep automation running while the game window stays in the background.'],['◎','Image recognition','Use OCR and template matching to locate interfaces and targets.'],['↗','Auto combat','Run skill cycles and recognize combat state automatically.']]
  },
  template: {
    'zh-CN': [['GUI','可运行界面','内置任务、配置控件与调试工具示例。'],['OCR','视觉能力','演示 OCR、相对区域识别和模板匹配。'],['{ }','任务模板','一次性任务、触发任务与自动化测试开箱即用。'],['↗','发布流程','包含打包配置与 GitHub Actions 发布工作流。']],
    en: [['GUI','Working interface','Task, configuration control, and diagnostic examples included.'],['OCR','Computer vision','Examples for OCR, relative regions, and template matching.'],['{ }','Task templates','One-time tasks, triggers, and automated tests ready to extend.'],['↗','Release workflow','Packaging configuration and GitHub Actions are included.']]
  }
};

function localeCopy(code) { return copy[code] || copy.en; }
function translateToTraditional(value) {
  if (typeof value === 'string') return simplifiedToTraditional(value);
  if (Array.isArray(value)) return value.map(translateToTraditional);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateToTraditional(item)]));
  return value;
}
function translateMarkdownToTraditional(markdown) {
  const protectedSegments = [];
  const protectedMarkdown = markdown.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\r\n]*`|\]\([^)]+\)|<[^>]+>/g, segment => {
    const marker = `__OK_TRANSLATION_SEGMENT_${protectedSegments.length}__`;
    protectedSegments.push(segment);
    return marker;
  });
  let translated = simplifiedToTraditional(protectedMarkdown);
  protectedSegments.forEach((segment, index) => { translated = translated.replace(`__OK_TRANSLATION_SEGMENT_${index}__`, segment); });
  return translated;
}
function addAutomaticTraditionalLocale(locales) {
  const simplified = locales.find(locale => locale.code.toLowerCase() === 'zh-cn');
  const traditional = locales.some(locale => locale.code.toLowerCase() === 'zh-tw');
  if (!simplified || traditional) return locales;
  return [...locales, { ...simplified, code: 'zh-TW', label: '繁體中文', generatedFrom: simplified.code, autoTranslated: true }];
}
function escapeHtml(value = '') { return String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function posix(value) { return value.split(path.sep).join('/'); }
function cleanSlug(value) { return value.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section'; }
function formatDate(iso, locale) { try { return new Intl.DateTimeFormat(locale, { year:'numeric', month:'short', day:'numeric' }).format(new Date(iso)); } catch { return iso?.slice(0,10) || '—'; } }
function localizedGithubDescription(item, githubDescription) {
  const description = githubDescription?.trim();
  if (!description) return { values: item.description || {}, source: 'fallback' };
  const values = { ...(item.description || {}) };
  if (/\p{Script=Han}/u.test(description)) values['zh-CN'] = description;
  else values.en = description;
  return { values, source: 'github' };
}
function isSixMonthsStale(iso) {
  if (!iso) return true;
  const cutoff = new Date(generatedAt);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 6);
  return new Date(iso) < cutoff;
}
function decodeHtmlText(value = '') {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
async function fetchRawReadme(github, branches = ['main', 'master']) {
  for (const branch of [...new Set(branches.filter(Boolean))]) {
    for (const filename of ['README.md', 'readme.md']) {
      const response = await fetch(`https://raw.githubusercontent.com/${github}/${branch}/${filename}`).catch(() => null);
      if (response?.ok) return response.text();
    }
  }
  return '';
}
async function githubWebMetadata(item) {
  const response = await fetch(`https://github.com/${item.github}`, { headers: githubBaseHeaders });
  if (!response.ok) throw new Error(`GitHub web ${response.status}: ${item.github}`);
  const html = await response.text();
  const rawDescription = decodeHtmlText(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '');
  const description = rawDescription
    .replace(/\s+-\s+GitHub\s+-[\s\S]*$/i, '')
    .replace(/\.\s+Contribute to\s+\S+\s+development by creating an account on GitHub\.\s*$/i, '')
    .replace(new RegExp(`\\s+-\\s+${item.github.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '')
    .trim();
  let readme = '';
  let updatedAt = null;
  for (const branch of ['main', 'master']) {
    if (!readme) readme = await fetchRawReadme(item.github, [branch]);
    const atom = await fetch(`https://github.com/${item.github}/commits/${branch}.atom`, { headers: githubBaseHeaders }).catch(() => null);
    if (atom?.ok) {
      const feed = await atom.text();
      updatedAt = feed.match(/<updated>([^<]+)<\/updated>/i)?.[1] || null;
      if (updatedAt) break;
    }
  }
  const latest = await fetch(`https://github.com/${item.github}/releases/latest`, { headers: githubBaseHeaders }).catch(() => null);
  const release = latest?.url.match(/\/releases\/tag\/([^/?#]+)/i)?.[1];
  return { description, readme, release: release ? decodeURIComponent(release) : '—', updatedAt };
}
function localePrefix(project, locale) { return `${project.basePath}${locale.code === 'zh-CN' ? '' : `/${locale.code}`}`; }
function landingUrl(project, locale) { return `${localePrefix(project, locale) || ''}/` || '/'; }
function docRoot(project, locale) { return `${localePrefix(project, locale)}/docs`; }
function projectOrigin(project) { return project.domain || config.site.url; }
function outputPathFromUrl(project, url) { return path.join(staticDir, project.outputFolder || '', url.replace(/^\//, ''), 'index.html'); }
function routeKey(project, url) {
  const trim = value => value.replace(/^\/+|\/+$/g, '');
  return path.posix.join(project.outputFolder || '', trim(url));
}
function relativeSiteUrl(fromProject, fromUrl, toProject, toUrl) {
  const relative = path.posix.relative(routeKey(fromProject, fromUrl), routeKey(toProject, toUrl));
  if (!relative) return './';
  return `${relative.startsWith('.') ? relative : `./${relative}`}/`;
}
function relativeAssetUrl(project, fromUrl, assetUrl) {
  const [assetPath, suffix = ''] = assetUrl.split(/(?=[?#])/);
  if (!assetPath.startsWith('/assets/')) return assetUrl;
  const relative = path.posix.relative(routeKey(project, fromUrl), assetPath.replace(/^\//, ''));
  return `${relative.startsWith('.') ? relative : `./${relative}`}${suffix}`;
}

async function runGit(args, cwd = root) {
  return (await exec('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 })).stdout.trim();
}

async function syncProject(project) {
  const repoDir = path.join(cacheDir, project.id);
  try {
    await fs.access(path.join(repoDir, '.git'));
    await runGit(['fetch', '--depth', '1', 'origin'], repoDir);
    await runGit(['reset', '--hard', 'origin/HEAD'], repoDir);
  } catch {
    await fs.rm(repoDir, { recursive: true, force: true });
    await fs.mkdir(cacheDir, { recursive: true });
    await runGit(['clone', '--depth', '1', project.repository, repoDir]);
  }
  const [commit, updated] = await Promise.all([
    runGit(['rev-parse', 'HEAD'], repoDir),
    runGit(['show', '-s', '--format=%cI', 'HEAD'], repoDir)
  ]);
  return { repoDir, commit, updated };
}

const githubBaseHeaders = { Accept: 'application/vnd.github+json', 'User-Agent': 'ok-websites-generator' };

async function githubGet(endpoint) {
  const headers = { ...githubBaseHeaders };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let response = await fetch(`https://api.github.com${endpoint}`, { headers });
  if (response.status === 401 && headers.Authorization) response = await fetch(`https://api.github.com${endpoint}`, { headers: githubBaseHeaders });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${endpoint}`);
  return response.json();
}

function extractReleaseMirrors(body = '') {
  return [...body.matchAll(/\[([^\]]*(?:Mirror|镜|網盤|网盘|Quark|Baidu)[^\]]*)\]\((https?:\/\/[^)]+)\)/gi)]
    .map(([, label, url]) => ({ label: label.replace(/下载渠道|下載渠道|下载|下載/g, '').trim(), url }))
    .filter((item, index, all) => all.findIndex(other => other.url === item.url) === index);
}

function extractCommunity(markdown = '') {
  const links = [];
  const joinAnswer = text => {
    const match = text.match(/入群答案\s*[:：]\s*(?:`([^`]+)`|[“"']?([^\s，,；;。\)\]]+)[”"']?)/i);
    return (match?.[1] || match?.[2])?.trim();
  };
  const add = item => {
    const identity = item.value || item.url || item.label;
    const existing = links.find(link => link.type === item.type && (link.value || link.url || link.label) === identity);
    if (existing) existing.joinAnswer ||= item.joinAnswer;
    else links.push(item);
  };
  for (const [, label, url] of markdown.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)) {
    const developer = /开发者\s*(?:QQ\s*)?群|開發者\s*(?:QQ\s*)?群|developer\s*(?:qq\s*)?group/i.test(label);
    if (/discord(?:\.gg|\.com\/invite)/i.test(url)) add({ type: 'discord', label: 'Discord', url });
    else if (/pd\.qq\.com/i.test(url)) add({ type: 'qq-channel', label: /频道|頻道/i.test(label) ? label : 'QQ Channel', url });
    else if (/qm\.qq\.com/i.test(url)) add({ type: 'qq', label: label || 'QQ', value: label.match(/\d{6,12}/)?.[0], url, groupKind: developer ? 'developer' : 'user', joinAnswer: joinAnswer(`${label} ${url}`) });
  }
  let recentQq;
  for (const line of markdown.split(/\r?\n/)) {
    const answer = joinAnswer(line);
    if (!/(?:QQ|用户群|用戶群|交流群|開發者群|开发者群)/i.test(line)) {
      if (answer && recentQq) recentQq.joinAnswer ||= answer;
      continue;
    }
    const developer = /开发者\s*(?:QQ\s*)?群|開發者\s*(?:QQ\s*)?群|developer\s*(?:qq\s*)?group/i.test(line);
    for (const match of line.matchAll(/(?<!\d)(\d{6,12})(?!\d)/g)) {
      add({ type: 'qq', label: `${developer ? '开发者群' : 'QQ'} ${match[1]}`, value: match[1], groupKind: developer ? 'developer' : 'user', joinAnswer: answer });
      recentQq = links.find(link => link.type === 'qq' && link.value === match[1]);
    }
  }
  return links;
}

async function githubMetadata(project, fallback) {
  const configured = project.fallbackMetadata || {};
  try {
    const [repo, release, pypi] = await Promise.all([
      githubGet(`/repos/${project.github}`),
      githubGet(`/repos/${project.github}/releases/latest`).catch(() => null),
      project.pypi ? fetch(`https://pypi.org/pypi/${encodeURIComponent(project.pypi)}/json`).then(response => response.ok ? response.json() : null).catch(() => null) : null
    ]);
    return {
      stars: repo.stargazers_count, forks: repo.forks_count, description: repo.description,
      release: release?.tag_name || pypi?.info?.version || configured.release || '—', releaseUrl: release?.html_url || configured.releaseUrl || `https://github.com/${project.github}/releases`,
      // GitHub tags are display/release labels and can differ from the version
      // accepted by pip (for example, a leading "v").
      pypiVersion: pypi?.info?.version || configured.release || null,
      releaseAssets: release ? release.assets.map(asset => ({ name: asset.name, browser_download_url: asset.browser_download_url, size: asset.size })) : (configured.releaseAssets || []),
      mirrors: release
        ? [...extractReleaseMirrors(release.body), ...(configured.mirrors || [])].filter((item, index, all) => all.findIndex(other => other.url === item.url) === index)
        : (configured.mirrors || []),
      updated: repo.pushed_at || fallback.updated
    };
  } catch (error) {
    console.warn(`Metadata fallback for ${project.id}: ${error.message}`);
    return {
      stars: configured.stars || 0, forks: configured.forks || 0, description: configured.description || '',
      release: configured.release || '—', pypiVersion: configured.release || null, releaseUrl: configured.releaseUrl || `https://github.com/${project.github}/releases`,
      releaseAssets: configured.releaseAssets || [], mirrors: configured.mirrors || [], updated: fallback.updated
    };
  }
}

function flattenMkDocsNav(nav, trail = []) {
  const pages = [];
  for (const item of Array.isArray(nav) ? nav : []) {
    if (typeof item === 'string') {
      pages.push({ title: path.basename(item, path.extname(item)), source: item, trail });
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    for (const [title, value] of Object.entries(item)) {
      if (typeof value === 'string') pages.push({ title, source: value, trail });
      else pages.push(...flattenMkDocsNav(value, [...trail, title]));
    }
  }
  return pages;
}

async function loadMkDocs(project) {
  const configFile = path.resolve(project.state.repoDir, project.mkdocs || 'mkdocs.yml');
  let parsed;
  try {
    parsed = YAML.parse(await fs.readFile(configFile, 'utf8')) || {};
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const nav = project.locales.map(locale => ({
      title: locale.label,
      source: posix(path.relative(project.state.repoDir, path.resolve(project.state.repoDir, locale.source, locale.index))),
      trail: [],
      file: path.resolve(project.state.repoDir, locale.source, locale.index)
    }));
    for (const page of nav) await fs.access(page.file);
    return { configFile: null, docsDir: project.state.repoDir, nav, siteName: project.name, description: '' };
  }
  const docsDir = path.resolve(project.state.repoDir, parsed.docs_dir || 'docs');
  const nav = flattenMkDocsNav(parsed.nav).filter(page => /\.md$/i.test(page.source)).map(page => ({
    ...page,
    file: path.resolve(docsDir, page.source)
  }));
  if (!nav.length) throw new Error(`${project.id}: mkdocs.yml must define at least one Markdown page in nav`);
  for (const page of nav) {
    if (!page.file.startsWith(docsDir + path.sep) && page.file !== docsDir) throw new Error(`${project.id}: MkDocs nav entry escapes docs_dir: ${page.source}`);
    await fs.access(page.file);
  }
  return { configFile, docsDir, nav, siteName: parsed.site_name || project.name, description: parsed.site_description || '' };
}

function discoverLocales(project, mkdocs) {
  const locales = project.locales.map(locale => ({ ...locale }));
  for (const page of mkdocs.nav) {
    if (!/^(?:index|readme)\.md$/i.test(path.basename(page.file))) continue;
    const relativeDir = posix(path.relative(mkdocs.docsDir, path.dirname(page.file)));
    if (!relativeDir || relativeDir === '.' || relativeDir.includes('/')) continue;
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(relativeDir)) continue;
    const source = posix(path.relative(project.state.repoDir, path.dirname(page.file)));
    if (locales.some(locale => path.resolve(project.state.repoDir, locale.source) === path.dirname(page.file))) continue;
    locales.push({ code: relativeDir, label: page.trail.at(-1) || page.title || relativeDir, source, index: path.basename(page.file) });
  }
  return locales;
}

function owningLocale(project, absoluteFile) {
  const exact = project.locales.find(locale => absoluteFile === path.resolve(project.state.repoDir, locale.source, locale.index));
  if (exact) return exact;
  return [...project.locales].sort((a, b) => b.source.length - a.source.length).find(locale => {
    const sourceRoot = path.resolve(project.state.repoDir, locale.source);
    return absoluteFile === sourceRoot || absoluteFile.startsWith(sourceRoot + path.sep);
  });
}

async function copySourceAsset(project, sourceFile) {
  try {
    const rel = path.relative(project.state.repoDir, sourceFile);
    if (rel.startsWith('..')) return null;
    const destination = path.join(staticDir, 'assets', 'sources', project.id, rel);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(sourceFile, destination);
    return `/assets/sources/${project.id}/${posix(rel)}`;
  } catch { return null; }
}

async function collectProjectMarkdown(project) {
  const files = new Set(project.state.mkdocs.nav.map(page => page.file));
  for (const name of ['README.md', 'README_en.md', 'README_zh_TW.md', 'README_ja.md']) {
    const file = path.join(project.state.repoDir, name);
    try { await fs.access(file); files.add(file); } catch {}
  }
  const contents = [];
  for (const file of files) {
    try { contents.push(await fs.readFile(file, 'utf8')); } catch {}
  }
  return contents.join('\n');
}

async function writeProjectIcon(bytes, name) {
  const destination = path.join(staticDir, 'assets', 'project-icons', `${name}.png`);
  const optimized = await sharp(bytes)
    .resize({ width: 128, height: 128, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 85, effort: 10 })
    .toBuffer();
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, optimized);
  return `/assets/project-icons/${name}.png`;
}

async function saveRemoteImage(url, name) {
  if (!url) return null;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'ok-websites-generator' } });
    if (!response.ok || !/^image\//i.test(response.headers.get('content-type') || '')) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) return null;
    return await writeProjectIcon(bytes, name);
  } catch { return null; }
}

async function saveLocalProjectIcon(project) {
  try {
    const bytes = await fs.readFile(path.join(project.state.repoDir, project.icon));
    return await writeProjectIcon(bytes, project.id);
  } catch { return null; }
}

async function enrichRelatedProjects(items) {
  const enriched = await Promise.all(items.map(async item => {
    try {
      const repo = await githubGet(`/repos/${item.github}`);
      const [readme, release] = await Promise.all([
        fetchRawReadme(item.github, [repo.default_branch, 'main', 'master']),
        githubGet(`/repos/${item.github}/releases/latest`).catch(() => null)
      ]);
      const tags = release ? [] : await githubGet(`/repos/${item.github}/tags?per_page=1`).catch(() => []);
      const candidates = ['icons/icon.png', 'icon.png', 'assets/icon.png', 'assets/logo.png', 'logo.png'];
      let iconUrl = null;
      for (const candidate of candidates) {
        iconUrl = await saveRemoteImage(`https://raw.githubusercontent.com/${item.github}/${repo.default_branch}/${candidate}`, item.name);
        if (iconUrl) break;
      }
      if (!iconUrl) iconUrl = await saveRemoteImage(repo.owner?.avatar_url, item.name);
      const discoveredCommunity = extractCommunity(readme);
      const configuredCommunity = item.communityLinks || [];
      const communityLinks = [...configuredCommunity, ...discoveredCommunity].filter((link, index, all) => all.findIndex(other => other.type === link.type && (other.url || other.label) === (link.url || link.label)) === index);
      const descriptions = localizedGithubDescription(item, repo.description);
      const updatedAt = repo.pushed_at || repo.updated_at;
      return {
        ...item,
        description: descriptions.values,
        descriptionSource: descriptions.source,
        stars: repo.stargazers_count || 0,
        status: repo.archived ? 'archived' : item.status,
        release: release?.tag_name || tags?.[0]?.name || '—',
        updatedAt,
        stale: isSixMonthsStale(updatedAt),
        iconUrl,
        communityLinks
      };
    } catch (error) {
      console.warn(`Related project metadata fallback for ${item.name}: ${error.message}`);
      let webMetadata = null;
      try { webMetadata = await githubWebMetadata(item); } catch (webError) { console.warn(`GitHub web metadata fallback for ${item.name}: ${webError.message}`); }
      let iconUrl = null;
      for (const branch of ['master', 'main']) {
        for (const candidate of ['icons/icon.png', 'icon.png', 'assets/icon.png', 'assets/logo.png', 'logo.png']) {
          iconUrl = await saveRemoteImage(`https://raw.githubusercontent.com/${item.github}/${branch}/${candidate}`, item.name);
          if (iconUrl) break;
        }
        if (iconUrl) break;
      }
      if (!iconUrl) iconUrl = await saveRemoteImage(`https://github.com/${item.github.split('/')[0]}.png`, item.name);
      const descriptions = localizedGithubDescription(item, webMetadata?.description);
      const updatedAt = webMetadata?.updatedAt || item.updatedAt || null;
      const readmeCommunity = extractCommunity(webMetadata?.readme || '');
      const configuredCommunity = item.communityLinks || [];
      const communityLinks = [...configuredCommunity, ...readmeCommunity].filter((link, index, all) => all.findIndex(other => other.type === link.type && (other.url || other.value || other.label) === (link.url || link.value || link.label)) === index);
      return {
        ...item,
        description: descriptions.values,
        descriptionSource: descriptions.source,
        stars: item.stars || 0,
        release: webMetadata?.release || item.release || '—',
        updatedAt,
        stale: isSixMonthsStale(updatedAt),
        iconUrl,
        communityLinks
      };
    }
  }));
  return enriched.sort((a, b) => {
    const aLast = a.status === 'archived' || a.stale;
    const bLast = b.status === 'archived' || b.stale;
    return Number(aLast) - Number(bLast) || b.stars - a.stars || a.name.localeCompare(b.name);
  });
}

function localDocUrl(project, locale, absoluteMd) {
  const sourceRoot = path.resolve(project.state.repoDir, locale.source);
  const localeIndex = path.resolve(sourceRoot, locale.index);
  if (path.resolve(absoluteMd) === localeIndex) return `${docRoot(project, locale)}/`;
  const insideLocale = absoluteMd.startsWith(sourceRoot + path.sep);
  let rel = posix(path.relative(insideLocale ? sourceRoot : project.state.mkdocs.docsDir, absoluteMd));
  rel = rel.replace(/(?:^|\/)README\.md$/i, '').replace(/\.md$/i, '');
  return `${docRoot(project, locale)}/${rel ? `${rel}/` : ''}`.replace(/\/+/g, '/');
}

async function markdownToHtml(markdown, context) {
  let html = await marked.parse(markdown, { gfm: true, breaks: false });
  const ids = new Map();
  const headings = [];
  html = html.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (_, depth, content) => {
    const plain = content.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    const base = cleanSlug(plain); const count = ids.get(base) || 0; ids.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    if (+depth >= 2 && +depth <= 3) headings.push({ depth: +depth, text: plain, id });
    return `<h${depth} id="${id}">${content}</h${depth}>`;
  });

  html = html.replace(/href="([^"]+)"/g, (match, href) => {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) return match;
    const clean = decodeURIComponent(href.split('#')[0]);
    const hash = href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : '';
    if (/\.md$/i.test(clean) || /README\.md$/i.test(clean)) {
      const target = path.resolve(path.dirname(context.sourceFile), clean);
      const matchingLocale = context.project.locales.find(loc => path.resolve(target) === path.resolve(context.project.state.repoDir, loc.source, loc.index));
      if (matchingLocale) {
        const linkedLocale = context.locale.generatedFrom === matchingLocale.code ? context.locale : matchingLocale;
        return `href="${relativeSiteUrl(context.project, context.currentUrl, context.project, `${docRoot(context.project, linkedLocale)}/`)}"`;
      }
      if (target === path.join(context.project.state.mkdocs.docsDir, 'index.md')) return `href="${relativeSiteUrl(context.project, context.currentUrl, context.project, landingUrl(context.project, context.locale))}"`;
      const targetLocale = owningLocale(context.project, target);
      const linkedLocale = context.locale.generatedFrom === targetLocale?.code ? context.locale : (targetLocale || context.locale);
      return `href="${relativeSiteUrl(context.project, context.currentUrl, context.project, localDocUrl(context.project, linkedLocale, target))}${hash}"`;
    }
    const target = path.resolve(path.dirname(context.sourceFile), clean);
    const repoRelative = path.relative(context.project.state.repoDir, target);
    const docsRelative = path.relative(context.project.state.mkdocs.docsDir, target);
    const insideRepo = repoRelative === '' || (!repoRelative.startsWith(`..${path.sep}`) && repoRelative !== '..' && !path.isAbsolute(repoRelative));
    const insideDocs = docsRelative === '' || (!docsRelative.startsWith(`..${path.sep}`) && docsRelative !== '..' && !path.isAbsolute(docsRelative));
    if (insideRepo && !insideDocs) {
      const githubPath = repoRelative.split(path.sep).map(encodeURIComponent).join('/');
      const kind = path.extname(target) ? 'blob' : 'tree';
      return `href="https://github.com/${context.project.github}/${kind}/${context.project.state.commit}/${githubPath}${hash}"`;
    }
    return match;
  });

  const assetPromises = [];
  html = html.replace(/src="([^"]+)"/g, (match, src) => {
    if (/^(?:https?:|data:)/i.test(src)) return match;
    const marker = `__ASSET_${assetPromises.length}__`;
    let source = path.resolve(path.dirname(context.sourceFile), decodeURIComponent(src));
    if (path.basename(source).toLowerCase() === 'icon.png' && context.project.icon) source = path.join(context.project.state.repoDir, context.project.icon);
    assetPromises.push(copySourceAsset(context.project, source));
    return `src="${marker}"`;
  });
  const assets = await Promise.all(assetPromises);
  assets.forEach((url, index) => { html = html.replace(`__ASSET_${index}__`, url ? relativeAssetUrl(context.project, context.currentUrl, url) : ''); });
  return { html, headings };
}

function projectIcon(project, viewingProject, currentUrl, className = 'dropdown-option-icon') {
  const related = config.relatedProjects.find(item => item.github === project.github);
  const iconUrl = project.state?.iconUrl || related?.iconUrl;
  return iconUrl
    ? `<span class="${className}"><img src="${relativeAssetUrl(viewingProject, currentUrl, iconUrl)}" alt=""></span>`
    : `<span class="${className} brand-mark" aria-hidden="true"></span>`;
}

function projectSwitcher(project, locale, currentUrl) {
  const options = config.projects.map(item => {
    const targetLocale = item.locales.find(candidate => candidate.code === locale.code) || item.locales.find(candidate => candidate.code === 'en') || item.locales[0];
    const href = relativeSiteUrl(project, currentUrl, item, landingUrl(item, targetLocale));
    return `<a class="dropdown-option" role="menuitem" href="${href}"${item.id === project.id ? ' aria-current="page"' : ''}>${projectIcon(item, project, currentUrl)}<span>${escapeHtml(item.name)}</span></a>`;
  }).join('');
  return `<div class="custom-dropdown project-switcher" data-dropdown>
    <button class="dropdown-trigger project-trigger" type="button" data-dropdown-trigger aria-haspopup="menu" aria-expanded="false">${projectIcon(project, project, currentUrl, 'dropdown-current-icon')}<span>${escapeHtml(project.name)}</span><span class="dropdown-arrow" aria-hidden="true">⌄</span></button>
    <div class="dropdown-menu project-menu" data-dropdown-menu role="menu" hidden>${options}</div>
  </div>`;
}

function languageSwitcher(project, currentLocale, destination = 'landing', currentUrl = landingUrl(project, currentLocale)) {
  const options = project.locales.map(locale => {
    const targetUrl = destination === 'docs' ? `${docRoot(project, locale)}/` : landingUrl(project, locale);
    const href = relativeSiteUrl(project, currentUrl, project, targetUrl);
    return `<a class="dropdown-option language-option" role="menuitem" href="${href}" data-language-code="${escapeHtml(locale.code)}"${locale.code === currentLocale.code ? ' aria-current="page"' : ''}><span class="language-code">${escapeHtml(locale.code)}</span><span>${escapeHtml(locale.label)}</span></a>`;
  }).join('');
  return `<div class="custom-dropdown language-dropdown" data-dropdown>
    <button class="dropdown-trigger language-trigger" type="button" data-dropdown-trigger aria-haspopup="menu" aria-expanded="false" aria-label="Language"><span class="language-symbol" aria-hidden="true">文</span><span>${escapeHtml(currentLocale.label)}</span><span class="dropdown-arrow" aria-hidden="true">⌄</span></button>
    <div class="dropdown-menu language-menu" data-dropdown-menu role="menu" hidden>${options}</div>
  </div>`;
}

function githubIcon(project, currentUrl) {
  return `<img class="inline-icon" src="${relativeAssetUrl(project, currentUrl, '/assets/github-mark.svg')}" alt="" aria-hidden="true">`;
}

function releaseDownloads(meta) {
  const fallbackAsset = meta.releaseAssets?.find(asset => /\.exe$/i.test(asset.name))?.browser_download_url;
  const find = pattern => meta.releaseAssets?.find(asset => pattern.test(asset.name))?.browser_download_url || fallbackAsset || meta.releaseUrl;
  return { china: find(/China-setup\.exe$/i), global: find(/Global-setup\.exe$/i) };
}

function communityLinks(links = [], label = '', compact = false, localeCode = 'en', project, currentUrl, ownerId = project?.id) {
  const chinese = localeCode.startsWith('zh');
  const visibleLinks = links.filter(link => {
    const developer = link.groupKind === 'developer' || /开发者\s*(?:QQ\s*)?群|開發者\s*(?:QQ\s*)?群|developer\s*(?:qq\s*)?group/i.test(link.label || '');
    if (developer) return chinese && ownerId === 'ok-script';
    return chinese || link.type === 'discord';
  });
  if (!visibleLinks.length) return '';
  const items = visibleLinks.slice(0, compact ? 3 : 6).map(link => {
    const className = `community-chip ${link.type}`;
    const iconName = link.type === 'discord' ? 'discord.svg' : 'qq.svg';
    const icon = `<img class="community-icon" src="${relativeAssetUrl(project, currentUrl, `/assets/${iconName}`)}" alt="" aria-hidden="true">`;
    if (link.type === 'qq') {
      const number = link.value || (link.label || '').match(/\d{6,12}/)?.[0];
      const developer = link.groupKind === 'developer' || /开发者\s*(?:QQ\s*)?群|開發者\s*(?:QQ\s*)?群|developer\s*(?:qq\s*)?group/i.test(link.label || '');
      if (number) return `<button class="${className}" type="button" data-copy="${number}" aria-label="复制 QQ 群 ${number}" title="点击复制群号">${icon}<span>${developer ? '开发者群' : '群'}${number}${link.joinAnswer ? ` 入群答案:${escapeHtml(link.joinAnswer)}` : ''}</span></button>`;
    }
    const content = `${icon}<span>${escapeHtml(link.label)}</span>`;
    return link.url ? `<a class="${className}" href="${escapeHtml(link.url)}">${content}</a>` : `<span class="${className}">${content}</span>`;
  }).join('');
  return `<div class="community-row${compact ? ' compact' : ''}">${label ? `<span class="community-label"><span class="community-heading-icon" aria-hidden="true">◎</span>${escapeHtml(label)}</span>` : ''}${items}</div>`;
}

async function faqFromMarkdown(project, locale) {
  let sourceFile = path.resolve(project.state.repoDir, locale.source, locale.index);
  let markdown;
  try { markdown = await fs.readFile(sourceFile, 'utf8'); } catch { return null; }
  if (locale.autoTranslated) markdown = translateMarkdownToTraditional(markdown);
  let lines = markdown.split(/\r?\n/);
  const headingPattern = /^(#{2,4})\s+(.+)$/;
  const faqPattern = /(?:\bFAQ\b|Frequently Asked|Troubleshooting|常见问题|常見問題|疑难解答|疑難排解|トラブルシューティング)/i;
  let start = lines.findIndex(line => {
    const match = line.match(headingPattern);
    return match && faqPattern.test(match[2]);
  });
  if (start < 0) {
    const localeRoot = path.resolve(project.state.repoDir, locale.source);
    const faqPage = project.state.mkdocs.nav.find(page => page.file.startsWith(localeRoot + path.sep) && faqPattern.test(`${page.title} ${page.source}`));
    if (!faqPage) return null;
    sourceFile = faqPage.file;
    try { markdown = await fs.readFile(sourceFile, 'utf8'); } catch { return null; }
    if (locale.autoTranslated) markdown = translateMarkdownToTraditional(markdown);
    lines = markdown.split(/\r?\n/);
    const firstHeading = lines.findIndex(line => /^#\s+/.test(line));
    if (firstHeading >= 0) lines.splice(firstHeading, 1);
    const body = lines.join('\n').trim();
    if (!body) return null;
    const rendered = await markdownToHtml(body, { project, locale, sourceFile, currentUrl: landingUrl(project, locale) });
    return { title: locale.autoTranslated ? simplifiedToTraditional(faqPage.title) : faqPage.title, html: rendered.html };
  }
  const heading = lines[start].match(headingPattern);
  const depth = heading[1].length;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(headingPattern);
    if (match && match[1].length <= depth) { end = index; break; }
  }
  const body = lines.slice(start + 1, end).join('\n').trim();
  if (!body) return null;
  const rendered = await markdownToHtml(body, { project, locale, sourceFile, currentUrl: landingUrl(project, locale) });
  return { title: heading[2].replace(/^[^\p{L}\p{N}]+/u, '').trim(), html: rendered.html };
}

function header(project, locale, destination = 'landing', currentUrl = landingUrl(project, locale)) {
  const t = localeCopy(locale.code);
  const docs = relativeSiteUrl(project, currentUrl, project, `${docRoot(project, locale)}/`);
  const framework = config.projects.find(item => item.type === 'framework') || project;
  const frameworkLocale = framework.locales.find(item => item.code === locale.code) || framework.locales.find(item => item.code === 'en') || framework.locales[0];
  const projects = `${relativeSiteUrl(project, currentUrl, framework, landingUrl(framework, frameworkLocale))}#projects`;
  return `<a class="skip-link" href="#main">${t.skip}</a>
  <header class="site-header"><nav class="container nav" aria-label="Primary">
    ${projectSwitcher(project, locale, currentUrl)}
    <div class="nav-links" data-nav-links>
      <a href="${docs}"${destination === 'docs' ? ' aria-current="page"' : ''}>${t.navDocs}</a>
      <a href="${projects}">${t.navProjects}</a>
      <a class="github-link" href="https://github.com/${project.github}">${githubIcon(project, currentUrl)}${t.navGithub}</a>
    </div>
    <div class="nav-actions">
      ${languageSwitcher(project, locale, destination, currentUrl)}
      <button class="icon-button" type="button" data-theme-toggle aria-label="${t.theme}" title="${t.theme}">◐</button>
      <button class="icon-button menu-button" type="button" data-menu aria-label="${t.menu}" aria-expanded="false">☰</button>
    </div>
  </nav></header>`;
}

function documentShell({ title, description, project, locale, body, destination = 'landing', canonical, currentUrl = landingUrl(project, locale) }) {
  const t = localeCopy(locale.code);
  const asset = file => relativeAssetUrl(project, currentUrl, `/assets/${file}`);
  const framework = config.projects.find(item => item.type === 'framework') || project;
  const frameworkLocale = framework.locales.find(item => item.code === locale.code) || framework.locales.find(item => item.code === 'en') || framework.locales[0];
  const allProjectsUrl = relativeSiteUrl(project, currentUrl, framework, landingUrl(framework, frameworkLocale));
  const pageType = destination === 'docs' ? 'article' : 'website';
  const defaultLocale = project.locales.find(item => item.code === config.site.defaultLocale) || project.locales[0];
  const alternateLinks = destination === 'landing'
    ? `${project.locales.map(item => `<link rel="alternate" hreflang="${escapeHtml(item.code)}" href="${escapeHtml(`${projectOrigin(project)}${landingUrl(project, item)}`)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${projectOrigin(project)}${landingUrl(project, defaultLocale)}`)}">`
    : '';
  const alternateLocales = project.locales.filter(item => item.code !== locale.code).map(item => `<meta property="og:locale:alternate" content="${escapeHtml(item.code.replace('-', '_'))}">`).join('');
  const languageRoutes = Object.fromEntries(project.locales.map(item => [item.code, relativeSiteUrl(project, currentUrl, project, landingUrl(project, item))]));
  const languageRouting = destination === 'landing' && currentUrl === landingUrl(project, project.locales.find(item => item.code === 'zh-CN') || project.locales[0]) && project.locales.length > 1
    ? `<script data-language-routing>(()=>{try{const routes=${JSON.stringify(languageRoutes).replace(/</g, '\\u003c')};const available=Object.keys(routes);const select=raw=>{const value=String(raw||'').toLowerCase();if(!value)return null;const exact=available.find(code=>code.toLowerCase()===value);if(exact)return exact;if(value.startsWith('zh-')&&/(?:hant|tw|hk|mo)/.test(value)){const traditional=available.find(code=>code.toLowerCase()==='zh-tw');if(traditional)return traditional;}if(value.startsWith('zh')){const simplified=available.find(code=>code.toLowerCase()==='zh-cn');if(simplified)return simplified;}const base=value.split('-')[0];return available.find(code=>code.toLowerCase().split('-')[0]===base)||null};const saved=localStorage.getItem('ok-language');const requested=saved?[saved]:Array.from(navigator.languages||[navigator.language]);const selected=requested.map(select).find(Boolean)||select('${escapeHtml(config.site.defaultLocale)}')||available[0];if(selected&&selected!=='${escapeHtml(locale.code)}')location.replace(routes[selected])}catch{}})();</script>`
    : '';
  const keywords = [project.name, 'ok-script', destination === 'docs' ? 'documentation' : 'game automation', 'computer vision', 'Python', 'Windows'].join(', ');
  const structuredData = JSON.stringify(destination === 'docs' ? {
    '@context': 'https://schema.org', '@type': 'TechArticle', headline: title, description, url: canonical,
    inLanguage: locale.code, dateModified: project.state.updated, author: { '@type': 'Organization', name: project.name, url: `https://github.com/${project.github}` },
    isPartOf: { '@type': 'WebSite', name: config.site.name, url: config.site.url }
  } : {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: project.name, description, url: canonical,
    inLanguage: locale.code, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Windows',
    codeRepository: `https://github.com/${project.github}`, dateModified: project.state.updated,
    author: { '@type': 'Organization', name: project.github.split('/')[0], url: `https://github.com/${project.github.split('/')[0]}` }
  }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="${locale.code}" data-theme="light"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark">
  <title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="keywords" content="${escapeHtml(keywords)}"><meta name="author" content="${escapeHtml(project.github.split('/')[0])}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="googlebot" content="index,follow"><link rel="canonical" href="${escapeHtml(canonical)}">${alternateLinks}
  <meta property="og:type" content="${pageType}"><meta property="og:site_name" content="${escapeHtml(config.site.name)}"><meta property="og:locale" content="${escapeHtml(locale.code.replace('-', '_'))}">${alternateLocales}<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">
  <script type="application/ld+json">${structuredData}</script>
  ${languageRouting}
  <link rel="icon" href="${asset('favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${asset(`site.css?v=${assetVersion}`)}">
  <script>try{document.documentElement.dataset.theme=localStorage.getItem('ok-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch(e){}</script>
  </head><body>${header(project, locale, destination, currentUrl)}${body}
  <footer class="site-footer"><div class="container footer-row"><span>${t.footer}</span><div class="footer-links"><a class="github-link" href="https://github.com/${project.github}">${githubIcon(project, currentUrl)}GitHub</a><a href="${allProjectsUrl}">${t.allProjects}</a></div></div></footer>
  <script src="${asset(`site.js?v=${assetVersion}`)}" defer></script></body></html>`;
}

function landingPage(project, locale, meta, faq = null) {
  const t = localeCopy(locale.code); const isFramework = project.type === 'framework';
  const currentUrl = landingUrl(project, locale);
  const marketingKey = project.id === 'ok-onmyoji' ? 'onmyoji' : project.id === 'ok-nte' ? 'nte' : project.id === 'ok-star-resonance' ? 'star' : project.id === 'ok-kes' ? 'kes' : project.id === 'ok-end-field' ? 'end' : isFramework ? 'framework' : project.type === 'template' ? 'template' : 'app';
  const localizedMarketing = key => t[key] || (locale.autoTranslated ? simplifiedToTraditional(copy['zh-CN'][key]) : copy.en[key]);
  const eyebrow = localizedMarketing(`${marketingKey}Eyebrow`);
  const [titleA, titleB] = localizedMarketing(`${marketingKey}Title`).split('\n');
  const lead = localizedMarketing(`${marketingKey}Lead`);
  const docsUrl = relativeSiteUrl(project, currentUrl, project, `${docRoot(project, locale)}/`);
  const downloads = releaseDownloads(meta);
  const chinaDefault = locale.code === 'zh-CN';
  const primaryUrl = isFramework ? docsUrl : downloads[chinaDefault ? 'china' : 'global'];
  const pypiUrl = `https://pypi.org/project/${encodeURIComponent(project.pypi || 'ok-script')}/`;
  const pypiVersion = meta.pypiVersion || meta.release;
  const primaryLabel = isFramework ? t.getStarted : `${t.downloadGithub}${locale.code === 'zh-CN' ? ' · 大陆版' : ' · Global'}`;
  const projectFeatures = features[project.id] || features[project.type];
  const featureSet = projectFeatures[locale.code] || (locale.autoTranslated ? translateToTraditional(projectFeatures[locale.generatedFrom] || projectFeatures['zh-CN']) : projectFeatures.en);
  const related = config.relatedProjects.map(item => {
    const desc = item.description[locale.code] || (locale.autoTranslated && item.description[locale.generatedFrom] ? simplifiedToTraditional(item.description[locale.generatedFrom]) : item.description.en);
    const icon = item.iconUrl ? `<img src="${relativeAssetUrl(project, currentUrl, item.iconUrl)}" alt="">` : escapeHtml(item.name.slice(0,2).toUpperCase());
    const localProject = config.projects.find(candidate => candidate.github === item.github);
    const targetLocale = localProject && (localProject.locales.find(candidate => candidate.code === locale.code) || localProject.locales.find(candidate => candidate.code === 'en') || localProject.locales[0]);
    const itemUrl = localProject ? relativeSiteUrl(project, currentUrl, localProject, landingUrl(localProject, targetLocale)) : item.url;
    const projectLinkIcon = /^https:\/\/github\.com\//.test(itemUrl) ? githubIcon(project, currentUrl) : '';
    const lastGroup = item.status === 'archived' || item.stale;
    return `<article class="project-card${lastGroup ? ' project-last' : ''}" data-description-source="${item.descriptionSource || 'fallback'}"><div class="project-top"><a class="project-logo" href="${itemUrl}">${icon}</a><div class="project-top-meta"><a class="project-stars" href="https://github.com/${item.github}" aria-label="${escapeHtml(`${item.name}: ${Number(item.stars || 0).toLocaleString()} GitHub stars`)}">★ ${Number(item.stars || 0).toLocaleString()}</a><a class="github-link" href="https://github.com/${item.github}">${githubIcon(project, currentUrl)}GitHub</a></div></div><h3><a href="${itemUrl}">${escapeHtml(item.name)}</a></h3><p class="project-description">${escapeHtml(desc)}</p><div class="project-meta"><span><small>${t.release}</small><strong>${escapeHtml(item.release || '—')}</strong></span><span><small>${t.updated}</small><time datetime="${escapeHtml(item.updatedAt || '')}">${formatDate(item.updatedAt, locale.code)}</time></span></div><a class="project-link github-link" href="${itemUrl}">${projectLinkIcon}${t.explore}</a></article>`;
  }).join('');
  const sourceButton = `<a class="button" href="https://github.com/${project.github}">${githubIcon(project, currentUrl)}${t.viewSource}</a>`;
  const chinaLabel = locale.code === 'zh-CN' ? '大陆版' : 'China';
  const globalLabel = 'Global';
  const defaultDownloadLabel = chinaDefault ? chinaLabel : globalLabel;
  const downloadOptions = [
    { label: chinaLabel, url: downloads.china },
    { label: globalLabel, url: downloads.global }
  ].map(option => `<a class="dropdown-option download-option" role="menuitem" target="_blank" rel="noopener" href="${escapeHtml(option.url)}" data-download-link><span>${option.label}</span><strong>${escapeHtml(meta.release)}</strong></a>`).join('');
  const downloadControl = `<div class="custom-dropdown download-split" data-dropdown data-download-control data-downloading-label="${escapeHtml(t.downloading)}" data-download-guide="${escapeHtml(t.downloadGuide || copy.en.downloadGuide)}">
    <a class="button primary download-main" target="_blank" rel="noopener" href="${escapeHtml(primaryUrl)}" data-download-link>${githubIcon(project, currentUrl)}<span data-download-label>${t.downloadGithub}</span><strong>${escapeHtml(meta.release)}</strong><small>${defaultDownloadLabel}</small><span aria-hidden="true">↓</span></a>
    <button class="download-toggle" type="button" data-dropdown-trigger aria-haspopup="menu" aria-expanded="false" aria-label="Choose download version"><span class="dropdown-arrow" aria-hidden="true">⌄</span></button>
    <div class="dropdown-menu download-menu" data-dropdown-menu role="menu" hidden>${downloadOptions}</div>
  </div>`;
  const heroActions = isFramework
    ? `<a class="button primary" href="${primaryUrl}">${primaryLabel} <span aria-hidden="true">→</span></a><a class="button pip-button" href="${pypiUrl}"><span class="pip-mark" aria-hidden="true">PyPI</span><code>pip install ok-script==${escapeHtml(pypiVersion)}</code></a>${sourceButton}`
    : `${downloadControl}<a class="button" href="${docsUrl}">${t.readDocs}</a>${sourceButton}`;
  const mirrorLinks = !isFramework && locale.code === 'zh-CN' && meta.mirrors?.length
    ? `<div class="download-alternatives"><span>${t.githubUnavailable}</span>${meta.mirrors.map(link => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`).join('')}</div>` : '';
  const projectsSection = isFramework ? `<section class="section" id="projects"><div class="container landing-container"><div class="section-head compact"><div class="section-kicker">${t.projectsKicker}</div><p>${t.projectsLead}</p></div><div class="project-grid">${related}</div></div></section>` : '';
  const faqSection = faq ? `<section class="section faq-section"><div class="container landing-container"><div class="section-head compact"><h2>${t.faqKicker}</h2></div><div class="faq-content markdown-body">${faq.html}</div></div></section>` : '';
  const capabilitiesSection = `<section class="section section-muted"><div class="container landing-container"><div class="feature-grid">${featureSet.map(f => `<article class="feature-card"><div class="feature-icon">${f[0]}</div><h3>${f[1]}</h3><p>${f[2]}</p></article>`).join('')}</div></div></section>`;
  const ctaSection = isFramework ? `<section class="section"><div class="container"><div class="cta"><div><h2>${t.ctaTitle}</h2><p>${t.ctaLead}</p></div><a class="button" href="${primaryUrl}">${t.ctaButton} →</a></div></div></section>` : '';
  const community = communityLinks(project.state.communityLinks, t.communityLabel, false, locale.code, project, currentUrl, project.id);
  const body = `<main id="main">
  <section class="hero${isFramework ? ' hero-framework' : ''}"><div class="container landing-container hero-grid hero-single"><div><div class="eyebrow">${eyebrow}</div><h1><span class="title-line">${escapeHtml(titleA)}</span><span class="title-line gradient-text">${escapeHtml(titleB)}</span></h1><p class="hero-copy">${lead}</p>
  <div class="hero-actions">${heroActions}</div>${mirrorLinks}<div class="community-meta-row">${community}<a class="community-stars" href="https://github.com/${project.github}" aria-label="${escapeHtml(`${meta.stars.toLocaleString()} ${t.stars}`)}">★ <strong>${meta.stars.toLocaleString()}</strong> ${t.stars}</a><span class="community-updated">↻ <strong>${formatDate(meta.updated, locale.code)}</strong> ${t.updated}</span></div></div></div></section>
  ${capabilitiesSection}${projectsSection}${faqSection}${ctaSection}</main>`;
  const title = `${project.name} — ${titleA.replace(/[，,.。]/g,'')}`;
  return documentShell({ title, description: lead, project, locale, body, canonical: `${projectOrigin(project)}${landingUrl(project, locale)}` });
}

function navTitleFromMarkdown(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m); return match ? match[1].replace(/[*_`]/g, '') : fallback;
}

async function docsPage(project, locale, page, pages) {
  const { file: sourceFile, markdown } = page;
  const t = localeCopy(locale.code); const title = page.title || navTitleFromMarkdown(markdown, path.basename(sourceFile, '.md'));
  const currentUrl = page.url;
  const rendered = await markdownToHtml(markdown, { project, locale, sourceFile, currentUrl });
  const sidebar = pages.map(page => `<a href="${relativeSiteUrl(project, currentUrl, project, page.url)}"${page.url === currentUrl ? ' class="active" aria-current="page"' : ''}>${escapeHtml(page.title)}</a>`).join('');
  const toc = rendered.headings.map(h => `<a href="#${h.id}" style="margin-left:${(h.depth-2)*10}px">${escapeHtml(h.text)}</a>`).join('');
  const repoRel = posix(path.relative(project.state.repoDir, sourceFile));
  const body = `<main id="main" class="docs-layout"><aside class="docs-sidebar"><h2>${t.docsFor}</h2><nav class="docs-nav" aria-label="${t.docsFor}">${sidebar}</nav></aside><article class="docs-main"><div class="breadcrumb"><a href="${relativeSiteUrl(project, currentUrl, project, landingUrl(project, locale))}">${project.name}</a><span>/</span><span>${t.navDocs}</span></div><div class="markdown-body">${rendered.html}</div><div class="page-meta"><a class="github-link" href="https://github.com/${project.github}/blob/${project.state.commit}/${repoRel}">${githubIcon(project, currentUrl)}${t.editGithub} ↗</a> · ${t.lastGenerated}: ${formatDate(generatedAt, locale.code)}</div></article><aside class="docs-toc"><h2>${t.onPage}</h2><nav class="toc-list">${toc}</nav></aside></main>`;
  return documentShell({ title: `${title} · ${project.name}`, description: `${title} — ${project.name}`, project, locale, body, destination: 'docs', canonical: `${projectOrigin(project)}${currentUrl}`, currentUrl });
}

async function generateProject(project) {
  project.state = await syncProject(project);
  project.state.mkdocs = await loadMkDocs(project);
  project.locales = addAutomaticTraditionalLocale(discoverLocales(project, project.state.mkdocs));
  project.state.iconUrl = project.siteIcon || (project.icon ? await saveLocalProjectIcon(project) : null);
  project.state.communityLinks = extractCommunity(await collectProjectMarkdown(project));
  const meta = await githubMetadata(project, project.state);
  project.state.meta = meta;
  for (const locale of project.locales) {
    const sourceLocale = locale.generatedFrom ? project.locales.find(item => item.code === locale.generatedFrom) : locale;
    const faq = await faqFromMarkdown(project, locale);
    const landing = landingPage(project, locale, meta, faq);
    const landingFile = outputPathFromUrl(project, landingUrl(project, locale));
    await fs.mkdir(path.dirname(landingFile), { recursive: true }); await fs.writeFile(landingFile, landing);

    const pageData = [];
    for (const navPage of project.state.mkdocs.nav) {
      const owner = owningLocale(project, navPage.file);
      const isMkDocsHome = navPage.file === path.join(project.state.mkdocs.docsDir, 'index.md') && !owner;
      if (isMkDocsHome || (owner && owner !== sourceLocale)) continue;
      const sourceMarkdown = await fs.readFile(navPage.file, 'utf8');
      const markdown = locale.autoTranslated ? translateMarkdownToTraditional(sourceMarkdown) : sourceMarkdown;
      pageData.push({ ...navPage, title: locale.autoTranslated ? simplifiedToTraditional(navPage.title) : navPage.title, markdown, url: localDocUrl(project, locale, navPage.file) });
    }
    const indexFile = path.resolve(project.state.repoDir, sourceLocale.source, sourceLocale.index);
    pageData.sort((a, b) => a.file === indexFile ? -1 : b.file === indexFile ? 1 : 0);
    for (const page of pageData) {
      const html = await docsPage(project, locale, page, pageData);
      const file = outputPathFromUrl(project, page.url); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, html);
    }
  }
  return { id: project.id, commit: project.state.commit, updated: project.state.updated, locales: project.locales.map(locale => locale.code), meta };
}

async function writeSharedAssets() {
  await fs.mkdir(path.join(staticDir, 'assets'), { recursive: true });
  await fs.mkdir(path.join(staticDir, 'assets', 'project-icons'), { recursive: true });
  await Promise.all([
    fs.copyFile(path.join(root, 'src', 'site.css'), path.join(staticDir, 'assets', 'site.css')),
    fs.copyFile(path.join(root, 'src', 'site.js'), path.join(staticDir, 'assets', 'site.js')),
    fs.copyFile(path.join(root, 'src', 'github-mark.svg'), path.join(staticDir, 'assets', 'github-mark.svg')),
    fs.copyFile(path.join(root, 'src', 'qq.svg'), path.join(staticDir, 'assets', 'qq.svg')),
    fs.copyFile(path.join(root, 'src', 'discord.svg'), path.join(staticDir, 'assets', 'discord.svg')),
    fs.copyFile(path.join(root, 'src', 'ok-script-icon.svg'), path.join(staticDir, 'assets', 'project-icons', 'ok-script.svg')),
    fs.writeFile(path.join(staticDir, 'assets', 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#16b6ad"/><stop offset="1" stop-color="#6555ed"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#g)"/><text x="32" y="39" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="20" font-weight="700">OK</text></svg>`)
  ]);
}

async function listHtml(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(full)); else if (entry.name.endsWith('.html')) files.push(full);
  } return files;
}

console.log('Syncing project sources…');
await fs.rm(staticDir, { recursive: true, force: true });
await writeSharedAssets();
config.relatedProjects = await enrichRelatedProjects(config.relatedProjects);
const manifestProjects = [];
for (const project of config.projects) manifestProjects.push(await generateProject(project));
const htmlFiles = await listHtml(staticDir);
const projectRoots = config.projects.filter(project => project.outputFolder).map(project => path.resolve(staticDir, project.outputFolder) + path.sep);
for (const project of config.projects) {
  const folder = path.join(staticDir, project.outputFolder || '');
  const projectHtml = project.outputFolder ? await listHtml(folder) : htmlFiles.filter(file => !projectRoots.some(projectRoot => file.startsWith(projectRoot)));
  const urls = projectHtml.map(file => {
    const rel = posix(path.relative(folder, file));
    return rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
  });
  const lastModified = (project.state.meta?.updated || project.state.updated || generatedAt).slice(0, 10);
  await fs.writeFile(path.join(folder, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${projectOrigin(project)}${url}</loc><lastmod>${lastModified}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  await fs.writeFile(path.join(folder, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${projectOrigin(project)}/sitemap.xml\n`);
}
await fs.writeFile(path.join(staticDir, '.nojekyll'), '');
await fs.writeFile(path.join(staticDir, '.generated-manifest.json'), JSON.stringify({ generatedAt, projects: manifestProjects }, null, 2));
console.log(`Generated ${htmlFiles.length} static pages from ${manifestProjects.length} projects.`);
