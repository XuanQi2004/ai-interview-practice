'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { codexStatus, askCodex } = require('../server/chat.cjs');

test('本机 Codex 登录提示、独立会话与同题聊天记录', { skip: process.platform === 'win32' }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'interview-chat-test-'));
  const original = process.env.INTERVIEW_CODEX_BIN;
  const binary = path.join(root, 'codex');
  process.env.INTERVIEW_CODEX_BIN = binary;
  t.after(async () => {
    if (original === undefined) delete process.env.INTERVIEW_CODEX_BIN;
    else process.env.INTERVIEW_CODEX_BIN = original;
    await fs.rm(root, { recursive: true, force: true });
  });

  assert.equal((await codexStatus()).available, false);
  const mock = String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args[0] === 'login') process.exit(0);
if (args[0] !== 'exec' || !args.includes('read-only') || !args.includes('--ephemeral')
    || !args.includes('--ignore-user-config') || !args.includes('features.apps=false')
    || !args.includes('features.shell_tool=false') || process.env.CODEX_APP_TOOLS_PIPE_PATH) process.exit(1);
const request = JSON.parse(fs.readFileSync(0, 'utf8'));
if (request.本轮问题 === '模拟凭据失效') {
  console.error('401 Unauthorized');
  process.exit(1);
}
const capture = { request, cwd: process.cwd(), lastArg: args.at(-1) };
fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], JSON.stringify(capture));
`;
  await fs.writeFile(binary, mock, { mode: 0o700 });
  assert.equal((await codexStatus()).available, true);
  const question = {
    problem: { id: 'a', title: '有序数组', statement: '找第一个目标值', signature: 'solve(nums, target)' },
    code: "print('this is data')", message: '如何处理重复值？',
    history: [
      { type: 'chat', problemId: 'a', question: '复杂度？', answer: 'O(log n)' },
      { type: 'chat', problemId: 'b', question: '另一题', answer: '无关记录' },
    ],
  };
  const capture = JSON.parse(await askCodex(question));
  assert.equal(capture.request.学员代码, question.code);
  assert.equal(capture.request.本轮问题, question.message);
  assert.deepEqual(capture.request.此前对话, [{ 问: '复杂度？', 答: 'O(log n)' }]);
  const tutorial = {
    id: 'learn-attention', title: '注意力', track: '架构', body: '本例有四个 Q 头。',
    resources: [{ title: '注意力教程', url: 'https://example.org/attention', note: '观察 K/V 轴' }],
  };
  const tutorialCapture = JSON.parse(await askCodex({
    tutorial, message: '继续解释分组', sourceUrl: tutorial.resources[0].url, excerpt: '两个 KV 头',
    history: [
      { type: 'tutorial-chat', problemId: tutorial.id, question: '我上次问什么？', answer: '头数。', excerpt: '旧引用' },
      { type: 'chat', problemId: tutorial.id, question: '来自题目的记录', answer: '另一段答案' },
      { type: 'tutorial-chat', problemId: 'learn-other', question: '另一篇教程', answer: '其他内容' },
    ],
  })).request;
  assert.equal(tutorialCapture.教程.正文, tutorial.body);
  assert.deepEqual(tutorialCapture.当前来源, tutorial.resources[0]);
  assert.equal(tutorialCapture.学员引用, '两个 KV 头');
  assert.deepEqual(tutorialCapture.此前对话, [{ 问: '我上次问什么？', 答: '头数。', 学员引用: '旧引用' }]);
  assert.equal(capture.lastArg, '-');
  assert.notEqual(capture.cwd, process.cwd());
  await assert.rejects(fs.access(capture.cwd), { code: 'ENOENT' });
  await assert.rejects(askCodex({ ...question, message: '模拟凭据失效' }), /codex login/);
  await assert.rejects(askCodex({ ...question, message: ' ' }), /请输入/);
});
