import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { unpublishedMarkdownUrl } from './markdown-links.mjs';

const repoDir = path.resolve('fixture-repository');
const project = {
  github: 'AliceJump/ok-end-field',
  state: {
    repoDir,
    commit: '0123456789abcdef',
    mkdocs: {
      nav: ['docs/zh-CN/自动战斗.md', 'docs/dev/API.md', 'docs/en/index.md'].map(file => ({ file: path.resolve(repoDir, file) }))
    }
  }
};

test('combat guide links to the unpublished timing guide at the source commit', () => {
  const sourceFile = path.resolve(repoDir, 'docs/zh-CN/自动战斗.md');
  const target = path.resolve(path.dirname(sourceFile), '../dev/skill-timing-mode.md');
  assert.equal(
    unpublishedMarkdownUrl(project, target, '#timing'),
    'https://github.com/AliceJump/ok-end-field/blob/0123456789abcdef/docs/dev/skill-timing-mode.md#timing'
  );
});

test('published documentation and locale home pages retain local routing', () => {
  for (const page of project.state.mkdocs.nav) {
    assert.equal(unpublishedMarkdownUrl(project, page.file), null);
  }
});

test('unpublished Markdown paths are URL encoded', () => {
  const target = path.resolve(repoDir, 'docs/dev/技能 时序.md');
  assert.equal(
    unpublishedMarkdownUrl(project, target),
    `https://github.com/AliceJump/ok-end-field/blob/0123456789abcdef/docs/dev/${encodeURIComponent('技能 时序.md')}`
  );
});

test('paths outside the repository are not rewritten as repository files', () => {
  assert.equal(unpublishedMarkdownUrl(project, path.resolve(repoDir, '../outside.md')), null);
  assert.equal(unpublishedMarkdownUrl(project, path.resolve(`${repoDir}-other`, 'outside.md')), null);
});
