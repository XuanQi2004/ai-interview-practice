'use strict';

const fs = require('node:fs');
const path = require('node:path');
const directory = require('./catalog.json');
const entries = new Map(directory.map(item => [item.id, item]));
const nodeTypes = fs.readFileSync(path.join(__dirname, 'catalog-nodes.py'), 'utf8');

function metadata(item) {
  return {
    id: item.id,
    title: item.title.trim(),
    category: '题单算法',
    catalogExercise: true,
    ...(item.number && { number: item.number }),
    topic: item.topic,
    difficulty: item.difficulty,
    collections: item.collections,
    source: { label: item.id.startsWith('lc-') ? '力扣原题' : '牛客原题', url: item.url },
    rubric: [],
  };
}

// 题单元数据来自同一份目录。题面、参考解、适配代码与用例由各个题包提供。
function q(id, parameters, statement, solution, explanation, examples, options = {}) {
  const item = entries.get(id);
  if (!item) throw new Error('题单中找不到 ID ' + id);
  return {
    ...metadata(item),
    summary: statement.split('\n')[0],
    statement, solution, explanation,
    signature: 'solve(' + parameters + ')',
    starter: 'def solve(' + parameters + '):\n    raise NotImplementedError\n',
    cases: examples.map(([args, expected]) => ({ args, expected })),
    ...options,
    prelude: nodeTypes + '\n' + (options.prelude || ''),
  };
}

function collectCatalogExercises(definitions) {
  const byId = new Map(definitions.map(definition => [definition.id, definition]));
  return directory.map(item => {
    const entry = byId.get(item.id);
    if (!entry) throw new Error('缺少题目实现 ' + item.id);
    if (!entry.alias) return entry;
    const source = byId.get(entry.alias);
    if (!source || source.alias) throw new Error('缺少对应的题目实现 ' + entry.alias);
    const { alias, ...overrides } = entry;
    return { ...source, ...metadata(item), ...overrides };
  });
}

module.exports = { q, collectCatalogExercises };
