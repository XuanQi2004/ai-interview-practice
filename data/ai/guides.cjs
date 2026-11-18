'use strict';

const fs = require('node:fs');
const path = require('node:path');
const doc = filename => fs.readFileSync(path.resolve(__dirname, '../../docs', filename), 'utf8');
const track = '学习指南';
const tutorials = [
  {
    id: 'learn-interview-resources', track, title: '中美 AI 岗位面试资源调研',
    summary: '根据英文在线笔试、中文机试、Research Scientist 和 Engineer 面试的不同要求选择练习材料。',
    body: doc('survey.md'),
    resources: [
      {title: 'CS336 · Language Modeling from Scratch', author: 'Stanford University', kind: '课程',
        url: 'https://cs336.stanford.edu/', note: '从第一份作业的分词器、Transformer 和训练实现开始，对照题内模块。'},
      {title: '面试 TOP101', author: '牛客', kind: '题库', url: 'https://www.nowcoder.com/exam/oj',
        note: '按数据结构浏览中文题目，也可在本平台的算法题单直接练完整个 TOP101。'},
    ],
    problemIds: ['ml-mha','ml-adamw','ml-agent-loop'],
    prompts: ['我同时投 Research Scientist 和 Engineer，怎样交替练算法与模块手写？','选一道 MHA 练习，给我一组从实现追问到性能的问题。'],
  },
  {
    id: 'learn-worked-examples', track, title: '手算滑动窗口、GQA、AdamW 和 Agent 调用',
    summary: '用短序列、两步参数更新和一次重试，定位代码中第一处偏离预期的值。',
    body: doc('practice-guide.md'),
    resources: [
      {title: 'The Annotated Transformer', author: 'Sasha Rush，2022 版 Austin Huang 等', kind: '博客',
        url:'https://nlp.seas.harvard.edu/annotated-transformer/', note: '在 Attention 和 Multi-Head Attention 中逐步定位缩放、mask、softmax 和多头拼接，对照站内 MHA 的形状。'},
      {title: 'LLM Powered Autonomous Agents', author: 'Lilian Weng', kind: '博客',
        url:'https://lilianweng.github.io/posts/2023-06-23-agent/', note: '阅读 Tool Use 与 Memory，列出一次工具请求、观察结果和随后调用模型时需要保留的消息。'},
      {title: 'GQA: Training Generalized Multi-Query Transformer Models', author: 'Ainslie 等', kind: '论文',
        url: 'https://aclanthology.org/2023.emnlp-main.298/',note: '看图 2，比较 query 头数相同时 MHA、GQA 与 MQA 的 K/V 头数。'},
      {title: 'AdamW', author: 'PyTorch', kind: '文档',url:'https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html',
        note: '按算法框核对一阶矩、二阶矩和解耦权重衰减的更新顺序。'},
    ],
    problemIds: ['token-window','ml-full-attention','ml-causal-attention','ml-mha','ml-gqa','ml-adamw','ml-agent-loop'],
    prompts: ['用四个 query 头和两个 KV 头，考我每一步张量的形状。','设计一个最小例子，区分零梯度和梯度为 None 的 AdamW 更新。'],
  },
];

module.exports = { tutorials };
