const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server/index.cjs');

const format = 'interview-coding-lab.progress';
const at = '2025-06-04T01:02:03.456Z';
const wrap = events => ({ format, version: 1, exportedAt: at, events });
const event = (id, type, rest) => ({ id, type, at, problemId: 'historical-item', ...rest });

async function service(t) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'practice-backup-'));
  const server = createApp({ dataDir });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(dataDir, { recursive: true, force: true });
  });
  const url = 'http://127.0.0.1:' + server.address().port;
  return {
    dump: async () => (await fetch(url + '/api/backup')).json(),
    post: (payload, headers = {}) => fetch(url + '/api/backup/import', {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  };
}

test('保留历史事件和 ID，Pages 格式可双向迁移，多次或同时导入幂等', async t => {
  const local = await service(t);
  const events = [
    event('a', 'draft', { code: 'print("草稿")' }),
    event('b', 'submission', { code: 'return 1', result: {
      status: 'wrong_answer', passed: 0, total: 1, results: [{ passed: false, input: [1], expected: 2, actual: 1 }],
    } }),
    event('c', 'study', { done: true }),
    event('d', 'external', { state: 'review' }),
    event('e', 'review', { checks: ['历史评阅项'] }),
    event('f', 'tutorial-study', { done: false }),
    event('g', 'chat', { question: '问题', answer: '解释' }),
    event('h', 'tutorial-chat', { question: '资料？', answer: '已经讨论。', excerpt: '原文', sourceUrl: 'https://example.org/page' }),
  ];
  const backup = wrap(events);
  const concurrent = await Promise.all([local.post(backup), local.post(backup)]);
  const stats = await Promise.all(concurrent.map(r => { assert.equal(r.status, 200); return r.json(); }));
  assert.deepEqual(stats.sort((a,b) => b.added - a.added), [
    { added: 8, skipped: 0, total: 8 }, { added: 0, skipped: 8, total: 8 },
  ]);
  const exported = await local.dump();
  assert.equal(exported.format, format);
  assert.equal(exported.version, 1);
  assert.ok(Number.isFinite(Date.parse(exported.exportedAt)));
  assert.deepEqual(exported.events, events);
  const fresh = await service(t);
  assert.equal((await fresh.post(exported)).status, 200);
  assert.deepEqual((await fresh.dump()).events, events);
});

test('无效字段、危险键与同 ID 冲突均保留现有数据', async t => {
  const local = await service(t);
  const saved = event('a', 'draft', { code: '<tag>' });
  assert.equal((await local.post(wrap([saved]))).status, 200);
  const next = { ...saved, id: 'b' };
  for (const [payload, status] of [
    [wrap([next, { ...saved, code: '冲突' }]), 409],
    [wrap([next, { ...next, code: '文件内冲突' }]), 409],
    [wrap([next, { ...saved, id: 'c', type: 'submission' }]), 400],
    [wrap([next, { ...saved, id: 'c', sourceUrl: 'javascript:void(0)' }]), 400],
    [JSON.stringify(wrap([next])).replace('"code":','"__proto__":{},"code":'), 400],
    [{ ...wrap([]), version: 20 }, 400], ['{', 400],
  ]) assert.equal((await local.post(payload)).status, status);
  assert.equal((await local.post(wrap([next]), { origin: 'https://example.org' })).status, 403);
  assert.deepEqual((await local.dump()).events, [saved]);
});

test('完整备份可带超过普通提交体积的多字节代码', async t => {
  const local = await service(t);
  const code = '进度记忆'.repeat(360000);
  assert.ok(Buffer.byteLength(code) > 4 * 1024 * 1024);
  const entry = event('large', 'draft', { code });
  assert.deepEqual(await (await local.post(wrap([entry]))).json(), { added: 1, skipped: 0, total: 1 });
  assert.deepEqual((await local.dump()).events, [entry]);
});
