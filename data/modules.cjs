// Original exercises. Matrix weights follow torch.nn.Linear's [out, in] layout.
const sources = {
  sdpa: { label: "PyTorch · Scaled dot-product attention", url: "https://docs.pytorch.org/docs/2.9/generated/torch.nn.functional.scaled_dot_product_attention.html" },
  mha: { label: "动手学深度学习 · 多头注意力", url: "https://zh.d2l.ai/chapter_attention-mechanisms/multihead-attention.html" },
  gqa: { label: "EMNLP · GQA", url: "https://aclanthology.org/2023.emnlp-main.298/" },
  adam: { label: "PyTorch · AdamW", url: "https://docs.pytorch.org/docs/2.9/generated/torch.optim.AdamW.html" },
  cache: { label: "Transformers · KV cache", url: "https://huggingface.co/docs/transformers/en/cache_explanation" },
  cs336: { label: "Stanford CS336 · Assignment 1", url: "https://github.com/stanford-cs336/assignment1-basics" },
  agent: { label: "Hugging Face · 智能体课程", url: "https://huggingface.co/learn/agents-course/zh-CN/unit1/introduction" },
};
const torchImports = 'import math\nimport torch\n';
function tensorDriver(count) {
  return `def run_case(args):
    import torch
    tensors = [torch.tensor(x, dtype=torch.float64) for x in args[:${count}]]
    result = solve(*tensors, *args[${count}:])
    return result.detach().cpu().tolist()
`;
}
function question(data) {
  return {
    category: "AI 模块", requiresTorch: true,
    starter: torchImports + `\ndef ${data.signature}:\n    raise NotImplementedError\n`,
    ...data,
  };
}
const unit = size => Array.from({length: size}, (_, i) =>
  Array.from({length: size}, (_, j) => Number(i === j)));
const weightedMean = (scores, values) => {
  const max = Math.max(...scores);
  const weights = scores.map(x => Math.exp(x - max));
  const total = weights.reduce((a, b) => a + b, 0);
  return values[0].map((_, j) => weights.reduce((s, w, i) => s + w * values[i][j], 0) / total);
};
const dot = (x, y) => x.reduce((sum, v, i) => sum + v * y[i], 0);
function attentionRow(query, keys, values) {
  return weightedMean(keys.map(key => dot(query, key) / Math.sqrt(query.length)), values);
}
const full = question({
  id: "ml-full-attention", title: "缩放点积注意力", topic: "Attention", difficulty: "基础",
  summary: "实现可处理批量输入和不同 query、key 长度的双向注意力。",
  statement: "q、k、v 是浮点 Tensor，形状分别为 [B,Tq,D]、[B,Tk,D]、[B,Tk,Dv]，各维均为正数。写出无 dropout 的缩放点积注意力，返回 [B,Tq,Dv]。使用基础张量算子，自行计算打分、softmax 和加权和。答题时解释缩放因子和 softmax 的轴。",
  signature: "solve(q, k, v)", driver: tensorDriver(3),
  solution: torchImports + `
def solve(q, k, v):
    dtype = torch.float32 if q.dtype in (torch.float16, torch.bfloat16) else q.dtype
    scores = q.to(dtype) @ k.to(dtype).transpose(-1, -2) / math.sqrt(q.shape[-1])
    return (scores.softmax(dim=-1) @ v.to(dtype)).to(v.dtype)
`,
  explanation: "转置 k 的最后两维后，每个 query 和每个 key 各产生一个标量分数。每行除以头维的平方根，在 key 轴上归一化，再对 value 求加权和。显式分数矩阵需要 B×Tq×Tk 个元素。",
  cases: [
    {args: [[[[0,0]]], [[[1,0],[0,2]]], [[[3],[7]]]], expected: [[[5]]]},
    {args: [[[[1,1],[0,1]]], [[[2,0],[0,1]]], [[[1,4],[3,0]]]], expected: [[[1,1],[0,1]].map(q => attentionRow(q, [[2,0],[0,1]], [[1,4],[3,0]]))]},
    {args: [[[[1000]], [[0]]], [[[1],[2]], [[1],[2]]], [[[2],[9]], [[4],[6]]]], expected: [[[9]],[[5]]]},
  ],
  rubric: ["说明每一步的输入输出形状，并支持 Tq 与 Tk 不同。","解释除以 √D 的原因，使用数值稳定的 softmax。","说明显式分数矩阵的内存如何随序列长度增长。"],
  source: sources.sdpa,
});
const causal = question({
  id: "ml-causal-attention", title: "因果自注意力", topic: "Attention", difficulty: "基础",
  summary: "为自回归模型实现包含当前位置的因果遮罩。",
  statement: "q、k、v 的形状分别为 [B,T,D]、[B,T,D]、[B,T,Dv]。索引从 0 开始，输出位置 i 只聚合位置 0 到 i 的 value。使用基础张量算子自行计算遮罩和缩放点积注意力，返回 [B,T,Dv]，保持输入的浮点精度和设备。",
  signature: "solve(q, k, v)", driver: tensorDriver(3),
  solution: torchImports + `
def solve(q, k, v):
    t = q.shape[1]
    dtype = torch.float32 if q.dtype in (torch.float16, torch.bfloat16) else q.dtype
    scores = q.to(dtype) @ k.to(dtype).transpose(-1, -2) / math.sqrt(q.shape[-1])
    future = torch.ones(t, t, device=q.device, dtype=torch.bool).triu(1)
    weights = scores.masked_fill(future, -torch.inf).softmax(dim=-1)
    return (weights @ v.to(dtype)).to(v.dtype)
`,
  explanation: "严格上三角对应未来的 key。把这些分数设为负无穷后，softmax 将全部概率分给前缀内的位置；对角线保留当前位置。可以改变最后一个 value，验证前面各位置输出保持一致。",
  cases: [
    {args: [[[[0],[0],[0]]], [[[0],[0],[0]]], [[[2],[4],[12]]]], expected: [[[2],[3],[6]]]},
    {args: [[[[1,0],[0,2]]], [[[1,0],[0,2]]], [[[1,2],[3,1]]]], expected: [[[1,2],attentionRow([0,2],[[1,0],[0,2]],[[1,2],[3,1]])]]},
    {args: [[[[2]],[[3]]], [[[1]],[[0]]], [[[7]],[[2]]]], expected: [[[7]],[[2]]]},
  ],
  rubric: ["解释因果遮罩含义，保留对角线。","使用 softmax 之前的遮罩，使有效位置权重之和为 1。","用未来 value 的扰动构造因果性测试。"], source: sources.sdpa,
});

function layerExercise(grouped) {
  const className = grouped ? "GroupedQueryAttention" : "MultiHeadAttention";
  const signature = grouped ? "solve(x, wq, wk, wv, wo, hq, hkv, causal)" : "solve(x, wq, wk, wv, wo, hq, causal)";
  const headArgs = grouped ? "hq, hkv" : "hq";
  const setup = `import math
import torch
from torch import nn

class ${className}(nn.Module):
    def __init__(self, d_model, ${headArgs}):
        super().__init__()
`;
  const wrapper = `
def ${signature}:
    layer = ${className}(x.shape[-1], ${headArgs}).to(x)
    with torch.no_grad():
        for proj, value in zip((layer.q, layer.k, layer.v, layer.out), (wq, wk, wv, wo)):
            proj.weight.copy_(value)
    return layer(x, causal)
`;
  const starter = setup + `        # 注册 q、k、v、out 四个无偏置线性层
        raise NotImplementedError

    def forward(self, x, causal):
        raise NotImplementedError
` + wrapper;
  const impl = setup + `        self.hq = hq
        self.hkv = ${grouped ? "hkv" : "hq"}
        self.head_dim = d_model // hq
        kv_dim = self.hkv * self.head_dim
        self.q = nn.Linear(d_model, d_model, bias=False)
        self.k = nn.Linear(d_model, kv_dim, bias=False)
        self.v = nn.Linear(d_model, kv_dim, bias=False)
        self.out = nn.Linear(d_model, d_model, bias=False)

    def forward(self, x, causal):
        b, t, width = x.shape
        q = self.q(x).reshape(b, t, self.hq, self.head_dim).transpose(1, 2)
        k = self.k(x).reshape(b, t, self.hkv, self.head_dim).transpose(1, 2)
        v = self.v(x).reshape(b, t, self.hkv, self.head_dim).transpose(1, 2)
` + (grouped ? `        group_size = self.hq // self.hkv
        k = k.repeat_interleave(group_size, dim=1)
        v = v.repeat_interleave(group_size, dim=1)
` : "") + `        dtype = torch.float32 if q.dtype in (torch.float16, torch.bfloat16) else q.dtype
        scores = (q.to(dtype) @ k.to(dtype).transpose(-1, -2)) / math.sqrt(self.head_dim)
        if causal:
            future = torch.ones(t, t, device=x.device, dtype=torch.bool).triu(1)
            scores = scores.masked_fill(future, -torch.inf)
        heads = (scores.softmax(dim=-1) @ v.to(dtype)).to(v.dtype)
        return self.out(heads.transpose(1, 2).reshape(b, t, width))
` + wrapper;
  // A scalar, per-head implementation computes expectations independently of the tensor solution.
  function makeCase(x, wq, wk, wv, wo, hq, hkv, causal) {
    const d = x[0][0].length / hq;
    const project = (row, w) => w.map(out => dot(row, out));
    const head = (row, h) => row.slice(h * d, (h + 1) * d);
    const expected = x.map(batch => batch.map((row, t) => {
      const visible = causal ? batch.slice(0,t+1) : batch;
      const outputs = Array.from({length:hq}, (_,h) => {
        const kvHead = Math.floor(h * hkv / hq);
        return attentionRow(head(project(row,wq), h),
          visible.map(row => head(project(row,wk),kvHead)),
          visible.map(row => head(project(row,wv),kvHead)));
      }).flat();
      return project(outputs,wo);
    }));
    return {args: [x,wq,wk,wv,wo,hq,...(grouped ? [hkv] : []),causal], expected};
  }
  const h = grouped ? 4 : 2;
  const kvCount = grouped ? 2 : 4;
  const kWeight = [[0,1,1,0],[1,0,0,2],[2,0,0,1],[0,-1,3,0]].slice(0,kvCount);
  const vWeight = [[-1,0,2,0],[1,0,0,1],[3,0,-1,0],[1,2,0,1]].slice(0,kvCount);
  return question({
    id: grouped ? "ml-gqa" : "ml-mha", title: grouped ? "分组查询注意力层（GQA）" : "多头自注意力层（MHA）",
    topic: "Transformer", difficulty: grouped ? "进阶" : "中等",
    summary: grouped ? "实现带完整投影的 GQA 层，按组共享 K/V。" : "完成四个线性投影、并行拆头、因果遮罩和合头。",
    statement: `补全 PyTorch 的 ${className} 类，入口 solve 已提供。输入 x 为 [B,T,D]，头维 d=D/hq。注册 q、k、v、out 四个无偏置线性层，每个权重的存储顺序是 [输出维,输入维]。${grouped ? "q、out 权重为 [D,D]，k、v 权重为 [hkv*d,D]。hq 是 hkv 的正整数倍，每一组连续 hq/hkv 个 query 头共享同一个 K/V 头。" : "四个权重均为 [D,D]，每个 query 头与同编号的 K/V 头配对。"}在各头内自行实现缩放点积注意力。causal=True 时位置 i 只看 0 到 i，否则看全部位置。按 query 头顺序拼接，经过 out 投影，返回形状 [B,T,D] 的 Tensor。各维均为正数且 D 可被 hq 整除。本题使用零 dropout。`,
    signature, driver: tensorDriver(5), starter, solution: impl,
    explanation: grouped ? "先把 K/V 投影到 hkv×d，将第 g 个 K/V 头对应到连续的一组 query 头。repeat_interleave 便于说明对应关系；真实推理可以由支持 GQA 的注意力内核读取原始 K/V，避免显式复制。在相同 B、T、d 下，缓存元素数相对于 MHA 为 hkv/hq。" : "每个 token 完成四组权重中的 Q/K/V 投影后，将最后一维拆为头数和头维，并移成 [B,H,T,d]。打分和归一化在每个头内独立完成。合头时先还原 [B,T,H,d]，再 reshape 并输出投影。",
    cases: [
      makeCase([[[1,0],[0,2]]], unit(2), grouped ? [[1,0]] : unit(2), grouped ? [[0,1]] : unit(2), unit(2), 2,grouped ? 1 : 2,true),
      makeCase([[[1,0,2,-1],[0,2,1,3],[1,1,0,0]], [[-1,1,2,0],[0,1,2,0],[0,0,1,1]]],
        [[0,1,0,0],[1,2,0,0],[1,0,0,1],[0,0,1,2]],kWeight,vWeight,[[1,2,0,0],[0,0,0,1],[-1,0,1,0],[0,1,0,2]],h,2,false),
      ...(grouped ? [makeCase([[[2,0,1,-1],[1,3,0,2]]],unit(4),unit(4).slice(0,2),unit(4).slice(2),unit(4),2,1,true)] : []),
    ],
    rubric: grouped ? ["说明连续 query 头到 K/V 头的映射，识别简单 repeat 产生的错误顺序。","写全四个可训练投影与因果/双向行为。","推导单层单序列的 KV cache 元素数 2×T×hkv×d，并讨论显式复制的开销。"] : ["注册四组可训练权重，说明权重布局。","用一个两头三 token 的例子解释 transpose 与 reshape 顺序。","检查每头独立归一化、单头维度缩放和输出投影。"],
    source: grouped ? sources.gqa : sources.mha,
  });
}

const adamSignature = "solve(initial, gradients, lr, beta1, beta2, eps, weight_decay)";
const adamWrap = `
def ${adamSignature}:
    parameter = torch.nn.Parameter(initial.clone())
    optimizer = InterviewAdamW([parameter], lr, (beta1, beta2), eps, weight_decay)
    history = []
    for grad in gradients:
        parameter.grad = grad
        optimizer.step()
        history.append(parameter.detach().clone())
    return torch.stack(history)
`;
const adamHeader = `import torch

class InterviewAdamW(torch.optim.Optimizer):
    def __init__(self, params, lr, betas, eps, weight_decay):
        super().__init__(params, dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay))

    @torch.no_grad()
    def step(self):
`;
function adamCase(initial, gradients, lr, b1, b2, eps, decay) {
  let t = 0;
  let value = initial.slice();
  const m = initial.map(() => 0), v = initial.map(() => 0);
  const history = gradients.map(g => {
    if (g !== null) {
      t++;
      value = value.map((p,i) => {
        m[i] = b1 * m[i] + (1-b1) * g[i];
        v[i] = b2 * v[i] + (1-b2) * g[i] ** 2;
        return p * (1-lr*decay) - lr * (m[i] / (1-b1**t)) / (Math.sqrt(v[i]/(1-b2**t)) + eps);
      });
    }
    return value.slice();
  });
  return {args:[initial,gradients,lr,b1,b2,eps,decay], expected:history};
}
const adam = question({
  id: "ml-adamw", title: "带状态的 AdamW 优化器", topic: "优化器", difficulty: "进阶",
  summary: "实现 PyTorch Optimizer 的 step，处理权重衰减、矩估计与跨步状态。",
  statement: "实现 InterviewAdamW.step，自行计算 AdamW 的更新。每个有梯度的参数分别维护时间步、梯度一阶矩、梯度平方的二阶矩。以当前参数做解耦权重衰减，对两个矩做偏置校正，分母为校正后二阶矩的平方根加 eps。本步 grad 为 None 时跳过该参数，零值 Tensor 则正常更新。支持所有参数组内的稠密浮点参数。提供的 solve 用一个向量和逐步给定的梯度返回每步参数快照，梯度列表至少含一项。",
  signature: adamSignature, starter: adamHeader + "        raise NotImplementedError\n" + adamWrap,
  solution: adamHeader + `        for group in self.param_groups:
            lr, (beta1, beta2) = group["lr"], group["betas"]
            for p in group["params"]:
                if p.grad is None:
                    continue
                grad = p.grad
                state = self.state[p]
                if not state:
                    state["t"] = 0
                    state["m"] = torch.zeros_like(p)
                    state["v"] = torch.zeros_like(p)
                state["t"] += 1
                t = state["t"]
                m = state["m"].mul_(beta1).add_(grad, alpha=1-beta1)
                v = state["v"].mul_(beta2).addcmul_(grad, grad, value=1-beta2)
                m_hat = m / (1 - beta1**t)
                v_hat = v / (1 - beta2**t)
                p.mul_(1 - lr * group["weight_decay"])
                p.addcdiv_(m_hat, v_hat.sqrt() + group["eps"], value=-lr)
` + adamWrap,
  driver: `def run_case(args):
    import torch
    p, grads, *opts = args
    grads = [None if g is None else torch.tensor(g, dtype=torch.float64) for g in grads]
    return solve(torch.tensor(p, dtype=torch.float64), grads, *opts).detach().tolist()
`,
  explanation: "梯度决定 m 和 v，权重衰减直接乘在参数上。用各参数自己的 t 消除从零初始化两个矩带来的偏差。将快照 clone 后存入历史记录，避免后续的原地更新改变旧结果。",
  cases: [adamCase([2,-3],[[0,0]],0.1,0.9,0.99,1e-8,0.2),
    adamCase([1,-2],[[2,-1],[-1,3],[0,0]],0.15,0.8,0.9,1e-5,0.1),
    adamCase([0.5],[null,[0.25],null,[-0.75]],0.1,0.5,0.5,0.05,0)],
  rubric: ["对每个参数分别维护 t、m、v，并保留参数组各自的超参数。","区分 grad=None 和零梯度，用多步样例解释权重衰减与偏置校正。","解释 no_grad、原地更新和快照 clone 的作用。"],
  source: sources.adam,
});
const cache = question({
  id:"ml-kv-cache", title:"带 KV cache 的增量解码", topic:"LLM 推理", difficulty:"进阶",
  summary:"处理已有前缀和多个新增 token，用绝对位置构造因果遮罩。",
  statement:"输入单序列单头的新 query、key、value，以及历史缓存 k_old、v_old。q_new 和 k_new 的形状为 [N,D]，v_new 为 [N,Dv]，N≥1；历史缓存为 [P,D] 和 [P,Dv]。空缓存以两个 None 传入。拼接前缀与新增 K/V，对 N 个新位置计算因果缩放点积注意力。返回三个 Tensor 组成的元组 (新位置输出, 更新后的 K, 更新后的 V)。新位置 i 可以访问旧缓存以及新增片段的第 0 至 i 个位置。",
  signature:"solve(q_new, k_new, v_new, k_old, v_old)",
  driver: `def run_case(args):
    import torch
    parsed = [None if x is None else torch.tensor(x, dtype=torch.float64) for x in args]
    return [x.detach().tolist() for x in solve(*parsed)]
`,
  solution:torchImports + `
def solve(q_new, k_new, v_new, k_old, v_old):
    prefix_len = 0 if k_old is None else k_old.shape[0]
    keys = k_new if k_old is None else torch.cat([k_old, k_new], dim=0)
    values = v_new if v_old is None else torch.cat([v_old, v_new], dim=0)
    dtype = torch.float32 if q_new.dtype in (torch.float16, torch.bfloat16) else q_new.dtype
    scores = q_new.to(dtype) @ keys.to(dtype).T / math.sqrt(keys.shape[-1])
    pos_q = prefix_len + torch.arange(q_new.shape[0], device=q_new.device)
    pos_k = torch.arange(keys.shape[0], device=q_new.device)
    scores = scores.masked_fill(pos_k[None, :] > pos_q[:, None], -torch.inf)
    output = (scores.softmax(dim=-1) @ values.to(dtype)).to(values.dtype)
    return output, keys, values
`,
  explanation:"新片段第 i 行的绝对位置是 P+i。以这个偏移遮罩后续 key，得到全序列计算中最后 N 行的结果。动态 cat 便于表达；实际服务可预分配或分页管理缓存，减少每步复制旧数据。",
  cases:[
    {args:[[[0],[0]],[[0],[0]],[[6],[10]],null,null],expected:[[[6],[8]],[[0],[0]],[[6],[10]]]},
    {args:[[[0],[0]],[[0],[0]],[[6],[10]],[[1],[2]],[[2],[4]]],expected:[[[4],[5.5]],[[1],[2],[0],[0]],[[2],[4],[6],[10]]]},
    {args:[[[1,0]],[[1,0]],[[1,2]],[[0,1]],[[3,5]]],expected:[[attentionRow([1,0],[[0,1],[1,0]],[[3,5],[1,2]])],[[0,1],[1,0]],[[3,5],[1,2]]]},
  ],
  rubric:["区分相对位置 i 与绝对位置 P+i。","用 N>1 的输入检查同一新增片段内的因果性。","说明缓存复用省去了哪些计算，以及动态拼接的内存复制成本。"],
  source:sources.cache,
});
const rms = question({
  id:"ml-rmsnorm",title:"RMSNorm 与混合精度",topic:"归一化",difficulty:"基础",
  summary:"沿最后一维计算均方根，并应用可学习的逐通道权重。",
  statement:"x 是形状 [B,T,D] 的浮点 Tensor，weight 是形状 [D] 的 Tensor。计算 y=x / sqrt(mean(x², dim=-1, keepdim=True)+eps) * weight。eps 为正数。对于 float16 或 bfloat16 输入，用 float32 计算平方和均值，最终输出与 x 同 dtype。请用基础张量算子实现。",
  signature:"solve(x, weight, eps)", driver: tensorDriver(2),
  solution:torchImports + `
def solve(x, weight, eps):
    work = x.float() if x.dtype in (torch.float16, torch.bfloat16) else x
    scale = torch.rsqrt(work.square().mean(dim=-1, keepdim=True) + eps)
    return (work * scale * weight).to(x.dtype)
`,
  explanation:"在每个 token 内独立求均方并保留最后一维，以便广播。RMSNorm 保留均值方向；一整行相同非零输入仍有非零输出。半精度累积平方时容易溢出，提升累积精度可以减少误差。",
  cases:[{args:[[[[0,0],[3,3]]],[1,2],7],expected:[[[0,0],[0.75,1.5]]]},
    {args:[[[[2,-2],[0,4]],[[1,1],[3,0]]],[2,-3],1],expected:[[[4/Math.sqrt(5),6/Math.sqrt(5)],[0,-4]],[[Math.SQRT2,-3/Math.sqrt(2)],[6/Math.sqrt(5.5),0]]]}],
  rubric:["沿 feature 轴计算且支持广播，处理全零 token。","说明与 LayerNorm 的均值处理差异。","解释半精度输入的累积精度选择，并保证输出 dtype。"],source:sources.cs336,
});
const loss = question({
  id:"ml-next-token-loss",title:"变长序列的下一词预测损失",topic:"模型训练",difficulty:"中等",
  summary:"对齐 logits 和下一 token 标签，处理 padding 和数值稳定性。",
  statement:"logits 的形状为 [B,T,V]，token_ids 为 [B,T]，填充位置为 -100。位置 t 的分布用来预测 t+1。仅统计相邻两位置都有效的预测，返回所有有效 token 的平均负对数似然标量 Tensor；有效预测数为零时返回与 logits 计算图相连的零。使用 logsumexp 或 log_softmax 自行计算。",
  signature:"solve(logits, token_ids)",
  driver:`def run_case(args):
    import torch
    logits = torch.tensor(args[0], dtype=torch.float64, requires_grad=True)
    labels = torch.tensor(args[1], dtype=torch.long)
    result = solve(logits, labels)
    gradient, = torch.autograd.grad(result, logits)
    if not torch.isfinite(gradient).all():
        raise ValueError("梯度包含非有限值")
    return result.item()
`,
  solution:torchImports+`
def solve(logits, token_ids):
    target = token_ids[:, 1:]
    valid = (token_ids[:, :-1] != -100) & (target != -100)
    if not valid.any():
        return logits[..., :0].sum()
    scores = logits[:, :-1][valid]
    dtype = torch.float32 if scores.dtype in (torch.float16, torch.bfloat16) else scores.dtype
    log_probs = scores.log_softmax(dim=-1, dtype=dtype)
    return -log_probs.gather(1, target[valid].unsqueeze(1)).mean()
`,
  explanation:"用 logits 的前 T−1 个位置预测 token_ids 的后 T−1 个标签。先筛选有效位置，再索引对应词表项，防止把 padding 当作真实类别。以所有有效预测数为分母，每个 token 的权重相同。空切片求和可返回连接计算图的零；半精度 logits 在 FP32 中计算对数概率。",
  cases:[{args:[[[[1000,1001],[0,0],[6,9]]],[[0,1,0]]],expected:(Math.log1p(Math.exp(-1))+Math.log(2))/2},
    {args:[[[[1,9],[0,0],[1,2]],[[-9,2],[4,-4],[1,9]]],[[-100,0,1],[0,1,-100]]],expected:(Math.log(2)+Math.log1p(Math.exp(-11)))/2},
    {args:[[[[3,4]]],[[1]]],expected:0},
    {args:[[[[1e308,1e308]]], [[-100]]],expected:0}],
  rubric:["正确错开输入与标签，并处理左、右 padding。","说明 token 平均与逐序列平均的权重差异。","使用数值稳定的对数概率，空有效集合支持反向传播。"],source:sources.cs336,
});
const agent = question({
  id:"ml-agent-loop",title:"重放 Agent 工具调用",topic:"Agent 工程",difficulty:"中等",
  summary:"根据调用 ID 关联工具观察，缓存重复调用，并在最终答复处终止。",
  statement:'events 是按模型输出顺序排列的字典列表。{"type":"call","id":"…","name":"…","args":{…}} 请求调用工具。工具 lookup 从传入的字典 catalog 按 key 查值；sum 对参数 values 中的整数求和。lookup 找不到 key 或工具名未知时，结果分别为 {"error":"missing_key"}、{"error":"unknown_tool"}。对每个 call 产生一条 {"id":id,"result":结果} 观察记录；重复 ID 复用首次结果，包括错误结果。{"type":"final","text":"…"} 结束重放。返回 {"observations":[…],"final":最终文本或 None,"executions":首次处理的不同调用 ID 数}。事件和已知工具参数形状符合上述约定。使用纯 Python。',
  signature:"solve(events, catalog)",requiresTorch:false,starter:"def solve(events, catalog):\n    raise NotImplementedError\n",
  solution:`def solve(events, catalog):
    results = {}
    observations = []
    final = None
    for event in events:
        if event["type"] == "final":
            final = event["text"]
            break
        call_id = event["id"]
        if call_id not in results:
            args = event["args"]
            if event["name"] == "lookup":
                result = catalog.get(args["key"], {"error": "missing_key"})
            elif event["name"] == "sum":
                result = sum(args["values"])
            else:
                result = {"error": "unknown_tool"}
            results[call_id] = result
        observations.append({"id": call_id, "result": results[call_id]})
    return {"observations": observations, "final": final, "executions": len(results)}
`,
  explanation:"按顺序读取事件，用字典把调用 ID 映射到首次返回值。每次收到 call 都产生观察，执行次数则只统计新 ID。预设的事件序列让测试可重放；接入真实模型时，每次将观察追加到消息列表，再请求模型的下一条行动。",
  cases:[{args:[[{type:"call",id:"a",name:"lookup",args:{key:"service"}},{type:"call",id:"a",name:"lookup",args:{key:"other"}},{type:"final",text:"ready"},{type:"call",id:"b",name:"sum",args:{values:[1]}}],{service:"ready"}],expected:{observations:[{id:"a",result:"ready"},{id:"a",result:"ready"}],final:"ready",executions:1}},
    {args:[[{type:"call",id:"x",name:"lookup",args:{key:"absent"}},{type:"call",id:"y",name:"sum",args:{values:[-2,3]}},{type:"call",id:"z",name:"other",args:{}}],{}],expected:{observations:[{id:"x",result:{error:"missing_key"}},{id:"y",result:1},{id:"z",result:{error:"unknown_tool"}}],final:null,executions:3}},
    {args:[[],{}],expected:{observations:[],final:null,executions:0}}],
  rubric:["使用 call ID 关联观察与首次执行结果。","覆盖重复请求、无 final、未知工具与最终答复后的事件。","说明真实模型客户端和工具注册表如何接入，并讨论副作用工具重试时的幂等性。"],source:sources.agent,
});
module.exports = [full,causal,layerExercise(false),layerExercise(true),adam,rms,loss,cache,agent];
