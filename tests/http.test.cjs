const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { createApp } = require('../server/index.cjs');

test('题库、编辑、提交、原站状态及只限本机访问的 HTTP 接口', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'interview-http-'));
  const server = createApp({ dataDir: dir });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(async () => {
    await new Promise(r => server.close(r));
    await rm(dir, { recursive: true, force: true });
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  const get = async p => (await fetch(base + p)).json();
  const post = (p, body, headers) => fetch(base + p, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const { problems } = await get('/api/problems');
  const { items } = await get('/api/catalog');
  const ids = new Set(problems.map(p => p.id));
  assert.equal(ids.size, problems.length);
  assert.equal(new Set(items.map(p => p.id)).size, items.length);
  const byId = new Map(problems.map(problem => [problem.id, problem]));
  for (const item of items) {
    const exercise = byId.get(item.exerciseId);
    assert.equal(exercise.id, item.id);
    assert.equal(exercise.catalogExercise, true);
    assert.deepEqual(exercise.collections, item.collections);
    assert.ok(exercise.statement && exercise.starter && exercise.solution && exercise.explanation);
    assert.ok(exercise.cases.length > 0);
    assert.equal('prelude' in exercise || 'driver' in exercise, false);
    if (item.localId) assert.ok(ids.has(item.localId));
  }
  const collectionSizes = new Map();
  for (const item of items) for (const c of item.collections) {
    collectionSizes.set(c, 1 + (collectionSizes.get(c) || 0));
  }
  assert.deepEqual([...collectionSizes.values()].sort((a,b) => a-b), [75,100,101,150]);
  for (const [name, size] of collectionSizes) {
    const positions = items.filter(i => i.collections.includes(name)).map(i => i.placements[name].position);
    assert.deepEqual(positions.sort((a,b) => a-b), Array.from({ length: size }, (_, i) => i + 1));
  }
  const problem = byId.get(items[0].exerciseId);
  const postDraft = body => post('/api/events', { type: 'draft', problemId: problem.id, code: body });
  assert.equal((await postDraft('# 草稿')).status, 200);
  const submission = await post('/api/judge', { problemId: problem.id, code: problem.solution });
  assert.equal((await submission.json()).event.result.status, 'accepted');
  assert.equal((await post('/api/events', { type: 'external', problemId: items[0].id, state: 'review' })).status, 200);
  assert.equal((await get('/api/events')).events.length, 3);
  const { tutorials } = await get('/api/tutorials');
  assert.equal(new Set(tutorials.map(lesson => lesson.id)).size, tutorials.length);
  const linked = new Set();
  for (const lesson of tutorials) {
    assert.ok(lesson.body.trim() && lesson.title && lesson.track && lesson.resources.length && lesson.prompts.length);
    assert.ok(lesson.problemIds.length > 0);
    for (const id of lesson.problemIds) { assert.ok(byId.has(id), lesson.id + ' 关联题目 ' + id); linked.add(id); }
    for (const source of lesson.resources) {
      assert.ok(source.author && source.kind && source.note && source.title && /^https?:\/\//.test(source.url));
    }
  }
  for (const p of problems.filter(q => q.category === 'AI 模块')) {
    assert.ok(p.track && linked.has(p.id), '题目应能找到配套教程 ' + p.id);
  }
  const tutorialId = tutorials[0].id;
  assert.equal((await post('/api/events', { type: 'tutorial-study', problemId: tutorialId, done: true })).status, 200);
  assert.equal((await post('/api/tutorial-chat', {tutorialId, message:'提问', sourceUrl:'https://example.org/other'})).status, 400);
  assert.equal((await post('/api/tutorial-chat', {tutorialId: problem.id, message:'提问'})).status, 400);
  assert.equal((await post('/api/tutorial-chat', {tutorialId, message:'提问', excerpt: {text:'引用'}})).status, 400);
  assert.equal((await post('/api/events', { type: 'draft', problemId: 'unknown', code: '' })).status, 400);
  assert.equal((await post('/api/sync', {}, { origin: 'https://example.org' })).status, 403);
  const status = await new Promise((resolve, reject) => {
    require('node:http').get(base + '/api/events', {headers: {host: 'example.org'}}, response => {
      response.resume();
      resolve(response.statusCode);
    }).on('error', reject);
  });
  assert.equal(status, 403);
});
