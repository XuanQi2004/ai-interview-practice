'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const repo = path.resolve(__dirname, '..');
const url = 'http://127.0.0.1:' + (process.env.PORT || 4174);

async function isRunning() {
  try {
    const reply = await fetch(url + '/api/identity', { signal: AbortSignal.timeout(1000) });
    return reply.ok && (await reply.json()).app === 'ai-interview-practice';
  } catch { return false; }
}

async function openPlatform() {
  if (!await isRunning()) {
    const dir = path.resolve(process.env.INTERVIEW_DATA_DIR || path.join(repo, '.interview-data'));
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const log = fs.openSync(path.join(dir, 'platform.log'), 'a', 0o600);
    const server = spawn(process.execPath, [path.join(repo, 'server', 'index.cjs')], {
      detached: true, cwd: repo, stdio: ['ignore', log, log], windowsHide: true,
    });
    server.unref();
    fs.closeSync(log);
    let running = false;
    for (let attempt = 0; attempt < 40 && server.exitCode === null; attempt++) {
      if (await isRunning()) { running = true; break; }
      await delay(100);
    }
    if (!running) throw new Error('启动失败，请运行 npm start 查看端口或依赖的具体错误。');
  }
  console.log('面试练习室已打开：' + url);
  const [command, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]] : ['xdg-open', [url]];
  const browser = spawn(command, args, { stdio: 'ignore', detached: true });
  browser.on('error', () => console.log('请在浏览器打开 ' + url));
  browser.unref();
}

openPlatform().catch(err => { console.error(err.message); process.exitCode = 1; });
