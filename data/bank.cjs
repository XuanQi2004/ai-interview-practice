'use strict';

const { collectCatalogExercises } = require('./catalog-kit.cjs');
const catalog = require('./catalog.json').map(item => ({ ...item, exerciseId: item.id }));
const exercises = collectCatalogExercises([
  ...require('./packs/lc-a.cjs'),
  ...require('./packs/lc-b.cjs'),
  ...require('./packs/lc-c.cjs'),
  ...require('./packs/lc-d.cjs'),
  ...require('./packs/nowcoder.cjs'),
]);
const aiTopics = [
  require('./ai/fundamentals.cjs'),
  require('./ai/architecture.cjs'),
  require('./ai/training.cjs'),
  require('./ai/inference.cjs'),
  require('./ai/retrieval.cjs'),
  require('./ai/agents.cjs'),
];
const relatedOriginalModules = {
  'learn-online-softmax': ['ml-full-attention', 'ml-causal-attention'],
  'learn-packing-and-masking': ['ml-causal-attention', 'ml-next-token-loss'],
  'learn-feedforward-and-residual': ['ml-rmsnorm', 'ml-mha'],
  'learn-paged-prefix': ['ml-kv-cache', 'ml-gqa'],
  'learn-optimizer-update': ['ml-adamw'],
  'learn-agent-recovery': ['ml-agent-loop'],
};
const tutorials = [
  ...aiTopics.flatMap(topic => topic.tutorials).map(tutorial => ({
    ...tutorial, problemIds: [...tutorial.problemIds, ...(relatedOriginalModules[tutorial.id] || [])],
  })),
  ...require('./ai/reading-paths.cjs').tutorials,
  ...require('./ai/guides.cjs').tutorials,
];
const originalTracks = {
  'ml-adamw': '训练与对齐', 'ml-next-token-loss': '训练与对齐', 'ml-kv-cache': '推理与部署',
  'ml-agent-loop': 'Agent 工程',
};
const originalModules = require('./modules.cjs').map(p => ({
  ...p, track: originalTracks[p.id] || '架构与数据',
}));
const problems = [
  ...require('./algorithms.cjs'),
  ...require('./stdio.cjs'),
  ...originalModules,
  ...aiTopics.flatMap(topic => topic.problems),
  ...exercises,
];

module.exports = { problems, catalog, tutorials };
