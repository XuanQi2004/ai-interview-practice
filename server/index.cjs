'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { createProgress, defaultDataDir } = require('./progress.cjs');
const { createBackups, readBackupBody } = require('./backup.cjs');
const { judge, pythonCommand } = require('./judge.cjs');
const { codexStatus, askCodex } = require('./chat.cjs');

const root = path.resolve(__dirname, '..');
const execFileAsync = promisify(execFile);
const { problems, catalog, tutorials } = require('../data/bank.cjs');
const publicProblems = problems.map(({ driver, prelude, ...visible }) => visible);
const byId = new Map(problems.map(p => [p.id, p]));
const tutorialById = new Map(tutorials.map(t => [t.id, t]));
const external = new Set(catalog.map(p => p.id));
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
]);
const httpError = (status, message) => Object.assign(new Error(message), { status });
const check = (condition, message) => { if (!condition) throw httpError(400, message); };

async function readBody(request) {
  check(request.headers['content-type']?.split(';')[0].trim() === 'application/json', '请使用 JSON 提交请求。');
  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 4 * 1024 * 1024) throw httpError(413, '本次提交的内容过大。');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw httpError(400, '请求需要有效的 JSON 对象。');
  }
}

function serializeEvent(body) {
  const { type, problemId } = body;
  if (type === 'tutorial-study') {
    check(tutorialById.has(problemId) && typeof body.done === 'boolean', '请选择教程和阅读状态。');
    return { type, problemId, done: body.done };
  }
  if (type === 'external') {
    check(external.has(problemId) && ['new', 'review', 'done'].includes(body.state), '请选择题单中的题目与练习状态。');
    return { type, problemId, state: body.state };
  }
  const problem = byId.get(problemId);
  check(problem, '请选择本地题库中的练习。');
  if (type === 'draft') {
    check(typeof body.code === 'string', '草稿需要包含代码文本。');
    return { type, problemId, code: body.code };
  }
  if (type === 'study') {
    check(typeof body.done === 'boolean', '请选择学习状态。');
    return { type, problemId, done: body.done };
  }
  if (type === 'review') {
    check(Array.isArray(body.checks) && body.checks.every(item => problem.rubric.includes(item)), '请选择当前题目的评阅项。');
    return { type, problemId, checks: [...new Set(body.checks)] };
  }
  throw httpError(400, '请选择有效的练习记录类型。');
}

async function pythonStatus() {
  try {
    const { stdout } = await execFileAsync(pythonCommand(), ['-I', '-c',
      'import importlib.util,sys,json; print(json.dumps({"version":sys.version.split()[0],"torch":bool(importlib.util.find_spec("torch"))}))'
    ], { timeout: 6000 });
    const info = JSON.parse(stdout);
    return { available: true, ...info, message: 'Python ' + info.version + (info.torch ? ' · PyTorch 已安装' : ' · 安装 PyTorch 可练习张量题') };
  } catch {
    return { available: false, torch: false, message: '请安装 Python 3，或用 INTERVIEW_PYTHON 指定解释器。' };
  }
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

function createApp(options = {}) {
  const progress = createProgress({
    dataDir: options.dataDir || defaultDataDir(),
  });
  const backups = createBackups(progress);
  const server = http.createServer(async (req, res) => {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
      const port = server.address().port;
      const authorities = ['127.0.0.1', 'localhost'].map(h => port === 80 ? h : h + ':' + port);
      if (!authorities.includes(req.headers.host)) throw httpError(403, '请从本机平台地址访问。');
      const origin = req.headers.origin;
      const url = new URL(req.url, 'http://' + req.headers.host);
      const api = url.pathname;
      // 直接导航可打开本机首页；个人 API 的读写限定在本机页面的同一来源。
      if ((origin && origin !== 'http://' + req.headers.host) ||
          (api.startsWith('/api/') && ['same-site', 'cross-site'].includes(req.headers['sec-fetch-site']))) {
        throw httpError(403, '请从本机平台页面发起请求。');
      }
      if (req.method === 'GET') {
        if (api === '/api/identity') return sendJson(res, { app: 'interview-coding-lab' });
        if (api === '/api/problems') return sendJson(res, { problems: publicProblems });
        if (api === '/api/tutorials') return sendJson(res, { tutorials });
        if (api === '/api/catalog') return sendJson(res, { items: catalog });
        if (api === '/api/backup') return sendJson(res, await backups.exportProgress());
        if (api === '/api/events') return sendJson(res, { events: await progress.list() });
        if (api === '/api/survey') {
          const docs = await Promise.all(['survey.md', 'practice-guide.md'].map(f => fs.readFile(path.join(root, 'docs', f), 'utf8')));
          return sendJson(res, { markdown: docs.join('\n\n') });
        }
        if (api === '/api/status') {
          const [codex, sync, python] = await Promise.all([codexStatus(), progress.info(), pythonStatus()]);
          return sendJson(res, { codex, sync, python });
        }
        if (api === '/favicon.ico') { res.writeHead(204); res.end(); return; }
        const asset = assets.get(api) || (/^\/[a-z][a-z0-9.-]*\.(?:js|css)$/.test(api)
          ? [api.slice(1), api.endsWith('.js') ? 'text/javascript' : 'text/css'] : null);
        if (asset) {
          const file = await fs.readFile(path.join(root, 'public', asset[0])).catch(error => {
            if (error.code === 'ENOENT') throw httpError(404, '找不到这个文件。');
            throw error;
          });
          res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'Cache-Control': 'no-cache' });
          res.end(file);
          return;
        }
      }
      if (req.method === 'POST') {
        if (api === '/api/backup/import') {
          return sendJson(res, await backups.importProgress(await readBackupBody(req)));
        }
        const body = await readBody(req);
        if (api === '/api/sync') {
          let outcome;
          try { outcome = await progress.sync(); }
          catch (err) { throw httpError(502, err.message); }
          return sendJson(res, { ...outcome, message: '同步完成，上传 ' + outcome.uploaded + ' 条，下载 ' + outcome.downloaded + ' 条。' });
        }
        if (api === '/api/events') return sendJson(res, { event: await progress.append(serializeEvent(body)) });
        if (api === '/api/tutorial-chat') {
          const tutorial = tutorialById.get(body.tutorialId);
          check(tutorial, '请选择已收录的教程。');
          check(typeof body.message === 'string' && body.message.trim(), '请输入想讨论的问题。');
          check(!body.sourceUrl || tutorial.resources.some(item => item.url === body.sourceUrl), '请选择本篇教程的参考资料。');
          check(body.excerpt == null || typeof body.excerpt === 'string', '引用片段应为文字。');
          const reference = {
            ...(body.sourceUrl && { sourceUrl: body.sourceUrl }),
            ...(body.excerpt?.trim() && { excerpt: body.excerpt.trim() }),
          };
          let answer;
          try {
            answer = await askCodex({ tutorial, message: body.message, history: await progress.list(), ...reference });
          } catch (err) { throw httpError(502, err.message); }
          const event = await progress.append({
            type: 'tutorial-chat', problemId: tutorial.id, question: body.message, answer, ...reference,
          });
          return sendJson(res, { event });
        }
        if (api === '/api/judge' || api === '/api/chat') {
          const problem = byId.get(body.problemId);
          check(problem && typeof body.code === 'string', '请选择题目并提供当前代码。');
          if (api === '/api/judge') {
            const result = await judge(problem, body.code);
            const event = await progress.append({ type: 'submission', problemId: problem.id, code: body.code, result });
            return sendJson(res, { event });
          }
          check(typeof body.message === 'string' && body.message.trim(), '请输入想讨论的问题。');
          let answer;
          try {
            answer = await askCodex({ problem, code: body.code, message: body.message, history: await progress.list() });
          } catch (err) { throw httpError(502, err.message); }
          const event = await progress.append({ type: 'chat', problemId: problem.id, question: body.message, answer });
          return sendJson(res, { event });
        }
      }
      throw httpError(404, '找不到这个页面。');
    } catch (err) {
      if (!err.status) console.error(err);
      if (!res.headersSent) sendJson(res, { error: err.status ? err.message : '读取或保存失败，请查看启动终端的具体错误。' }, err.status || 500);
      else res.end();
    }
  });
  return server;
}

if (require.main === module) {
  const server = createApp();
  const port = Number(process.env.PORT || 4173);
  server.on('error', err => {
    console.error(err.code === 'EADDRINUSE' ? '该端口正在使用，可通过 PORT 环境变量指定另一个端口。' : err.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log('Coding 面试练习室已启动：http://127.0.0.1:' + server.address().port));
}

module.exports = { createApp, pythonStatus };
