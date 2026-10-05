import path from 'node:path';

export function unpublishedMarkdownUrl(project, target, hash = '') {
  if (project.state.mkdocs.nav.some(page => page.file === target)) return null;

  const relative = path.relative(project.state.repoDir, target);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;

  const githubPath = relative.split(path.sep).map(encodeURIComponent).join('/');
  return `https://github.com/${project.github}/blob/${project.state.commit}/${githubPath}${hash}`;
}
