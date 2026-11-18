'use strict';

const { constants } = require('node:buffer');
const { isDeepStrictEqual } = require('node:util');

const format = 'interview-coding-lab.progress';
const reserved = new Set(['__proto__', 'prototype', 'constructor']);
const outcomes = new Set(['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'unavailable']);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string';
const nonempty = value => text(value) && value.trim().length > 0;
const count = value => Number.isSafeInteger(value) && value >= 0;
const failure = (status, message) => Object.assign(new Error(message), { status });
function requireField(condition, message) {
  if (!condition) throw failure(400, message);
}

async function readBackupBody(request) {
  requireField(request.headers['content-type']?.split(';')[0].trim().toLowerCase() === 'application/json', '请以 JSON 文件格式导入备份。');
  // Node 的 UTF-8 解码器跨网络分块拼好字符。备份使用运行时字符串容量，可包含多次大体积评测。
  request.setEncoding('utf8');
  let raw = '';
  for await (const chunk of request) {
    if (raw.length + chunk.length > constants.MAX_STRING_LENGTH) {
      throw failure(413, '备份超过当前 Node.js 能读取的单个 JSON 容量，请按事件拆分备份后分别导入。');
    }
    raw += chunk;
  }
  try {
    return JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
  } catch {
    throw failure(400, '请选择包含完整 JSON 内容的备份文件。');
  }
}

function checkJson(root) {
  const pending = [root];
  while (pending.length) {
    const value = pending.pop();
    if (value === null || text(value) || typeof value === 'boolean' || Number.isFinite(value)) continue;
    if (Array.isArray(value)) {
      for (const item of value) pending.push(item);
      continue;
    }
    requireField(record(value), '备份需要使用标准 JSON 数据类型。');
    for (const [key, item] of Object.entries(value)) {
      requireField(!reserved.has(key), '记录含保留字段，请选择平台导出的 JSON 备份。');
      pending.push(item);
    }
  }
}

function checkEvent(event) {
  requireField(record(event) && nonempty(event.id) && nonempty(event.problemId) &&
    text(event.at) && Number.isFinite(Date.parse(event.at)), '记录需要有效的事件 ID、题目或教程 ID 和日期。');
  for (const name of ['code', 'question', 'answer', 'sourceUrl', 'sourceTitle', 'excerpt']) {
    if (Object.hasOwn(event, name)) requireField(text(event[name]), '记录文本字段格式有误。');
  }
  if (event.sourceUrl) {
    const url = URL.canParse(event.sourceUrl) ? new URL(event.sourceUrl) : null;
    requireField(url && ['http:', 'https:'].includes(url.protocol), '出处链接需要使用 HTTP 或 HTTPS 地址。');
  }
  if (Object.hasOwn(event, 'checks')) {
    requireField(Array.isArray(event.checks) && event.checks.every(text), '自评项目需要是字符串列表。');
  }
  switch (event.type) {
    case 'study':
    case 'tutorial-study':
      requireField(typeof event.done === 'boolean', '学习记录需要布尔型完成状态。');
      break;
    case 'draft':
      requireField(text(event.code), '草稿需要代码文本。');
      break;
    case 'external':
      requireField(['new', 'review', 'done'].includes(event.state), '题单标记需要有效的进度状态。');
      break;
    case 'review':
      requireField(Array.isArray(event.checks), '自评记录需要项目列表。');
      break;
    case 'submission': {
      const r = event.result;
      requireField(text(event.code) && record(r) && outcomes.has(r.status) &&
        count(r.passed) && count(r.total) && r.passed <= r.total && Array.isArray(r.results) &&
        r.results.every(item => record(item) && typeof item.passed === 'boolean'), '提交记录需要代码与有效的评测结果。');
      break;
    }
    case 'chat':
    case 'tutorial-chat':
      requireField(text(event.question) && text(event.answer), '讨论记录需要问题和回答。');
      break;
    default:
      throw failure(400, '请选择包含有效学习记录类型的备份。');
  }
}

const conflict = () => failure(409, '相同事件 ID 对应多份内容，原记录已保留。请核对备份。');

function createBackups(progress) {
  let queue = Promise.resolve();

  async function exportProgress() {
    return { format, version: 1, exportedAt: new Date().toISOString(), events: await progress.list() };
  }

  async function merge(backup) {
    requireField(record(backup) && backup.format === format && backup.version === 1 &&
      Array.isArray(backup.events), '请选择本平台版本 1 的学习进度备份。');
    checkJson(backup);
    const existing = await progress.list();
    const byId = new Map(existing.map(event => [event.id, event]));
    const pending = [];
    for (const event of backup.events) {
      checkEvent(event);
      const previous = byId.get(event.id);
      if (previous) {
        if (!isDeepStrictEqual(previous, event)) throw conflict();
      } else {
        byId.set(event.id, event);
        pending.push(event);
      }
    }
    // 完整批次通过格式和冲突检查后才发布。每条记录沿用进度存储的原子追加与 ID 去重。
    for (const event of pending) {
      try { await progress.append(event); }
      catch (error) {
        if (error.message.includes('相同事件 ID')) throw conflict();
        throw error;
      }
    }
    return { added: pending.length, skipped: backup.events.length - pending.length, total: (await progress.list()).length };
  }

  function importProgress(backup) {
    const result = queue.then(() => merge(backup));
    queue = result.catch(() => {});
    return result;
  }

  return { exportProgress, importProgress };
}

module.exports = { createBackups, readBackupBody };
