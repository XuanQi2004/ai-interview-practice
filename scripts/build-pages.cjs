'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { problems, tutorials, catalog } = require('../data/bank.cjs');
const execute = promisify(execFile);
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const assets = ['style.css', 'app.js', 'pages-progress.js', 'pages-judge.js', 'page-mode.js', 'pages-worker.js', 'pages-runner.py'];

async function build(destination) {
  const content = path.join(destination, 'content');
  await fs.mkdir(content, { recursive: true });
  const survey = await Promise.all(['survey.md', 'practice-guide.md'].map(name => fs.readFile(path.join(root, 'docs', name), 'utf8')));
  const payloads = { problems: { problems }, catalog: { items: catalog }, tutorials: { tutorials }, survey: { markdown: survey.join('\n\n') } };
  await Promise.all(Object.entries(payloads).map(([name, data]) => fs.writeFile(path.join(content, name + '.json'), JSON.stringify(data))));
  await Promise.all(assets.map(name => fs.copyFile(path.join(source, name), path.join(destination, name))));
  const template = await fs.readFile(path.join(source, 'index.html'), 'utf8');
  const app = '<script src="./app.js" defer></script>';
  if (!template.includes(app)) throw new Error('请在模板中保留应用脚本的插入位置。');
  const policy = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'";
  const scripts = ['pages-progress.js', 'pages-judge.js', 'page-mode.js'].map(name => '<script src="./' + name + '" defer></script>');
  const html = template.replace('<meta charset="utf-8" />', '<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="' + policy + '" />')
    .replace(app, [...scripts, app].join('\n    '));
  await fs.writeFile(path.join(destination, 'index.html'), html);
  await fs.writeFile(path.join(destination, '.nojekyll'), '');
  await execute(process.execPath, [path.join(__dirname, 'fetch-pages-python.cjs'), path.join(destination, 'vendor/pyodide/0.27.7')]);
  console.log('静态站点已生成，共 ' + problems.length + ' 道题和 ' + tutorials.length + ' 篇教程。');
}

if (require.main === module) {
  build(path.join(root, 'dist')).catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { build };
