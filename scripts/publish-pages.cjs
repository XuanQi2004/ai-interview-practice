'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { build } = require('./build-pages.cjs');
const execute = promisify(execFile);
const root = path.resolve(__dirname, '..');
const git = async (cwd, ...args) => (await execute('git', args, { cwd })).stdout.trim();

async function publish() {
  const origin = await git(root, 'remote', 'get-url', '--push', 'origin');
  const revision = await git(root, 'rev-parse', '--short', 'HEAD');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'interview-pages-'));
  try {
    await build(temp);
    await git(temp, 'init', '--quiet', '-b', 'gh-pages');
    await git(temp, 'remote', 'add', 'origin', origin);
    const branch = await git(temp, 'ls-remote', '--heads', 'origin', 'refs/heads/gh-pages');
    if (branch) {
      await git(temp, 'fetch', '--depth=1', 'origin', 'refs/heads/gh-pages');
      await git(temp, 'reset', '--mixed', 'FETCH_HEAD');
    }
    await git(temp, 'add', '--all', '--force');
    if (!await git(temp, 'status', '--porcelain')) {
      console.log('远端站点已包含本次构建。');
      return;
    }
    await git(temp, '-c', 'user.name=GitHub Pages', '-c', 'user.email=pages@users.noreply.github.com',
      'commit', '--quiet', '-m', '发布站点 ' + revision);
    await git(temp, 'push', 'origin', 'HEAD:refs/heads/gh-pages');
    console.log('静态文件已推送至 gh-pages 分支。');
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}
publish().catch(error => { console.error(error.message); process.exitCode = 1; });
