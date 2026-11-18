'use strict';

const track = '学习指南';
const resource = (title, author, kind, url, note) => ({ title, author, kind, url, note });
const gh = (repo, branch, path) => 'https://github.com/' + repo + '/blob/' + branch + '/' + path.split('/').map(encodeURIComponent).join('/');

const tutorials = [
  {
    id: 'learn-choose-ml-coding-exercises', track, title: '从 ML 手写题库挑题',
    summary: '按要练的能力选择数值小题、PyTorch 模块题或组件相连的课程作业。',
    body: `## 想把公式写成正确的数组运算

从 Deep-ML 第 955 题开始。题目用输入 X 同时充当 query、key 和 value，要求计算点积、逐行 softmax 与加权输出。取两行完全相同的 X，在运行前写出每行权重，再说明把行归一化改成列归一化为何有时仍会通过这个例子。换一个各行不同的输入，检查差异。

回到本机的「缩放点积注意力」，分别传入 Q、K、V，让 query 长度取 2、key 长度取 3。此时输出要有两行，每行在三个 key 上分配概率。写下两个题目的接口差异，包括分数的缩放因子。

## 想在张量代码里找出容易写错的轴

TensorTonic 的 Masked Causal Attention 适合练遮罩，Multi-Head Attention 适合练拆头与合并。若上次面试练习错在访问了未来位置，就选前一题；若错在转置后的形状，就选后一题。做完关闭参考实现，在本机的「多头自注意力层」重写一次。为每个 head 造一组不同的 value，便于看出 head 轴和序列轴写反的错误。

## 想把各个层连起来

ARENA 的 Transformer from Scratch 练习本按模块组织。进入 Clean Transformer Implementation 一节，找到 Attention，结合前后模块查看它接收和返回哪一种 residual stream 张量。完成本机 MHA 后再练 GQA，保留 query 头数，将 KV 头数减半，自己写出受影响的两组投影权重形状。外部题适合接触新接口，本机提交历史则可保留每次修正。`,
    resources: [
      resource('Deep-ML 第 955 题 · Simple Self-Attention', 'Deep-ML', '题库',
        'https://www.deep-ml.com/problems/955', '阅读输入 X 与返回 context matrix 的接口，在 Run / Submit 中对照逐行归一化。'),
      resource('Masked Causal Attention', 'TensorTonic', '题库',
        'https://www.tensortonic.com/problems/pytorch-masked-causal-attention', '从整题接口检查张量形状与可见位置，准备一个修改未来 value 的例子。'),
      resource('Multi-Head Attention', 'TensorTonic', '题库',
        'https://www.tensortonic.com/problems/dl-multi-head-attention', '将拆头、跨位置加权、合并头三个步骤逐个对应到本机 MHA。'),
      resource('ARENA · Transformer from Scratch 练习本', 'ARENA', '课程',
        gh('ARENA-education/ARENA_materials','main','chapter1_transformer_interp/exercises/part1_transformer_from_scratch/1.1_Transformer_from_Scratch_exercises.ipynb'),
        '打开 Clean Transformer Implementation，定位 Attention 的练习单元；结合输入与输出检查每次维度变换。'),
    ],
    problemIds: ['ml-full-attention','ml-causal-attention','ml-mha','ml-gqa'],
    prompts: ['请根据我上次提交的形状错误，出一道含不同 query/key 长度的变式，让我先说出输出形状。','假设我的注意力代码在两个相同 token 上通过，请让我设计一个更能区分 softmax 轴的测试。'],
  },
  {
    id: 'learn-chinese-llm-agent', track, title: '用中文从零学 LLM 和 Agent',
    summary: '沿着一个 token 怎样被训练和生成，再到一个工具调用怎样得到结果，选择中文教材章节。',
    body: `## 从一层注意力走到下一词预测

《动手学深度学习》的「多头注意力」把投影、并行头和输出投影放在同一节。阅读时给输入隐维度取 8、头数取 2，写出每头的宽度。回到本机「多头自注意力层」，让实现接收一批短序列，再用答案页核对形状。

Happy-LLM 第五章 5.1.2 讲 RMSNorm，5.1.3.1 展示 repeat_kv。按这个顺序做本机 RMSNorm 和 GQA：先手算向量 [3,4] 的均方为 12.5，再画出四个 query 头怎样共享两组 KV。读到 5.3.3 的 Dataset 时，把 token 序列 [7,4,9] 改写成输入与右移一位的目标，接着做「变长序列的下一词预测损失」，说明哪些预测位置计入平均。

## 从一次模型输出走到一次工具执行

Hello-Agents 第四章的 4.2.2 定义工具，4.2.3 把模型输出、行动和观察接入循环。读完将一个查找请求写成纸面事件，明确调用 ID、工具参数、观察结果和最终答复四项。回到本机「重放 Agent 工具调用」，先输入一次请求，再重复同一个调用 ID，预测观察记录数与工具实际执行次数。

训练方向可沿 Happy-LLM 的 Dataset 与训练章节继续；应用工程方向可沿 Hello-Agents 的工具注册和执行器继续。面试练习时保留一份能独立复述的最小例子，例如两次调用共用一个 ID 的重试轨迹。`,
    resources: [
      resource('《动手学深度学习》· 多头注意力','《动手学深度学习》作者团队','课程',
        'https://zh.d2l.ai/chapter_attention-mechanisms/multihead-attention.html','从多头结构示意图读到 MultiHeadAttention，选择 PyTorch 标签检查输入、转置和输出投影。'),
      resource('Happy-LLM 第五章 · 动手搭建大模型','Datawhale','课程',
        gh('datawhalechina/happy-llm','main','docs/chapter5/第五章 动手搭建大模型.md'),
        '定位 5.1.2、5.1.3.1 和 5.3.3，分别阅读 RMSNorm、repeat_kv 和预训练样本。'),
      resource('Hello-Agents 第四章 · 智能体经典范式构建','Datawhale','课程',
        gh('datawhalechina/hello-agents','main','docs/chapter4/第四章 智能体经典范式构建.md'),
        '阅读 4.2.1 至 4.2.3 的 ReAct 工作流程、工具定义及循环实现，列出每步需要保存的状态。'),
    ],
    problemIds: ['ml-mha','ml-rmsnorm','ml-gqa','ml-next-token-loss','ml-agent-loop'],
    prompts: ['给我一个包含 padding 的三步样本，逐个提问哪些 logits 应与哪些标签比较。','请用一个工具重试的小例子考我，每一步只问一次状态变化，让我自己写最终输出。'],
  },
  {
    id: 'learn-read-llm-implementations', track, title: '沿开源项目读实现',
    summary: '从教学 notebook、单文件 GPT 和课程测试三个角度，练习独立实现及解释设计选择。',
    body: `## 从一段可运行代码还原模块接口

Sebastian Raschka 的第三章 notebook 把单头与多头实现放在同一份文件。搜索 MultiHeadAttention，画出一次 forward 的输入、Q/K/V 投影、head 维和输出。再打开 nanoGPT 的 model.py，搜索 CausalSelfAttention.forward，追踪合在一次线性投影里的 Q、K、V 在哪里分开。把两种投影布局写到纸上，然后在本机 MHA 题中使用题设提供的独立权重。

## 从训练循环定位监督信号

在 nanoGPT 的 model.py 搜索 GPT.forward 和 cross_entropy，再到 train.py 的 get_batch 查 targets 的构造位置。对连续 token [2,5,8,3]，写出输入 [2,5,8] 和目标 [5,8,3]。接着做本机「下一词预测损失」，根据本机题面对齐输入和目标，检查移位究竟发生在哪一层。读 generate 时画出每步送入 forward 的 token 范围，再用本机 KV cache 练习比较逐 token 追加与完整前缀计算的输出。

## 从测试反推实现需要维护的状态

Stanford CS336 的 tests/adapters.py 明确给出 run_rmsnorm、run_multihead_self_attention 和 get_adamw_cls 所需接口。接着读 tests/test_optimizer.py 中的 test_adamw，找出优化器被构造和更新的位置。本机 AdamW 题可用两次更新检查状态：第一次传入非零梯度，第二次传入零梯度，解释历史动量如何影响参数。随后读 nanoGPT 的 configure_optimizers，区分模型为参数选择 weight decay 的逻辑和优化器执行一步更新的逻辑。`,
    resources: [
      resource('LLMs-from-scratch · 第三章主 notebook','Sebastian Raschka','开源库',
        gh('rasbt/LLMs-from-scratch','main','ch03/01_main-chapter-code/ch03.ipynb'),
        '查找 MultiHeadAttentionWrapper 与 MultiHeadAttention，比较多个独立头和批量拆头的写法。'),
      resource('nanoGPT · model.py','Andrej Karpathy','开源库',
        gh('karpathy/nanoGPT','master','model.py'),'依次定位 CausalSelfAttention、GPT.forward、generate 和 configure_optimizers。'),
      resource('nanoGPT · train.py','Andrej Karpathy','开源库',
        gh('karpathy/nanoGPT','master','train.py'),'搜索 get_batch，检查 x 和 y 的采样边界与一步偏移。'),
      resource('CS336 Assignment 1 · 测试适配器','Stanford CS336','课程',
        gh('stanford-cs336/assignment1-basics','main','tests/adapters.py'),'对照 run_rmsnorm、run_multihead_self_attention 与 get_adamw_cls 的输入及返回值。'),
      resource('CS336 Assignment 1 · 优化器测试','Stanford CS336','课程',
        gh('stanford-cs336/assignment1-basics','main','tests/test_optimizer.py'),'阅读 test_adamw，观察如何构造模型、运行更新并比较结果。'),
    ],
    problemIds: ['ml-full-attention','ml-mha','ml-next-token-loss','ml-kv-cache','ml-rmsnorm','ml-adamw'],
    prompts: ['请面试我：一次投影产生 QKV 与三次独立投影，在什么权重排列下结果相同？','给我一条训练循环及一条增量推理的调用顺序，让我指出监督目标、AdamW 状态和 KV 缓存各自属于哪里。'],
  },
];

module.exports = {problems: [], tutorials};
