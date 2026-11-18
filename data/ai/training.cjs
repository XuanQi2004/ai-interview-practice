'use strict';

const track = '训练与对齐';
const references = {
  peft: ['PEFT 的 LoRA 配置', 'Hugging Face', '文档', 'https://huggingface.co/docs/peft/main/en/package_reference/lora'],
  lora: ['loralib 的 Linear 实现', 'Microsoft', '开源库', 'https://github.com/microsoft/LoRA/blob/main/loralib/layers.py'],
  loraPaper: ['LoRA: Low-Rank Adaptation of Large Language Models', 'Hu 等', '论文', 'https://arxiv.org/abs/2106.09685'],
  accumulate: ['Performing gradient accumulation with Accelerate', 'Hugging Face', '文档', 'https://huggingface.co/docs/accelerate/usage_guides/gradient_accumulation'],
  accumulationBlog: ['Fixing Gradient Accumulation', 'Hugging Face', '博客', 'https://huggingface.co/blog/gradient_accumulation'],
  clip: ['clip_grad_norm_', 'PyTorch', '文档', 'https://docs.pytorch.org/docs/2.9/generated/torch.nn.utils.clip_grad_norm_.html'],
  schedule: ['Learning Rate Schedules', 'Hugging Face Transformers', '文档', 'https://huggingface.co/docs/transformers/main_classes/optimizer_schedules'],
  optim: ['Optimizers and learning-rate schedulers', 'PyTorch', '文档', 'https://docs.pytorch.org/docs/stable/optim.html'],
  sft: ['SFT Trainer', 'Hugging Face TRL', '文档', 'https://huggingface.co/docs/trl/sft_trainer'],
  chat: ['Chat templates', 'Hugging Face Transformers', '文档', 'https://huggingface.co/docs/transformers/chat_templating'],
  dpo: ['DPO Trainer', 'Hugging Face TRL', '文档', 'https://huggingface.co/docs/trl/dpo_trainer'],
  dpoCode: ['Direct Preference Optimization 参考实现', 'Eric Mitchell 等', '开源库', 'https://github.com/eric-mitchell/direct-preference-optimization'],
  dpoPaper: ['Direct Preference Optimization', 'Rafailov 等', '论文', 'https://arxiv.org/abs/2305.18290'],
  ppo: ['Spinning Up: Proximal Policy Optimization', 'OpenAI', '课程', 'https://spinningup.openai.com/en/latest/algorithms/ppo.html'],
  gae: ['Spinning Up 的 PPOBuffer', 'OpenAI', '开源库', 'https://spinningup.openai.com/en/latest/_modules/spinup/algos/pytorch/ppo/ppo.html'],
  timeLimits: ['Handling Time Limits', 'Farama Foundation', '文档', 'https://gymnasium.farama.org/tutorials/gymnasium_basics/handling_time_limits/'],
  ppoBlog: ['The N Implementation Details of RLHF with PPO', 'Hugging Face', '博客', 'https://huggingface.co/blog/the_n_implementation_details_of_rlhf_with_ppo'],
  grpo: ['GRPO Trainer', 'Hugging Face TRL', '文档', 'https://huggingface.co/docs/trl/grpo_trainer'],
  deepseek: ['DeepSeekMath', 'Shao 等', '论文', 'https://arxiv.org/abs/2402.03300'],
  ddp: ['DistributedDataParallel', 'PyTorch', '文档', 'https://docs.pytorch.org/docs/2.9/generated/torch.nn.parallel.DistributedDataParallel.html'],
  ring: ['Writing Distributed Applications with PyTorch', 'PyTorch', '课程', 'https://docs.pytorch.org/tutorials/intermediate/dist_tuto.html'],
  playbook: ['The Ultra-Scale Playbook', 'Hugging Face', '课程', 'https://huggingface.co/spaces/nanotron/ultrascale-playbook'],
  megatron: ['Megatron Core 的 vocab-parallel cross entropy', 'NVIDIA', '开源库', 'https://github.com/NVIDIA/Megatron-LM/blob/main/megatron/core/ops/loss/cross_entropy.py'],
};

function resource(key, note) {
  const [title, author, kind, url] = references[key];
  return { title, author, kind, url, note };
}

function problem(key, title, topic, difficulty, summary, params, statement, solution, explanation, ref, rubric, examples, extra = {}) {
  const [label, , , url] = references[ref];
  return {
    id: 'ai-' + key, track, category: 'AI 模块', title, topic, difficulty, summary, statement,
    signature: 'solve(' + params + ')',
    starter: 'def solve(' + params + '):\n    raise NotImplementedError\n',
    solution, explanation, source: { label, url }, rubric,
    cases: examples.map(([args, expected]) => ({ args, expected })), ...extra,
  };
}

const log2 = Math.log(2);
const log3 = Math.log(3);
const tiny = 1e-6;
const problems = [
  problem('lora-linear', '实现可训练的 LoRA 线性层', 'LoRA', '中等',
    '冻结一个已有线性层的权重，让两个低秩矩阵通过 autograd 接收梯度。',
    '', '用 PyTorch 实现 LoRALinear(weight, a, b, alpha)。weight 为 [out,in]，a 为 [r,in]，b 为 [out,r]。构造器复制给定初值，基座权重以 self.weight 保存并冻结，将 A、B 注册为名为 self.A、self.B 的可训练参数。forward(x) 对输入最后一维作线性变换 xWᵀ + (alpha/r)(xAᵀ)Bᵀ。本题使用无偏置、无 dropout 的标准 LoRA。评测以输出之和为标量执行 backward，并返回 [输出,dA,dB,基座是否冻结]。',
    `import torch
from torch import nn
from torch.nn import functional as F

class LoRALinear(nn.Module):
    def __init__(self, weight, a, b, alpha):
        super().__init__()
        self.register_buffer('weight', weight.detach().clone())
        self.A = nn.Parameter(a.detach().clone())
        self.B = nn.Parameter(b.detach().clone())
        self.scale = alpha / a.size(0)

    def forward(self, x):
        update = F.linear(F.linear(x, self.A), self.B)
        return F.linear(x, self.weight) + self.scale * update`,
    'F.linear 保持任意批次前缀，仅变换最后一维。两次低秩乘法避免构造完整更新矩阵。A、B 使用 Parameter 后会随模块进入优化器，冻结的基座仍允许梯度传回 x。',
    'lora', ['说清 A、B 的维度与乘法顺序','从 named_parameters() 核对可训练部分','解释 B 全零起步时首步两个矩阵的梯度'], [
      [[[[2,1]],[[1,-1]],[[1,0]],[[3]],1], [[[7]],[[6,3]],[[2]],true]],
      [[[[1,2],[0,1]],[[1,0],[0,1]],[[1,0],[0,1]],[[1,1],[0,2]],1],
        [[[2.5,4],[0.5,2]],[[0.5,1.5],[1.5,4.5]],[[0.5,1.5],[0.5,1.5]],true]],
      [[[[[-2,3]]],[[0,0]],[[1,2]],[[0]],2], [[[[0]]],[[0,0]],[[8]],true]],
    ], { requiresTorch: true, signature: 'LoRALinear(weight, a, b, alpha)',
      starter: 'import torch\nfrom torch import nn\n\nclass LoRALinear(nn.Module):\n    def __init__(self, weight, a, b, alpha):\n        super().__init__()\n        raise NotImplementedError\n\n    def forward(self, x):\n        raise NotImplementedError\n',
      driver: `def run_case(args):
    import torch
    x, w, a, b = [torch.tensor(v, dtype=torch.float64) for v in args[:4]]
    model = LoRALinear(w, a, b, args[4])
    output = model(x)
    output.sum().backward()
    trained = dict(model.named_parameters())
    assert trained.get('A') is model.A and trained.get('B') is model.B
    return [output.detach().tolist(), model.A.grad.tolist(), model.B.grad.tolist(),
            not model.weight.requires_grad and model.weight.grad is None]` }),
  problem('accumulate-token-gradients','按有效样本数累积梯度','梯度累积','中等',
    '用一个可手算的回归模型分别验证变长微批次、尾部窗口和单步参数更新。',
    'initial, microbatches, steps, lr','使用 PyTorch。模型只有标量参数 w，初始为 initial。每个微批次包含若干 [x,y]，每项损失是 (w·x−y)²/2。按 steps 个微批次组成一个更新窗口，最后不足 steps 的部分也组成窗口。每个非空窗口按样本总数平均损失，分别对微批次 backward，随后执行一次 SGD 更新。空微批也占一个窗口位置，全空窗口跳过更新。返回每次更新后的 w 列表。请保持每个微批次独立释放计算图。',
    `import torch

def solve(initial, microbatches, steps, lr):
    w = torch.tensor(float(initial), dtype=torch.float64, requires_grad=True)
    history = []
    for start in range(0, len(microbatches), steps):
        window = microbatches[start:start+steps]
        count = sum(map(len, window))
        if count == 0:
            continue
        w.grad = None
        for batch in window:
            if batch:
                xy = torch.tensor(batch, dtype=w.dtype)
                residual = w * xy[:, 0] - xy[:, 1]
                (residual.square().sum() / (2*count)).backward()
        with torch.no_grad():
            w.sub_(lr * w.grad)
        history.append(w.item())
    return history`,
    '一窗内所有微批共享同一个参数值。先确定窗口中有效样本总数，每个微批次的损失和使用同一分母。PyTorch 把多次 backward 的结果相加，更新后才进入下一窗。',
    'accumulate',['解释不同微批次大小对应的梯度权重','处理末窗、空微批与梯度归零','说明如何推广到按有效 token 计数的语言模型'],
    [[[0,[[[1,2]],[[1,4],[2,1]],[],[[2,1]]],2,0.375],[1,0.25]],
     [[1,[[],[],[[2,0]]],2,0.25],[0]],
     [[0,[[[1,2]],[[1,2]],[[1,2]]],1,0.5],[1,1.5,1.75]],
     [[5,[[],[]],3,0.2],[]]],{requiresTorch:true}),
  problem('global-grad-norm','实现多参数全局梯度裁剪','梯度裁剪','基础',
    '多个参数张量的梯度共同决定一个裁剪比例。',
    'grads, max_norm','grads 的每项是展平后的一组实数梯度，或表示尚无梯度的 None。给定非负 max_norm，求所有已有梯度拼接后的 L2 范数 N，再把每个有效梯度乘以 min(1, max_norm/(N+1e−6))。返回 [裁剪前范数,裁剪后分组]。保留每组形状以及 None。',
    `import math

def solve(grads, max_norm):
    norm = math.sqrt(sum(v*v for group in grads if group is not None for v in group))
    scale = min(1.0, max_norm / (norm + 1e-6))
    output = [None if group is None else [v*scale for v in group] for group in grads]
    return [norm, output]`,
    '首先对各参数的梯度平方求全局和，再用同一因子缩放方向向量。缺失梯度跳过，零梯度保留。混合精度训练通常先还原梯度尺度，再进行裁剪。',
    'clip',['区分全局范数和逐参数范数','说明裁剪前后梯度方向的关系','说明 AMP 中 unscale 与 clip 的先后次序'],
    [[[[[3],null,[-4,0]],2],[5,[[6/(5+tiny)],null,[-8/(5+tiny),0]]]],
     [[[[0,0],[],null],0],[0,[[0,0],[],null]]],[[[[1,-2]],8],[Math.sqrt(5),[[1,-2]]]],[[[null],1],[0,[null]]]]),
  problem('warmup-cosine','实现按更新步计算的余弦学习率','学习率调度','基础',
    '把线性预热、半余弦衰减和训练结束后的学习率连接起来。',
    'updates, warmup, total, peak, floor','对于列表 updates 中各个非负更新步 t，返回学习率。约定 0 ≤ warmup < total，0 ≤ floor ≤ peak。预热期间 t < warmup 时为 peak·t/warmup；在 [warmup,total] 从 peak 按半个余弦周期衰减到 floor，之后保持 floor。t 是已完成的优化器更新数，warmup=0 时 t=0 就取峰值。',
    `import math

def solve(updates, warmup, total, peak, floor):
    rates = []
    for t in updates:
        if t < warmup:
            rate = peak * t / warmup
        elif t >= total:
            rate = floor
        else:
            fraction = (t - warmup) / (total - warmup)
            rate = floor + (peak-floor)*(1+math.cos(math.pi*fraction))/2
        rates.append(rate)
    return rates`,
    '在预热结束与训练结束处分别代入公式，可得峰值与下限。累计梯度时，一个更新窗口只推进一次学习率步数。',
    'schedule',['准确实现三个区间','解释 t 的计数规则','处理无预热且保留最小学习率的情形'],
    [[[[0,1,2,4,6,8],2,6,1,0.2],[0,0.5,1,0.6,0.2,0.2]],
     [[ [0,1,2,3],0,2,2,0],[2,1,0,0]],
     [[[1,3,4],3,4,0.3,0.3],[0.1,0.3,0.3]]]),
  problem('sft-response-labels','为多轮 SFT 构造监督标签','监督微调','中等',
    '把助手回复、padding 和同一行中的样本边界落实到预测位置。',
    'tokens, assistant, segments','三组等长的一维列表描述一行已拼接的序列。tokens 是 token ID，assistant[t] 表示该位置属于助手目标，segments[t] 是所属样本编号，padding 的编号为 −1。实现按 logit 位置对齐的标签列表，长度为 max(0,L−1)。位置 t 预测 tokens[t+1]，仅当其属于助手，且 t 与 t+1 为同一有效样本时保留目标 ID，其余填 −100。EOS 与 padding 可以共用一个 ID。',
    `def solve(tokens, assistant, segments):
    labels = []
    for t in range(len(tokens)-1):
        same_example = segments[t] >= 0 and segments[t] == segments[t+1]
        labels.append(tokens[t+1] if same_example and assistant[t+1] else -100)
    return labels`,
    '助手掩码描述要预测的目标 token，因此读取 t+1 的角色。分段编号排除 padding 以及拼接边界。这里输出已按 logit 对齐的目标，调用模型内部自带 shift 的接口时，应交给该接口执行一次位移。',
    'sft',['标清 logits、labels 和 response mask 的时间轴','区分角色、padding、样本边界','解释 EOS 与 padding 同 ID 时的处理'],
    [[[[10,4,8,2,2],[false,false,true,true,false],[0,0,0,0,-1]],[-100,8,2,-100]],
     [[[5,6,7,8,9],[false,true,true,true,true],[0,0,1,1,1]],[6,-100,8,9]],
     [[[1,2,3,4,5],[false,true,false,true,true],[3,3,3,3,3]],[2,-100,4,5]],
     [[[7],[true],[0]],[]]]),
  problem('dpo-pair-loss','实现有参考模型的 DPO 损失','偏好优化','中等',
    '从成对回答的序列对数概率计算可微损失，并核对梯度方向。',
    'chosen, rejected, ref_chosen, ref_rejected, beta','使用 PyTorch。四个等长非空一维张量分别保存策略、参考模型对偏好回答与非偏好回答的 completion 对数概率和。定义 m=beta·[(chosen−rejected)−(ref_chosen−ref_rejected)]，beta>0。返回标量 −log(sigmoid(m)) 的批平均。保留策略梯度，参考模型分数作为常数。测试输出 [损失,chosen 梯度,rejected 梯度,参考分数是否无梯度]。',
    `import torch.nn.functional as F

def solve(chosen, rejected, ref_chosen, ref_rejected, beta):
    lift = chosen - rejected - (ref_chosen - ref_rejected).detach()
    return -F.logsigmoid(beta * lift).mean()`,
    '同一提示下对两个回答求策略 log-ratio，再减去参考 log-ratio。logsigmoid 在大幅度负 margin 情形下仍给出有限损失。批平均会把每项梯度除以偏好对数。',
    'dpoCode',['解释 chosen 与 rejected 梯度的符号','区分 completion 的和与 token 均值','在大负 margin 时保持数值稳定'],
    [[[[-3],[-3],[-1],[-1],0.4],[log2,[-0.2],[0.2],true]],
     [[[-1,-1-log3],[-1-log3,-1],[-2,-4],[-2,-4],1],[(Math.log(4/3)+Math.log(4))/2,[-0.125,-0.375],[0.125,0.375],true]],
     [[[0],[-2],[0],[-2],1],[log2,[-0.5],[0.5],true]],
     [[[-1000],[0],[0],[0],1],[1000,[-1],[1],true]]],{requiresTorch:true,
    driver:`def run_case(args):
    import torch
    inputs = [torch.tensor(x, dtype=torch.float64, requires_grad=True) for x in args[:4]]
    loss = solve(*inputs, args[4])
    assert loss.ndim == 0
    loss.backward()
    return [loss.item(), inputs[0].grad.tolist(), inputs[1].grad.tolist(),
            all(t.grad is None for t in inputs[2:])]`}),
  problem('gae-boundaries','处理终止与截断的 GAE','强化学习','进阶',
    '多段轨迹放在同一数组里，分别控制价值 bootstrap 与跨步递推。',
    'rewards, values, next_values, terminated, truncated, gamma, lam','五个等长列表按采样时间排列。values[t] 是当前状态价值，next_values[t] 是该步真实后继状态的价值（截断时取重置前的末状态）。terminated 表示环境真正终止，truncated 表示时间限制，两者互斥。用 GAE 算每步优势和价值目标，返回 [advantages,returns]。真正终止时后继价值记 0，截断时保留后继价值。两类轨迹边界均结束优势递推。数组末端的递推初值为 0，returns[t]=advantages[t]+values[t]。',
    `def solve(rewards, values, next_values, terminated, truncated, gamma, lam):
    advantages = [0.0] * len(rewards)
    carry = 0.0
    for t in range(len(rewards)-1, -1, -1):
        bootstrap = 0.0 if terminated[t] else next_values[t]
        delta = rewards[t] + gamma * bootstrap - values[t]
        if terminated[t] or truncated[t]:
            carry = 0.0
        carry = delta + gamma * lam * carry
        advantages[t] = carry
    returns = [a+v for a,v in zip(advantages, values)]
    return [advantages, returns]`,
    'TD 残差决定当前步的修正，GAE 沿同一条轨迹累积后续残差。一个掩码控制后继价值，另一个控制是否接上下一条记录。反向扫描时间 O(T)。',
    'gae',['分别说明 bootstrap 掩码和递推掩码','说明截断时 next_values 的来源','用 λ=0 检查单步 TD 结果'],
    [[[[1,2,4],[1,2,1],[2,3,88],[false,false,true],[false,true,false],0.5,1],[[1.75,1.5,3],[2.75,3.5,4]]],
     [[[1,1],[0,0],[0,9],[false,true],[false,false],1,0.5],[[1.5,1],[1.5,1]]],
     [[[0],[2],[6],[false],[false],0.5,0],[[1],[3]]],
     [[[],[],[],[],[],0.9,0.95],[[],[]]]]),
  problem('ppo-clipped-objective','实现带 token 掩码的 PPO-Clip','强化学习','中等',
    '检查正负优势的裁剪方向，并把 padding 从损失与统计中移除。',
    'logp, old_logp, advantages, mask, epsilon','前四项是等长的一维列表，mask 指示参与更新的采样动作，0 < epsilon < 1。对有效位置计算 r=exp(logp−old_logp)，最大化 min(r·A,clip(r,1−epsilon,1+epsilon)·A)。返回 [待最小化的平均损失,比例超出闭区间的有效位置占比]。全为无效位置时返回 [0,0]；有效位置的 log-ratio 在指数可表示范围内。',
    `import math

def solve(logp, old_logp, advantages, mask, epsilon):
    loss = outside = count = 0
    lower, upper = 1-epsilon, 1+epsilon
    for new, old, a, keep in zip(logp, old_logp, advantages, mask):
        if keep:
            ratio = math.exp(new-old)
            clipped = min(upper, max(lower, ratio))
            loss -= min(ratio*a, clipped*a)
            outside += ratio < lower or ratio > upper
            count += 1
    return [loss/count, outside/count] if count else [0.0,0.0]`,
    '先对概率比裁剪，再把两个候选值分别乘优势并取较小者。优势为负时，概率比偏大对应更负的目标。统计值按有效位置计数，描述概率比越界的比例。',
    'ppo',['写出正、负优势各自的裁剪分支','明确最大化目标与训练损失符号','正确选择有效位置与统计分母'],
    [[[[1.5,1.5,0.5,0.5].map(Math.log),[0,0,0,0],[2,-2,2,-2],[1,1,1,1],0.2],[0.3,1]],
     [[[0,Math.log(1.1),Math.log(0.9),10000],[0,0,0,0],[1,3,-2,99],[1,1,1,0],0.2],[-2.5/3,0]],
     [[[40],[0],[10],[0],0.1],[0,0]],
     [[[-3],[-3],[0],[1],0.1],[0,0]]]),
  problem('grpo-group-advantage','计算 GRPO 的组内优势','强化学习','中等',
    '按提示 ID 归组，处理交错记录、奖励常数和标准差的计算口径。',
    'group_ids, rewards, eps','每个样本是一条生成回答，group_ids 标明提示组，rewards 保存标量奖励，两者等长，组内样本可以不相邻。对每组先减均值，再除以该组的样本标准差（平方差和除以 G−1 再开方）加 eps。单成员或常奖励组的所有优势取 0。返回与输入次序对齐的优势，eps ≥ 0。',
    `from collections import defaultdict
from math import sqrt

def solve(group_ids, rewards, eps):
    groups = defaultdict(list)
    for i, group in enumerate(group_ids):
        groups[group].append(i)
    answer = [0.0] * len(rewards)
    for indices in groups.values():
        if len(indices) < 2:
            continue
        mean = sum(rewards[i] for i in indices)/len(indices)
        deviations = [rewards[i]-mean for i in indices]
        sd = sqrt(sum(d*d for d in deviations)/(len(indices)-1))
        if sd:
            for i,d in zip(indices,deviations):
                answer[i] = d/(sd+eps)
    return answer`,
    '每个提示的候选回答共享一个基线。用索引归组并按原下标写回，可在各组交错时维持样本对应关系。时间和额外空间 O(n)。',
    'grpo',['准确选择 group 维度','说明样本标准差、总体标准差与 eps','分析奖励无差异时的策略梯度'],
    [[[[1,2,1,2],[0,3,2,3],0],[-Math.SQRT1_2,0,Math.SQRT1_2,0]],
     [[[4,4,4],[1,2,3],0],[-1,0,1]],
     [[['a','b','b'],[9,-1,1],0.5],[0,-1/(Math.SQRT2+0.5),1/(Math.SQRT2+0.5)]],
     [[[1,1,1],[4,4,4],0],[0,0,0]]]),
  problem('ddp-token-weighting','修正 DDP 中变长批次的权重','数据并行','中等',
    '让各 rank 的本地均值损失经 DDP 的进程平均后等于全局 token 均值。',
    'local_mean_grads, counts','输入 P 个 rank 分别计算的本地 token 平均梯度向量，向量维度一致，counts[r] 是有效 token 数。每个 rank 在 backward 前可为本地平均损失乘一个标量，最后 DDP 对梯度做跨 rank 算术平均。求各 rank 的缩放系数和最终全局平均梯度，返回 [scales,gradient]。空 rank 的本地梯度给为零向量，全局也为空时约定两项均为零。rank 与梯度维度均至少为 1。',
    `def solve(local_mean_grads, counts):
    workers = len(counts)
    total = sum(counts)
    scales = [workers*c/total if total else 0.0 for c in counts]
    gradient = [sum(s*g for s,g in zip(scales, column))/workers
                for column in zip(*local_mean_grads)]
    return [scales, gradient]`,
    '全局梯度中 rank r 的系数为 nᵣ/Σn。DDP 已除以 P，因此将每个本地均值损失放大为 P·nᵣ/Σn 倍。各 rank 可以通过 sum 规约共享有效 token 总数。',
    'accumulate',['说明本地 mean 与本地 sum 两种输入的尺度','把 DDP 内置的 1/P 纳入推导','处理局部或全局有效 token 数为零'],
    [[[[[2,-2],[6,2]],[1,3]],[[0.5,1.5],[5,1]]],
     [[[[0],[2],[6]],[0,2,1]],[[0,2,1],[10/3]]],
     [[[[0,0],[0,0]],[0,0]],[[0,0],[0,0]]],
     [[[[4,-2]],[9]],[[1],[4,-2]]]]),
  problem('ring-allreduce','实现环形 reduce-scatter 与 all-gather','集合通信','进阶',
    '用同步的相邻 rank 交换，复现梯度 all-reduce 的两个阶段。',
    'partials, exchange','partials[r] 是 rank r 的本地数值向量，P 个向量等长，长度为 P 的正整数倍。每个向量按列连续切为 P 个等长块。提供 exchange(outgoing)，输入各 rank 各自发出的一块，返回每个 rank 从环上前驱 (r−1) mod P 收到的块。用 P−1 轮 reduce-scatter，使 rank r 拥有第 r 块的跨 rank 和；再用 P−1 轮 all-gather，使每个 rank 得到完整的逐元素和。返回 [各 rank 持有的规约块,各 rank 最终向量]。每次传输一个块，P=1 时直接返回。',
    `def solve(partials, exchange):
    p = len(partials)
    size = len(partials[0]) // p
    chunks = [[row[j*size:(j+1)*size] for j in range(p)] for row in partials]
    for step in range(p-1):
        incoming = exchange([chunks[r][(r-1-step)%p] for r in range(p)])
        for r, block in enumerate(incoming):
            j = (r-2-step) % p
            chunks[r][j] = [a+b for a,b in zip(chunks[r][j], block)]
    owned = [chunks[r][r][:] for r in range(p)]
    for step in range(p-1):
        incoming = exchange([chunks[r][(r-step)%p] for r in range(p)])
        for r, block in enumerate(incoming):
            chunks[r][(r-1-step)%p] = block
    vectors = [[v for block in row for v in block] for row in chunks]
    return [owned, vectors]`,
    '第一阶段让每块在环上访问所有 rank，接收者加上该块的本地部分。每个最终块的所有者按 rank 编号固定。第二阶段传递已经规约好的块，接收后覆盖对应位置。每个 rank 共传输 2(P−1) 个块。',
    'playbook',['区分规约阶段的加法和收集阶段的覆盖','画出三个 rank 时每轮块编号','说明通信量随向量长度与 rank 数的变化'],
    [[[[[2,5],[1,-1]]],[[[3],[4]],[[3,4],[3,4]]]],
     [[[[1,2,3],[4,5,6],[7,8,9]]],[[[12],[15],[18]],[[12,15,18],[12,15,18],[12,15,18]]]],
     [[[[2,3,4,5],[1,1,1,1]]],[[[3,4],[5,6]],[[3,4,5,6],[3,4,5,6]]]],
     [[[[7,-2]]],[[[7,-2]],[[7,-2]]]]],{
    driver:`def run_case(args):
    partials, = args
    p, width = len(partials), len(partials[0])//len(partials)
    calls = 0
    def exchange(blocks):
        nonlocal calls
        calls += 1
        if len(blocks) != p or any(len(b) != width for b in blocks):
            raise ValueError("每轮每个 rank 发送一个等长块")
        return [list(blocks[(r-1)%p]) for r in range(p)]
    result = solve(partials, exchange)
    if calls != 2*(p-1):
        raise ValueError("两个通信阶段分别执行 P−1 轮")
    return result`}),
  problem('vocab-parallel-loss','实现词表分片交叉熵与局部梯度','张量并行','进阶',
    '词表分散在多个 rank 时，只用每个样本的规约量计算全局损失与局部梯度。',
    'shards, targets','输入 shards[r][b][j] 是 rank r 的第 b 行、第 j 个本地词项的 logit。各分片按 rank 顺序对应全局连续词表区间，各 rank 的词表宽度可不同。targets 为全局词 ID，−100 表示该行忽略。实现稳定的平均交叉熵和对每个分片 logits 的梯度，返回 [loss,grad_shards]，全忽略时均为 0。请通过行最大值、指数和与目标项的跨分片规约求解，保持词表分片布局。',
    `import math

def solve(shards, targets):
    grad = [[[0.0]*len(row) for row in shard] for shard in shards]
    count = sum(t != -100 for t in targets)
    if count == 0:
        return [0.0, grad]
    loss = 0.0
    for b,t in enumerate(targets):
        if t == -100:
            continue
        m = max(max(shard[b]) for shard in shards)
        z = sum(sum(math.exp(v-m) for v in shard[b]) for shard in shards)
        offset = 0
        for r,shard in enumerate(shards):
            row = shard[b]
            for j,v in enumerate(row):
                grad[r][b][j] = math.exp(v-m) / z / count
            if offset <= t < offset+len(row):
                j = t-offset
                loss += (m-row[j]) + math.log(z)
                grad[r][b][j] -= 1/count
            offset += len(row)
    return [loss/count, grad]`,
    '跨分片得到每行的全局最大值后，所有 rank 的指数使用相同平移。逐行对局部指数和求全局和，目标词由其所属 rank 提供。梯度为局部 softmax 概率减去目标指示，再除以有效行数。',
    'megatron',['给出逐行 MAX、SUM 的通信形状','按全局 ID 准确定位不等宽分片','覆盖极大 logits、忽略标签与均值梯度'],
    [[[[[[2],[0]],[[2,2],[0,0]]],[2,-100]], [log3,[[[1/3],[0]],[[1/3,-2/3],[0,0]]]]],
     [[[[[0],[log3]],[[0],[0]]],[0,1]],[(log2+Math.log(4))/2,[[[-0.25],[0.375]],[[0.25],[-0.375]]]]],
     [[[[[1000,-1000]],[[1000]]],[1]],[2000+log2,[[[0.5,-1]],[[0.5]]]]],
     [[[[[2,0]],[[9]]],[-100]],[0,[[[0,0]],[[0]]]]]]),
];

function lesson(key, title, summary, body, readings, keys, prompts) {
  return {
    id: 'learn-' + key, track, title, summary, body,
    resources: readings.map(([ref,note]) => resource(ref,note)),
    problemIds: keys.map(k => 'ai-' + k), prompts,
  };
}

const tutorials = [
  lesson('lora-training','LoRA 的参数、前向与首步梯度',
    '用单个线性层推导低秩更新，检查冻结权重和零初始化的实际行为。',
    `## 哪些参数接收梯度

设输入 x 有 in 个特征，已有线性层权重 W 的形状为 [out,in]。LoRA 保留 W，额外训练两个矩阵 A[r,in]、B[out,r]。本节使用标准缩放 s=α/r。新增参数数目为 r(in+out)，输出为 xWᵀ + s(xAᵀ)Bᵀ。先执行 xAᵀ 可以避免每次前向都计算一个 [out,in] 的 BA。

## 手算一次反向传播

取 W=[1,−1]、x=[2,1]、A=[1,0]、B=[3]、s=1，基础输出为 1，低秩分支输出为 6，总输出为 7。把标量输出本身当作损失，dB=xAᵀ=2，dA=Bᵀx=[6,3]。把 B 改成 0 后，首步前向与基座完全相同，dA 也为 0；只要 xAᵀ 有信号，B 仍可在首步更新。常见初始化因此选随机 A、零 B。

## 实现与核对

1. 给定矩阵初值，将 A、B 注册为 nn.Parameter，把 W 作为冻结参数或 buffer 保存。使用 named_parameters() 确认可训练对象，检查 state_dict() 包含推理所需的权重。
2. 用两次线性变换完成低秩分支。输入形状从 [batch,in] 换成 [batch,time,in] 后，输出应只在最后一维发生变化。
3. 对输出求和并 backward，对照手算梯度。将模型置于无 dropout 的推理条件，用 W+sBA 做一次单层前向，可测量合并前后的最大绝对误差。

面试讨论时给出目标投影层、秩、缩放及初始化。若使用不同缩放公式或 dropout，应在推导中写出该设置。`,
    [['loraPaper','读第 4 节的低秩参数化及初始化，再推导训练参数量。'],['lora','定位 Linear 的构造、forward 和权重合并，追踪 A、B 的转置。'],['peft','查 LoraConfig 的 r、lora_alpha、target_modules、init_lora_weights。']],
    ['lora-linear'],['请给我一组非方阵 W 和 rank=2 的输入，我口算每步形状后你再纠正。','基座冻结时 x 的梯度从哪些分支返回？请按链式法则追问我。']),
  lesson('sft-supervision','多轮 SFT 中究竟哪些 token 提供监督',
    '从角色与样本边界构造监督标签，再决定平均损失的分母。',
    `## 对齐一次预测与一次监督

因果语言模型在位置 t 输出下一个 token 的分布。监督微调（SFT）可以仅将助手回复设为目标，用户消息仍作为上下文参与注意力。输入和角色信息应来自同一次聊天模板编码，以保持控制符、EOS 与普通正文的 token 位置一致。assistant mask 标注的是目标 token 自己的位置。

## 手算一行标签

设一行 token 为 [10,4,8,2,2]，前两项是提示，8 和第一个 2 是助手回复及其 EOS，最后一个 2 是 padding。四个可对齐的 logit 位置应读取标签 [−100,8,2,−100]。这里 −100 是交叉熵忽略标签。对位置 2 的 logit，目标是继续预测第一个 2；通过 token ID 相等来清理 padding 会连同这个 EOS 一起删除。

将多条序列拼入一行时，再附上每个 token 的样本编号。旧样本最后的 logit 到新样本首 token 的目标也应忽略。注意力是否隔离样本取决于模型的 packing 设置，计算 loss mask 解决的是监督位置。

## 从 token 到训练损失

1. 列出每个位置的输入 token、角色、样本编号和目标 token，然后去掉跨样本、padding 和其余角色的目标。
2. 如果调用的模型 forward 会在内部 shift，传入与输入位置对齐的 labels。若自己写损失函数，在一处显式用 logits 的前 L−1 项与目标的后 L−1 项对齐。
3. 计算有效目标的负对数概率之和，再除以有效目标总数。例如两条回答的损失和为 2 与 9，有效 token 数分别为 1 与 3，则每 token 平均损失为 11/4。`,
    [['sft','读 Train on assistant messages only 与 Train on completion only，留意聊天模板生成标记。'],['chat','读模板的控制符与训练时使用方式，对照模型实际编码的一段对话。'],['accumulationBlog','查 causal LM loss 代码中的 shift 和按有效项计数的归一化。']],
    ['sft-response-labels','accumulate-token-gradients'],['请把一段包含两轮助手回复、EOS 与 padding 的对话变成手算标签题。','我会向你解释 labels 在哪里 shift，请给一个能暴露移动两次的输入。']),
  lesson('optimizer-update','从微批次梯度到一次优化器更新',
    '把梯度累积、全局范数裁剪和学习率调度放回同一个更新窗口。',
    `## 先定义一次更新

微批次指一次前向和反向使用的数据。一个优化器更新窗口可以包含多个微批次。目标若是窗口内的 token 平均损失，就让每个微批次贡献自己的损失和除以同一个有效 token 总数，随后多次 backward，参数值在这一窗内固定。每次反向后，该微批次的计算图可以释放。

## 用可手算的梯度区分三种操作

两个微批次分别包含 1 和 3 个有效项，本地平均标量梯度分别为 2、6。整窗平均梯度等于 (1×2+3×6)/4=5。对微批次均值取算术平均会得到 4，对应另一种样本加权方式。再考虑两个参数的梯度分别为 3、4，它们拼接后的 L2 范数为 5。阈值取 2 时两个梯度都约乘 0.4，得到约 1.2、1.6；这使整体方向保持不变。

## 写出调用顺序

1. 开始窗口时清零梯度，按真实样本数归一化并分次 backward。尾窗样本数由实际输入决定。
2. 使用混合精度且启用梯度缩放时，先 unscale，再对已有梯度求全局范数并裁剪。随后执行优化器更新。
3. 规定学习率序列的步号，按已完成的更新数推进。预热步数为 2、总步数为 6、峰值为 1、下限为 0.2 时，t=0、2、4、6 分别得到 0、1、0.6、0.2。在 API 集成时打印实际用于每次更新的学习率即可核对计数。

把一窗数据合并为完整批次，在确定性模型上比较梯度，可同时发现归一化和清零时机错误。带 BatchNorm 或随机操作的模型需要单独说明批统计量和随机状态。`,
    [['accumulate','重点读 variable size 的 token-level loss 示例，核对总有效项数。'],['clip','查看参数列表的合并范数、原地缩放和返回的裁剪前范数。'],['schedule','查看带 warmup 的 cosine 调度以及最小学习率参数。'],['optim','读 How to adjust learning rate，核对 optimizer.step 与 scheduler.step 的顺序。']],
    ['accumulate-token-gradients','global-grad-norm','warmup-cosine'],['请出一道尾窗只有一个微批、且微批有效项数不同的梯度累积题。','请让我先写 AMP、裁剪、optimizer 与 scheduler 的顺序，再按真实调用分析。']),
  lesson('dpo-preference','从偏好对到可微的 DPO 损失',
    '对同一提示比较两条回复，用参考模型给出的相对偏好校正策略分数。',
    `## 训练样本与分数

每个样本包含提示、偏好回复 chosen 与另一条回复 rejected。给定同一个前缀，把回复中每个实际 token 的条件对数概率相加，得到一条回复的序列分数。本节用经典 sigmoid DPO，采用序列和、固定参考模型及正系数 β。对策略与参考模型分别计算 chosen 分数减 rejected 分数，再将策略差减去参考差并乘 β，得到 margin m。

## 通过一对回复检查符号

取策略分数 −2、−4，参考分数 −3、−4，β=1。策略相对差为 2，参考相对差为 1，因此 m=1，损失 softplus(−1) 约为 0.3133。目标对 chosen 策略分数的导数约为 −0.2689，对 rejected 为 +0.2689。梯度下降会增大两者的分数差。策略与参考给出相同相对差时，m=0，损失为 ln 2。

## 编写与验证

1. 对 prompt 和 padding 使用掩码，把 completion 的 log-prob 按序列求和。拼成 pair 后检查 chosen、rejected 与参考分数是否对应同一个提示。
2. 用 −logsigmoid(m) 再对偏好对取平均。让梯度传到策略，冻结参考分数。大负 margin 的测试可以区别稳定实现与直接取 log(sigmoid(m)) 后下溢的实现。
3. 固定其余三项，增加 chosen 的策略分数，检查损失单调下降。再同时平移同一模型的两项分数，损失应保持不变。

若改为按长度取均值，会改变长短回复的相对分数。请在面试中直接写出所实现的目标函数和单位。`,
    [['dpoPaper','读第 4 节的偏好概率与 DPO 目标，用符号标出策略和参考部分。'],['dpoCode','在 trainers.py 查找 preference_loss 和批量 log-prob 计算。'],['dpo','查 loss_type 中 sigmoid 及训练指标，区分各类偏好损失的配置。']],
    ['dpo-pair-loss','sft-response-labels'],['请给四个 log-prob 分数，暂时隐藏答案，让我算 margin、loss 和梯度方向。','同一 prompt 有一长一短两个回答时，按 token 平均会怎样改变 DPO？请给数字。']),
  lesson('ppo-advantages','从 GAE 的轨迹边界到 PPO 的裁剪目标',
    '把优势估计与策略更新分开推导，并用两个短算例检验实现。',
    `## 一段经验怎样产生优势

状态价值 V(s) 估计从当前状态起的折扣回报。单步时间差分残差为 δₜ=rₜ+γV(sₜ₊₁)−V(sₜ)。环境真正终止时，后继价值按 0 计算。采样受时间上限截断时，仍可用重置前末状态的 V 进行 bootstrap。广义优势估计（GAE）在同一轨迹上反向递推 Aₜ=δₜ+γλAₜ₊₁。遇到终止或截断，下一条记录属于新轨迹，当前递推到此结束。

举例说，某步奖励为 1，当前价值为 2，后继价值为 4，γ=0.5。若该步截断，δ=1；若真正终止，δ=−1。两种情况都应阻断通向下一条新轨迹的优势累加。

## 哪一侧需要裁剪

PPO 用采样时旧策略的 log-prob 和当前策略的 log-prob 构造概率比 r=exp(new−old)。PPO-Clip 目标选 rA 与 clip(r,1−ε,1+ε)A 中较小者。ε=0.2、r=1.5 时，若 A=2，两项为 3 与 2.4，目标取 2.4；若 A=−2，两项为 −3 与 −2.4，目标取 −3。优化器最小化的是上述目标的负数。

## 练习次序

1. 先给每步写出真实后继价值、bootstrap 掩码和延续轨迹的掩码。按逆序递推，用 λ=0 的单步结果作参照。
2. 将采样时的优势和旧对数概率当作常数，计算新策略损失。对语言模型的生成序列，仅在有效动作位置取平均。
3. 同时报告概率比越界比例，并用正负优势各举一例，说明“越界”与“裁剪项决定最终目标”各代表什么。`,
    [['ppo','看 PPO-Clip 的目标和正负优势两种情况的推导。'],['gae','读 PPOBuffer.finish_path 的 last_val 与 GAE 递推。'],['timeLimits','读 Termination 和 Truncation，比较两种边界的 bootstrap。'],['ppoBlog','读 General Implementation Details 中 query 与 response 的拼接，再到 Policy Training Implementation Details 查看对数概率的温度缩放。']],
    ['gae-boundaries','ppo-clipped-objective'],['请给两段拼在一起的 rollout，其中一段因时间限制结束，让我解释两个掩码。','请给四组概率比和正负优势，我来判断哪些位置的策略梯度会饱和。']),
  lesson('grpo-rewards','用同一提示的多条回答计算 GRPO 优势',
    '通过组内比较构造回答级优势，再追踪它如何作用于生成 token。',
    `## 分组单位决定比较对象

对每个提示采样多条回答并分别打分。组内奖励的均值给出当前提示的基线，每条回答减去基线后可再除以组内标准差。这样得到的优势由同一提示下的其他回答共同决定。需要记录提示或生成组的 ID，批处理或重排行为可能让同组样本分散在数组中。

## 手算一组奖励

一组奖励为 [1,2,3]，均值为 2。以样本标准差计算时，平方差和为 2，分母为 G−1=2，标准差为 1。取 eps=0，所得优势为 [−1,0,1]。若另一组是 [5,5]，两个答案都等于本组基线，输出均为 0。给第一组所有奖励加 10 后，其优势保持一致。采用总体标准差时第一组的尺度会变为 √(2/3)，因此题面会明确标准差算法。

## 落到策略训练代码

1. 保留样本原始索引，以 group ID 分桶。算出本组均值和选定尺度后按原索引写回优势。
2. 在使用回答级奖励的版本中，同一回答的有效生成 token 可共享该优势。把回答级优势按 token 维广播，用 response mask 排除提示和 padding。
3. 将其代入所选版本的策略目标。比较每条回答平均、全批 token 平均两种归约的分母，分别推导长回答的总权重。对组内常数奖励检查中心化后的优势是否全为 0。

TRL 支持按组缩放、按批缩放以及仅中心化等设置，阅读具体实现时同时记录奖励缩放和 loss 类型。`,
    [['deepseek','读第 4 节中 group-relative 的策略更新，找出组奖励与参考策略各自的位置。'],['grpo','查 GRPOConfig 的 scale_rewards、loss_type 和 mask_truncated_completions，比较组奖励缩放、损失归约和截断样本的处理。'],['ppo','回顾 PPO-Clip 计算，用同一概率比比较正、负优势。']],
    ['grpo-group-advantage','ppo-clipped-objective'],['请给打乱顺序的两组奖励，让我按原次序返回优势。','请设定两个回答长度分别为 1 和 4，比较按回答与按 token 归约的权重。']),
  lesson('distributed-training','从数据并行梯度平均到词表并行交叉熵',
    '分别追踪跨 rank 的样本权重、梯度块与词表归一化常数。',
    `## 数据分在哪个维度

数据并行让各 rank 持有相同参数、读取不同样本，然后同步梯度。若 rank 0、1 各含 1、3 个有效 token，本地平均梯度分别为 2、6，目标全局平均为 5。默认 DDP 跨两个 rank 取梯度平均，因此各自的本地均值损失可分别乘 0.5、1.5，得到 (1+9)/2=5。相同数据若本地直接求损失和，缩放因子随之改变。

## 分解一次 all-reduce

reduce-scatter 计算逐元素和并将各块留在不同 rank 上，all-gather 再把规约后的块分发给全部 rank。两个 rank 持有 [2,5]、[1,−1]，前一阶段的所有者各自得到 [3]、[4]，后一阶段交换这两个结果后，两者都持有 [3,4]。在 P 个 rank 的环形实现中，每轮向后继发送一个块，同时从前驱接收一个块，每一阶段执行 P−1 轮。第一阶段将收到的块相加，第二阶段写入已经完成的块。

## 词表分片如何算 softmax

张量并行可将同一样本的词表 logits 按列分到不同 rank。对指数运算做稳定化时需要该样本的全局最大 logit，再将各分片的局部指数和做 SUM 规约。目标词属于一个分片，通过全局 ID 与局部起始偏移定位。两个分片的 logits 分别为 [1000]、[1000] 时，总分母在平移后为 2。目标为第一个词时损失为 ln 2，梯度分片为 [−0.5]、[0.5]。

## 实现练习

1. 先将数据并行的小案例拼成完整批次，验证加权后的梯度。
2. 手画三个 rank 两轮发送的块号，再写环形交换，逐块核对规约和。
3. 将同一行 logits 分成不同宽度的词表块，完成分片损失和梯度。改变目标词所在 rank，检查所有分片的梯度之和接近 0，忽略行的梯度均为 0。`,
    [['ddp','查梯度在各 rank 间平均的说明和有关本地损失 sum 的注记。'],['playbook','读 Data Parallelism 与 ZeRO，结合图示跟踪 all-gather 和 reduce-scatter 的张量。'],['ring','读 collective communication 与点对点 ring 示例，核对通信方向。'],['megatron','读 calculate_logits_max、目标 logit 选择、指数和规约与 backward。']],
    ['ddp-token-weighting','ring-allreduce','vocab-parallel-loss'],['当一个 rank 全是 padding，其他 rank 有 3 个有效 token 时，本地平均损失应如何缩放？','请给一个不等宽的两分片词表，要求我写出每个 rank 通信的张量形状与数值。']),
];

module.exports = { problems, tutorials };
