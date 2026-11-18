'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { createProgress } = require('../server/progress.cjs');
const { createApp } = require('../server/index.cjs');
const exec = promisify(execFile);

test('同步仅推送到核实为私有的仓库，可关闭、撤销、跨设备合并', { skip: process.platform === 'win32' }, async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'private-practice-test-'));
  const bin = path.join(root,'bin');
  const bare = path.join(root,'storage.git');
  const settings = path.join(root,'responses.json');
  const log = path.join(root,'git-calls');
  const realGit = (await exec('which',['git'])).stdout.trim();
  await fs.mkdir(bin);
  await exec(realGit,['init','--bare','--quiet',bare]);
  const restore = Object.fromEntries(['PATH','INTERVIEW_SYNC_REPOSITORY','INTERVIEW_SYNC_REMOTE'].map(name => [name,process.env[name]]));
  t.after(async () => {
    for (const [name,value] of Object.entries(restore)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    await fs.rm(root,{recursive:true,force:true});
  });
  await fs.writeFile(path.join(bin,'gh'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args.join(' ') !== 'api --hostname github.com repos/me/records') process.exit(2);
const config = ${JSON.stringify(settings)};
const entries = JSON.parse(fs.readFileSync(config));
const state = entries.shift();
if(entries.length) fs.writeFileSync(config,JSON.stringify(entries));
const visible = state === 'private';
console.log(JSON.stringify({full_name:'me/records', id:3, private:visible, visibility:state,permissions:{push:true}}));
`, {mode:0o700});
  // Mock only the network transport. All branch, merge and local event operations use Git.
  await fs.writeFile(path.join(bin,'git'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2).map(x=>x==='https://github.com/me/records.git' ? ${JSON.stringify(bare)} : x);
if (process.env.GIT_CONFIG_GLOBAL !== ${JSON.stringify(os.devNull)} || process.env.GIT_CONFIG_NOSYSTEM !== '1' || process.env.GIT_ALLOW_PROTOCOL !== 'https') process.exit(7);
fs.appendFileSync(${JSON.stringify(log)},JSON.stringify(args)+'\\n');
const r=require('node:child_process').spawnSync(${JSON.stringify(realGit)},args,{stdio:'inherit',env:{...process.env,GIT_ALLOW_PROTOCOL:'file'}});
process.exit(r.status ?? 1);
`,{mode:0o700});
  process.env.PATH = bin+path.delimiter+process.env.PATH;
  delete process.env.INTERVIEW_SYNC_REPOSITORY;
  process.env.INTERVIEW_SYNC_REMOTE = 'origin';
  const a = createProgress({dataDir:path.join(root,'a')});
  const b = createProgress({dataDir:path.join(root,'b')});
  const study = (id) => ({id,type:'study',problemId:'a',done:true});
  await a.append(study('first'));
  await assert.rejects(a.sync(),/专用私库|个人进度私库/);
  assert.equal((await a.info()).configured,false);
  await assert.rejects(fs.access(log),{code:'ENOENT'});
  await assert.rejects(a.configure('https://github.com/me/records'),/仓库全名/);
  await fs.writeFile(settings,JSON.stringify(['public']));
  await assert.rejects(a.configure('me/records'),/private/);
  await assert.rejects(fs.access(log),{code:'ENOENT'});

  await fs.writeFile(settings,JSON.stringify(['private']));
  await a.configure('me/records');
  await fs.writeFile(settings,JSON.stringify(['private','public']));
  await assert.rejects(a.sync(),/private/);
  assert.doesNotMatch(await fs.readFile(log,'utf8'),/"push"/);
  assert.equal((await a.list()).length,1);
  await fs.writeFile(settings,JSON.stringify(['private']));
  assert.equal((await a.sync()).uploaded,1);
  await b.configure('me/records');
  await b.append(study('second'));
  const merged = await b.sync();
  assert.equal(merged.uploaded,1);
  assert.equal(merged.downloaded,1);
  await a.sync();
  assert.deepEqual(await a.list(),await b.list());
  await a.configure(null);
  assert.equal((await a.info()).configured,false);
  await assert.rejects(a.sync(),/私库/);
});

test('公开网页来源无法读取本机事件或发起本机操作',async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(),'practice-http-'));
  const app=createApp({dataDir});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>app.close(resolve));await fs.rm(dataDir,{recursive:true,force:true});});
  const base='http://127.0.0.1:'+app.address().port;
  const fromPublic=await fetch(base+'/api/events',{headers:{origin:'https://example.github.io'}});
  assert.equal(fromPublic.status,403);
  assert.equal(fromPublic.headers.get('access-control-allow-origin'),null);
  const crossGet=await fetch(base+'/api/events',{headers:{'sec-fetch-site':'cross-site'}});
  assert.equal(crossGet.status,403);
  const fromOtherPort=await fetch(base+'/api/sync',{method:'POST',headers:{origin:'http://127.0.0.1:91','content-type':'application/json'},body:'{}'});
  assert.equal(fromOtherPort.status,403);
  assert.equal((await fetch(base+'/api/events')).status,200);
  assert.equal((await fetch(base+'/app.js')).status,200);
});
