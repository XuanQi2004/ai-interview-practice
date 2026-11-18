// 题面、样例、图示数字与参考答案为本地练习编写，来源指向对应算法和实现。
const track = '架构与数据';
const refs = {
  minbpe: ['minbpe · BasicTokenizer', 'Andrej Karpathy', '开源库', 'https://github.com/karpathy/minbpe/blob/master/minbpe/basic.py', '对照 train、encode、decode，观察整数合并次序与字节还原。'],
  bpe: ['LLM Course · Byte-Pair Encoding', 'Hugging Face', '课程', 'https://huggingface.co/learn/llm-course/chapter6/5', '阅读训练语料中的词频加权、合并规则与新词编码示例。'],
  pipeline: ['The tokenization pipeline', 'Hugging Face Tokenizers', '文档', 'https://huggingface.co/docs/tokenizers/en/pipeline', '定位 Normalization 与 Pre-tokenization，区分这些边界和 BPE 合并。'],
  packing: ['Efficient LLM Pretraining: Packed Sequences and Masked Attention', 'Lukas（sirluk）', '博客', 'https://huggingface.co/blog/sirluk/llm-sequence-packing', '查看 attention mask 和 position IDs 的构造代码，对照单条与批量序列。'],
  sft: ['SFT Trainer · Packing', 'Hugging Face TRL', '文档', 'https://huggingface.co/docs/trl/en/sft_trainer', '对读 Packing、Label shifting and masking，明确谁执行标签移位。'],
  rope: ['RoFormer', 'Jianlin Su 等', '论文', 'https://arxiv.org/abs/2104.09864', '查看第 3 节二维旋转构造及其在多维空间的分块形式。'],
  llama: ['Llama · model.py', 'Meta', '开源库', 'https://github.com/meta-llama/llama/blob/main/llama/model.py', '查看 precompute_freqs_cis、apply_rotary_emb、FeedForward.forward 和 TransformerBlock.forward。'],
  glu: ['GLU Variants Improve Transformer', 'Noam Shazeer', '论文', 'https://arxiv.org/abs/2002.05202', '比较 FFN 的两层基线和有两个输入投影的 SwiGLU 公式。'],
  nano: ['nanoGPT · model.py', 'Andrej Karpathy', '开源库', 'https://github.com/karpathy/nanoGPT/blob/master/model.py', '对照 Block.forward 的两条残差和 GPT.__init__ 中词嵌入与 lm_head 共享权重的实现。'],
  raschka: ['Build a Large Language Model · Chapter 4', 'Sebastian Raschka', '开源库', 'https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/gpt.py', '阅读 TransformerBlock.forward 里的 shortcut、归一化和加法顺序。'],
  illustrated: ['The Illustrated Transformer', 'Jay Alammar', '博客', 'https://jalammar.github.io/illustrated-transformer/', '阅读 The Residuals 图以及 The Final Linear and Softmax Layer，两图分别展示残差路径与词表投影。'],
  tying: ['Using the Output Embedding to Improve Language Models', 'Ofir Press、Lior Wolf', '论文', 'https://aclanthology.org/E17-2025/', '阅读输入、输出词表矩阵共享时，同一参数受到的两类梯度贡献。'],
  moe: ['Mixture of Experts Explained', 'Omar Sanseviero 等', '博客', 'https://huggingface.co/blog/moe', '阅读 What is Sparsity? 与 Load balancing tokens for MoEs，区分选择数量、容量和实际分配次数。'],
  mixtral: ['Mixtral of Experts', 'Albert Q. Jiang 等', '论文', 'https://arxiv.org/html/2401.04088', '阅读 2.1 Sparse Mixture of Experts 的稀疏专家层公式，分清门控权重与专家输出。'],
};
function resource(key) {
  const [title, author, kind, url, note] = refs[key];
  return {title, author, kind, url, note};
}
function problem(slug, title, topic, difficulty, summary, spec, args, solution, explanation, examples, ref, rubric, opts = {}) {
  const [label,,,url] = refs[ref];
  const signature = 'solve(' + args + ')';
  return {
    id: 'ai-' + slug, category: 'AI 模块', track, topic, difficulty, title, summary,
    statement: spec, signature, starter: (opts.requiresTorch ? 'import torch\n\n' : '') +
      'def ' + signature + ':\n    raise NotImplementedError\n',
    solution, explanation, source: {label, url}, rubric,
    cases: examples.map(([args, expected]) => ({args, expected})), ...opts,
  };
}
function lesson(slug, title, summary, body, keys, ids, prompts) {
  return {
    id: 'learn-' + slug, track, title, summary, body, resources: keys.map(resource),
    problemIds: ids.map(s => 'ai-' + s), prompts,
  };
}
const mergeFunction = `def merge_once(tokens, pair, new_id):
    out = []
    i = 0
    while i < len(tokens):
        if i + 1 < len(tokens) and (tokens[i], tokens[i+1]) == pair:
            out.append(new_id)
            i += 2
        else:
            out.append(tokens[i])
            i += 1
    return out
`;
const train = problem('byte-bpe-train','训练字节级 BPE','分词','中等','在独立文档内统计相邻字节对，多轮学习合并表。',
  'documents 是字符串列表，使用 UTF-8 字节作为初始 token（ID 0 到 255）。每轮汇总各文档内部所有相邻 token 对的出现次数，重叠位置参与统计；选频数最高的 pair，平局取 ID 二元组字典序最小者。每份文档从左至右替换互不重叠的该 pair。新 ID 从 256 递增。最多执行 steps 轮，已无相邻对时结束。返回按学习顺序排列的 [[左ID,右ID],...]，文档可以为空。',
  'documents, steps',`from collections import Counter

${mergeFunction}
def solve(documents, steps):
    docs = [list(text.encode("utf-8")) for text in documents]
    merges = []
    for _ in range(steps):
        counts = Counter(pair for doc in docs for pair in zip(doc, doc[1:]))
        if not counts:
            break
        pair = min(counts, key=lambda p: (-counts[p], p))
        docs = [merge_once(doc, pair, 256 + len(merges)) for doc in docs]
        merges.append(list(pair))
    return merges`,
  '每轮按当前 token 序列重新计数，再从左向右替换。设初始字节数 N、执行轮数 R，朴素实现耗时 O(RN)，工作空间 O(N)，输出空间 O(R)。',
  [[[['aaaa','aba'],3],[[97,97],[97,98],[256,256]]],[[['a','b',''],5],[]],[[['éé'],3],[[195,169],[256,256]]],[[['uvuv'],0],[]]],'minbpe',
  ['解释重复相邻对的重叠计数和非重叠替换。','以两份单字节文档验证边界。','说明 UTF-8 字节与字符码点的差别。']);
const encode = problem('byte-bpe-encode','用合并表编码文本','分词','中等','应用既定 BPE 规则，处理次序冲突和多字节字符。',
  'text 为 Unicode 字符串，merges 是有效的 BPE 学习表，第 r 项 [左ID,右ID] 的新 ID 是 256+r（r 从 0 开始），且只引用初始字节和更早产生的 ID。从 UTF-8 字节序列开始，每次选择当前出现且排名最靠前的规则，从左到右合并它的所有互不重叠出现。返回最终整数 ID 列表。空文本返回空列表。',
  'text, merges',mergeFunction+`
def solve(text, merges):
    tokens = list(text.encode("utf-8"))
    for i, pair in enumerate(merges):
        tokens = merge_once(tokens, tuple(pair), 256 + i)
    return tokens`,
  '每条规则引用前面产生的 ID，后续合并产生的全是较新的 ID；新 token 无法成为已扫规则的输入。因此按表扫描一遍等价于反复选当前最高优先级。R 条规则、N 个字节耗时 O(RN)，额外空间 O(N)。',
  [[['abcab',[[98,99],[97,98],[97,256]]],[258,257]],[['aaaaa',[[97,97],[256,256]]],[257,97]],[['中!',[]],[228,184,173,33]],[['',[]],[]]],'bpe',
  ['按规则的 rank 处理共享 token 的候选 pair。','用奇数长度连续重复串检查替换方向。','解释为什么后续规则无法再次产生早期规则需要的旧 token。']);

const pack = problem('pack-independent-docs','打包独立训练文档','训练数据','中等','把完整文档按顺序装入定长行，并显式构造段号和训练标签。',
  'docs 是原始 token ID 列表的列表（元素非负）。给每份文档末尾附一个 eos，空文档得到单独一个 eos。width 为正，每份文档加 eos 后均能放进一行。保持文档顺序，当前行还能完整容纳下一份就追加，否则新开一行，最后用 pad 右填充。返回行字典列表，每行有 ids、seg、pos、labels 四个等长整数列表。seg 是文档在 docs 的全局下标，填充值 −1；pos 在每篇内从 0 起算，填充值 0；labels[i] 直接表示该位置应预测的同文档下一个 token，EOS 结尾与 padding 为 −100。docs=[] 时返回 []。',
  'docs, width, eos, pad',`def solve(docs, width, eos, pad):
    rows = []
    for doc_id, doc in enumerate(docs):
        tokens = doc + [eos]
        if not rows or len(rows[-1]["ids"]) + len(tokens) > width:
            rows.append({"ids": [], "seg": [], "pos": [], "labels": []})
        row = rows[-1]
        row["ids"].extend(tokens)
        row["seg"].extend([doc_id] * len(tokens))
        row["pos"].extend(range(len(tokens)))
        row["labels"].extend(tokens[1:] + [-100])
    for row in rows:
        missing = width - len(row["ids"])
        for key, value in (("ids", pad), ("seg", -1), ("pos", 0), ("labels", -100)):
            row[key].extend([value] * missing)
    return rows`,
  '先记录文档边界，再做同文档的标签移位。用 seg 判定 padding，即使 eos 与 pad 使用同一 ID 也能区分。所有工作与输出元素数成正比。',
  [[[[[4,2],[8]],5,9,0],[{ids:[4,2,9,8,9],seg:[0,0,0,1,1],pos:[0,1,2,0,1],labels:[2,9,-100,9,-100]}]],
   [[[[],[4,6],[]],3,7,7],[{ids:[7,7,7],seg:[0,-1,-1],pos:[0,0,0],labels:[-100,-100,-100]},{ids:[4,6,7],seg:[1,1,1],pos:[0,1,2],labels:[6,7,-100]},{ids:[7,7,7],seg:[2,-1,-1],pos:[0,0,0],labels:[-100,-100,-100]}]],
   [[[],1,9,0],[]]],'sft',['保持输入文档顺序，每篇的 EOS 和位置编号正确。','解释 labels 已移位时损失函数如何接收。','用 EOS 与 pad 共用 ID 的样例检查边界。']);
const mask = problem('packed-causal-mask','分段因果与滑窗遮罩','训练数据','基础','为打包训练行生成文档隔离的布尔 attention mask。',
  'segment_ids 是长度 T 的一行段号，同一文档占一个连续片段，−1 表示右侧 padding。window 为正整数。返回 T×T 的布尔列表，第 i 行第 j 列为 True 当且仅当 i 和 j 属于同一有效文档、j≤i 且 i−j<window。True 表示允许 query i 读取 key j；padding 的行和列均为 False。',
  'segment_ids, window',`def solve(segment_ids, window):
    return [[seg >= 0 and seg == other and 0 <= i-j < window
             for j, other in enumerate(segment_ids)]
            for i, seg in enumerate(segment_ids)]`,
  '文档、因果与滑窗三个条件取交集。显式矩阵时间与空间均为 O(T²)。真实训练可传输各文档长度，用支持变长序列的内核避免物化整张矩阵。',
  [[[[3,3,4,-1],3],[[true,false,false,false],[true,true,false,false],[false,false,true,false],[false,false,false,false]]],[[[5,5,5],2],[[true,false,false],[true,true,false],[false,true,true]]],[[[-1],1],[[false]]]],'packing',
  ['说明行对应 query、列对应 key。','验证窗口包含当前 token，跨段列均被屏蔽。','说明全屏蔽的 padding 行进入 softmax 时应如何处理。']);

function torchArgs(n, countLong = []) {
  return `def run_case(args):
    import torch
    converted = [torch.tensor(value, dtype=torch.long if i in ${JSON.stringify(countLong)} else torch.float64)
                 for i, value in enumerate(args[:${n}])]
    differentiable = [v.requires_grad_() for v in converted if v.is_floating_point()]
    result = solve(*converted, *args[${n}:])
    if result.dtype != differentiable[0].dtype:
        raise ValueError("输出应保持输入的浮点精度")
    gradients = torch.autograd.grad(result.sum(), differentiable)
    if not all(torch.isfinite(g).all() for g in gradients):
        raise ValueError("梯度应为有限值")
    return result.detach().tolist()`;
}
const rotation = (x,p,base) => {
  const out=[];
  for(let d=0;d<x.length;d+=2) {
    const phase=p*base**(-d/x.length), c=Math.cos(phase),s=Math.sin(phase);
    out.push(x[d]*c-x[d+1]*s,x[d]*s+x[d+1]*c);
  }
  return out;
};
function ropeCase(x,pos,base) {
  return [[x,pos,base],x.map((batch,b)=>batch.map(head=>head.map((v,t)=>rotation(v,pos[b][t],base))))];
}
const rope = problem('rotary-position-embedding','相邻维度配对的 RoPE','位置编码','中等','在指定位置旋转各个注意力头的相邻通道。',
  'x 是 [B,H,T,D] 浮点 Tensor，D 为正偶数；positions 是 [B,T] 的非负整数 Tensor，base>1。对每个位置 p，将相邻的维度 (2i,2i+1) 视为二维列向量，逆时针旋转 p·base^(−2i/D) 弧度，i 从 0 起。每个头使用同一组位置。返回形状与 dtype 等同 x 的 Tensor，保留梯度。',
  'x, positions, base',`import torch

def solve(x, positions, base):
    d = x.shape[-1]
    dtype = torch.float32 if x.dtype in (torch.float16, torch.bfloat16) else x.dtype
    frequency = base ** (-torch.arange(0, d, 2, device=x.device, dtype=dtype) / d)
    angles = positions.to(device=x.device, dtype=dtype)[:, None, :, None] * frequency
    cos, sin = angles.cos(), angles.sin()
    even, odd = x[..., ::2], x[..., 1::2]
    paired = torch.stack((even*cos - odd*sin, even*sin + odd*cos), dim=-1)
    return paired.flatten(-2).to(x.dtype)`,
  'angles 的形状 [B,1,T,D/2] 会广播至全部头。每对通道按同一角度做二维旋转，位置零为恒等映射。半精度输入用 FP32 计算频率和相位，可区分 BF16 在较长上下文中会舍入到同一个数的相邻位置。计算量 O(BHTD)。',
  [ropeCase([[[[1,2]]]],[[0]],100),ropeCase([[[[1,0,1,0],[0,1,0,1]],[[2,3,4,5],[-1,2,0,1]]]],[[1,3]],100),
   ropeCase([[[[2,1]]],[[[-1,4]]]],[[2],[5]],10000)],'rope',['区分相邻配对与前后半维配对的张量布局。','核对 batch/head 广播与非零 position offset。','说明旋转保持每对通道的欧氏范数。'],
  {requiresTorch:true,driver:torchArgs(2,[1])});

const silu = x=>x/(1+Math.exp(-x));
const dot = (row,vector)=>row.reduce((s,value,i)=>s+value*vector[i],0);
function gluCase(x,gate,up,down) {
  const ref=x.map(batch=>batch.map(row=>{
    const h=gate.map((g,i)=>silu(dot(g,row))*dot(up[i],row));
    return down.map(w=>dot(w,h));
  }));
  return [[x,gate,up,down],ref];
}
const glu = problem('swiglu-feedforward','SwiGLU 前馈层','Transformer','中等','独立实现 gate、up、down 三个投影和逐元素门控。',
  'x 是 [B,T,D] 的浮点 Tensor。w_gate、w_up 的形状均为 [F,D]，w_down 为 [D,F]，即 torch.nn.Linear 的 [out,in] 布局。所有投影无偏置。计算同一输入的两个 F 维投影，对 gate 使用 SiLU(z)=z·sigmoid(z)，逐元素乘以 up，再经 down 返回 [B,T,D]，保留梯度。F 可与 D 不同。',
  'x, w_gate, w_up, w_down',`import torch.nn.functional as F

def solve(x, w_gate, w_up, w_down):
    gate = F.silu(F.linear(x, w_gate))
    value = F.linear(x, w_up)
    return F.linear(gate * value, w_down)`,
  '两路投影接收同一个 x。逐元素相乘在 F 维完成，再投影回 D，便于与残差分支相加。排除偏置时，参数数目是 3DF。',
  [gluCase([[[1,-2],[0,0]]],[[1,1],[0,-1],[2,0]],[[0,2],[1,1],[-1,0]],[[1,0,2],[0,-1,1]]),
   gluCase([[[1]],[[2]]],[[0]],[[2]],[[9]]),gluCase([[[1]]],[[2]],[[-1]],[[3]])],'glu',
  ['把三个投影写成各自的矩阵乘法，确认转置方向。','说明 SiLU 作用于哪条支路。','比较隐藏宽度相同的普通两层 FFN 和 SwiGLU 的参数量。'],
  {requiresTorch:true,driver:torchArgs(4)});
const blockStarter = `import torch
from torch import nn

class PreNormBlock(nn.Module):
    def __init__(self, norm1, attention, norm2, ffn):
        super().__init__()
        # 注册传入的四个子模块
        raise NotImplementedError

    def forward(self, x):
        raise NotImplementedError

def solve(x, norm1, attention, norm2, ffn):
    return PreNormBlock(norm1, attention, norm2, ffn)(x)
`;
const blockReference = `from torch import nn

class PreNormBlock(nn.Module):
    def __init__(self, norm1, attention, norm2, ffn):
        super().__init__()
        self.norm1 = norm1
        self.attention = attention
        self.norm2 = norm2
        self.ffn = ffn

    def forward(self, x):
        hidden = x + self.attention(self.norm1(x))
        return hidden + self.ffn(self.norm2(hidden))

def solve(x, norm1, attention, norm2, ffn):
    return PreNormBlock(norm1, attention, norm2, ffn)(x)`;
const blockDriver = `def run_case(args):
    import torch
    from torch import nn
    from torch.nn import functional as F
    class Attention(nn.Module):
        def forward(self, x):
            return F.scaled_dot_product_attention(x, x, x, is_causal=True)
    class FeedForward(nn.Module):
        def forward(self, x):
            return F.silu(x) * x
    x = torch.tensor(args[0], dtype=torch.float64, requires_grad=True)
    kwargs = {"normalized_shape": x.shape[-1], "eps": 1e-5, "dtype": x.dtype}
    n1, attn, n2, ffn = nn.LayerNorm(**kwargs), Attention(), nn.LayerNorm(**kwargs), FeedForward()
    with torch.no_grad():
        n2.weight.fill_(0.5)
        n2.bias.fill_(0.25)
    block = PreNormBlock(n1, attn, n2, ffn)
    if not all(m in set(block.modules()) for m in (n1, attn, n2, ffn)):
        raise ValueError("请将传入的所有子模块注册至 block")
    out = block(x)
    grads = torch.autograd.grad(out.sum(), (x, n1.weight, n2.weight))
    if not all(torch.isfinite(g).all() for g in grads):
        raise ValueError("反向传播产生非有限值")
    return out.detach().tolist()`;
function norm(row) {
  const mean=row.reduce((s,v)=>s+v,0)/row.length;
  const std=Math.sqrt(row.reduce((s,v)=>s+(v-mean)**2,0)/row.length+1e-5);
  return row.map(v=>(v-mean)/std);
}
function blockCase(input) {
  const expected=input.map(sequence=>{
    const normalized=sequence.map(norm);
    return sequence.map((row,i)=>{
      const visible=normalized.slice(0,i+1);
      const logits=visible.map(k=>dot(k,normalized[i])/Math.sqrt(k.length));
      const exps=logits.map(v=>Math.exp(v-Math.max(...logits))),denom=exps.reduce((s,v)=>s+v,0);
      const h=row.map((v,j)=>v+visible.reduce((s,k,t)=>s+k[j]*exps[t]/denom,0));
      const n2=norm(h).map(v=>0.5*v+0.25);
      return h.map((v,j)=>v+silu(n2[j])*n2[j]);
    });
  });
  return [[input],expected];
}
const block = problem('pre-norm-decoder-block','组装 Pre-Norm Decoder Block','Transformer','中等','实现可注册参数、可反向传播的两条残差分支。',
  '实现 PyTorch 类 PreNormBlock(norm1, attention, norm2, ffn)，四个参数均为已构造的 nn.Module，输入输出均为 [B,T,D]。注册并复用这些对象。先将 norm1(x) 送入 causal attention，把结果加回原始 x；再对更新后的隐状态施加 norm2 和 ffn，把结果加回该隐状态。保留梯度。评测直接构造类并调用 forward；样例仅展示 x，评测提供两组 LayerNorm、单头因果自注意力和逐元素前馈分支。',
  'x, norm1, attention, norm2, ffn',blockReference,
  '残差旁路保存归一化前的输入。第二个子层使用第一次相加后的新状态。注册子模块后，训练时 parameters()、to(device) 和 state_dict() 会递归处理它们。',
  [blockCase([[[2,2]]]),blockCase([[[1,2],[3,-2],[0,1]]]),blockCase([[[1,-1,3]],[[0,0,0]]])],'nano',
  ['指出两个归一化各自读取的张量。','把四个传入模块注册为子模块，检查梯度流向。','解释关闭两个残差分支时 block 的输出。'],
  {signature:'PreNormBlock(norm1, attention, norm2, ffn)',starter:blockStarter,requiresTorch:true,driver:blockDriver});

function tiedCase(ids,table,delta) {
  const out=ids.map((seq,b)=>seq.map((id,t)=>{
    const h=table[id].map((v,d)=>v+delta[b][t][d]);
    return table.map(row=>dot(row,h));
  }));
  return [[ids,table,delta],out];
}
const tied = problem('tied-vocabulary-projection','共享词嵌入与词表投影','词表投影','中等','让同一份词表权重同时参与输入查表和 logits 计算。',
  'ids 是 [B,T] 的整数 Tensor；weight 是可训练的 [V,D] 浮点 Tensor；delta 是 [B,T,D] 的浮点 Tensor，表示中间网络给出的残差。对每个 token 查 weight 对应行并加上 delta，随后与同一个 weight 的所有行做点积，返回 [B,T,V] 的 logits。要求两个计算分支的梯度都累积到传入的 weight，重复的 token ID 会累加其查表梯度。',
  'ids, weight, delta',`import torch.nn.functional as F

def solve(ids, weight, delta):
    hidden = F.embedding(ids, weight) + delta
    return F.linear(hidden, weight)`,
  '词表权重的一行既可以作为输入向量，也作为预测该 token 的输出方向。共享省去另一份 V×D 权重；autograd 会把查表和输出层的两路梯度相加。',
  [tiedCase([[0,0]],[[1,2],[0,3],[-1,2]],[[[0,0],[2,-1]]]),
   tiedCase([[2],[1]],[[0],[2],[-3]],[[[1]],[[0]]]),tiedCase([[0]],[[0,0]],[[[1,-2]]])],'tying',
  ['标出 embedding lookup 与词表线性投影的轴。','说明重复 token 对输入分支的梯度累加。','用一次 backward 说明共享权重的两条梯度路径。'],
  {requiresTorch:true,driver:`def run_case(args):
    import torch
    ids = torch.tensor(args[0], dtype=torch.long)
    weight = torch.tensor(args[1], dtype=torch.float64, requires_grad=True)
    delta = torch.tensor(args[2], dtype=torch.float64)
    result = solve(ids, weight, delta)
    gradient, = torch.autograd.grad(result.sum(), weight)
    with torch.no_grad():
        hidden = weight[ids] + delta
        from_output = hidden.sum((0, 1)).expand_as(weight)
        counts = torch.bincount(ids.flatten(), minlength=len(weight))
        from_input = counts[:, None] * weight.sum(0)
        torch.testing.assert_close(gradient, from_output + from_input)
    return result.detach().tolist()`});

const route = problem('moe-topk-routing','稀疏 MoE 的 Top-k 路由','MoE','中等','为每个 token 选取专家并稳定计算所选专家的权重。',
  'logits 为形状 [N,E] 的浮点 Tensor，元素有限，每行对应一个 token，每列一个专家。对每行选出 k 个最大值（1≤k≤E），按分数降序，相等时按专家编号升序。对所选 k 项重新求 softmax。返回 (ids,weights) 两个形状 [N,k] 的 Tensor，ids 为整数，weights 为浮点，保持对所选 logits 的梯度。',
  'logits, k',`import torch

def solve(logits, k):
    ids = torch.argsort(logits, dim=-1, descending=True, stable=True)[:, :k]
    return ids, logits.gather(1, ids).softmax(dim=-1)`,
  '稳定降序排序在分数相等时保留原专家顺序。先选取，再在 k 个分数上沿最后一维归一化；每个 token 的权重和为 1。完整排序耗时 O(NE log E)。',
  [[[[[1002,1000,1001],[-3,0,0]],2],[[[0,2],[1,2]],[[1/(1+Math.exp(-1)),1/(1+Math.exp(1))],[0.5,0.5]]]],
   [[[[-7,4,4],[1,0,1]],1],[[[1],[0]],[[1],[1]]]],
   [[[[0,0,0]],3],[[[0,1,2]],[[1/3,1/3,1/3]]]]],'mixtral',
  ['区分在 E 个专家上归一化与在 k 个所选专家上归一化。','解释并列分数的确定性处理。','分析 k 固定时扩大专家数对路由开销和活跃专家计算的影响。'],
  {requiresTorch:true,driver:`def run_case(args):
    import torch
    logits = torch.tensor(args[0], dtype=torch.float64, requires_grad=True)
    ids, weights = solve(logits, args[1])
    if ids.dtype not in (torch.int32, torch.int64):
        raise ValueError("专家 ID 需要整数 dtype")
    probe = torch.arange(args[1], dtype=weights.dtype)
    (weights * probe).sum().backward()
    return [ids.detach().tolist(), weights.detach().tolist()]`});
function dispatchCase(x,ids,probs,matrices) {
  const out=x.map((row,t)=> row.map((_,d)=>ids[t].reduce((s,e,k)=>s+probs[t][k]*dot(matrices[e][d],row),0)));
  return [[x,ids,probs,matrices],out];
}
const dispatch = problem('moe-sparse-dispatch','按专家分发和聚合 token','MoE','进阶','把所选 token 按专家分批执行，再按原 token 下标累加输出。',
  'x 为 [N,D]，ids 与 weights 均为 [N,k]；同一行的专家编号互异，weights 非负且和为 1。experts 为 E 个可调用的 PyTorch 子模块，输入 [M,D]，返回 [M,D]。对每个有任务的专家，只将分给它的 token 行一次性送入该模块，空闲专家跳过；每个 token 的输出为所选专家输出按对应 weights 的加权和。返回 [N,D] 浮点 Tensor 并保留梯度。样例中 experts 以 [E,D,D] 的线性层权重展示，输入函数时已转换为模块。',
  'x, ids, weights, experts',`import torch

def solve(x, ids, weights, experts):
    out = torch.zeros_like(x)
    for e, expert in enumerate(experts):
        rows, slots = torch.where(ids == e)
        if rows.numel():
            values = expert(x[rows])
            out = out.index_add(0, rows, values * weights[rows, slots, None])
    return out`,
  'where 返回 token 下标和其所占路由槽位。按 token 下标 gather，按槽位取权重，再 index_add 合并同一 token 的多路贡献。该实现扫描 E 次路由表；大批量实现可按专家编号排序后一次切分。',
  [dispatchCase([[1,2],[3,1],[0,2]],[[1,0],[0,2],[1,2]],[[.25,.75],[.5,.5],[.8,.2]],[[[1,0],[0,1]],[[0,2],[1,0]],[[2,1],[0,-1]],[[8,0],[0,8]]]),
   dispatchCase([[4],[1]],[[2],[2]],[[1],[1]],[[[1]],[[9]],[[-2]]]),dispatchCase([[-1,2]],[[0,1]],[[0,1]],[[[1,0],[0,1]],[[0,1],[1,0]]])],'mixtral',
  ['按 (token,slot) 找到正确的输入行与权重。','用聚合加法保留一个 token 的所有专家贡献。','以调用的专家数和处理的行数解释稀疏计算。'],
  {requiresTorch:true,driver:`def run_case(args):
    import torch
    from torch import nn
    class Expert(nn.Module):
        def __init__(self, matrix):
            super().__init__()
            self.register_buffer("matrix", torch.tensor(matrix, dtype=torch.float64))
            self.rows = []
        def forward(self, inputs):
            self.rows.append(inputs.detach().tolist())
            return inputs @ self.matrix.T
    x = torch.tensor(args[0], dtype=torch.float64, requires_grad=True)
    ids = torch.tensor(args[1], dtype=torch.long)
    weights = torch.tensor(args[2], dtype=x.dtype, requires_grad=True)
    experts = [Expert(w) for w in args[3]]
    actual = solve(x, ids, weights, experts)
    for i, expert in enumerate(experts):
        rows = [v for v, tokens in zip(args[0], args[1]) if i in tokens]
        if rows and (len(expert.rows) != 1 or sorted(expert.rows[0]) != sorted(rows)):
            raise ValueError(f"专家 {i} 应接收一次包含自己全部已分配 token 的批量输入")
        if not rows and expert.rows:
            raise ValueError(f"专家 {i} 此次没有分配到 token")
    torch.autograd.grad(actual.sum(), (x, weights))
    return actual.detach().tolist()`});

const tutorials = [
  lesson('bpe-training-and-encoding','从 UTF-8 学出 BPE 合并表',
    '分别推演训练时的频数统计与编码时的规则优先级。',
    `## 在哪一步决定 token 的边界？
字节级 BPE 从 256 个单字节 ID 开始。先对每篇文本做 UTF-8 编码，再反复合并相邻 token。词表记录每个 ID 对应哪些字节；合并表记录一对 ID 能合成哪个新 ID，以及该规则的排名。工程分词器通常在此之前做预分词，在这一步明确空格、标点和文档之间的边界。

## 手算两轮
在文本 aaaa 中，相邻位置构成三次 aa。第一轮把 aa 编为 256，顺序扫描后得到 [256,256]。这同时说明了两个不同的计数方式：统计时计入全部相邻位置，替换时每个位置只能被消费一次。再合并一次就得到代表四个字节的 257。把训练集换成两篇单字节文档 a、b，候选表为空；文档之间没有相邻对。

编码新文本时，学习到的规则顺序保持固定。例如 bc 排在 ab 前面，编码 abc 时先得到 a 和 bc。若把新文本重新当成训练集，或按词表中字符串长度贪心匹配，便可能得到另一串 ID。规则表中第 r 项仅能使用更早产生的 ID，这使编码端可以按规则逐条扫描。

## 写完怎样验证
分别测试空文本、奇数长度的 aaaaa、含多字节字符的字符串“中”。逐个 ID 展开成字节，再将整段字节一起按 UTF-8 解码；单个 token 可以只包含多字节字符的一部分。面试复盘时说明并列频数采用的规则，并说明它对可复现训练的影响。`,
    ['minbpe','bpe','pipeline'],['byte-bpe-train','byte-bpe-encode'],
    ['给我两个频数相同但互相重叠的候选 pair，让我手算选取及替换过程。','查看我的 encode，找一段能区分按 merge rank 与最长匹配的输入，并解释。']),
  lesson('packing-and-masking','打包训练时如何隔离文档',
    '用同一行短文档同时推导 segment ID、position ID、注意力遮罩和标签。',
    `## 文档接在一起时，模型可以看哪些位置？
Sequence packing 将多条较短样本装入一行，以提高有效 token 占比。若训练目标要求文档相互独立，要同时处理 attention 的可见范围和下一 token 的监督范围。EOS 是文档结束符，单独插入一个 EOS 仍会让下三角 attention 读取它前面的所有文档。

## 手算一行训练数据
把 [4,2] 与 [8] 打包，EOS=9、行宽为 5，得到 ids=[4,2,9,8,9]，段号 [0,0,0,1,1]，段内位置 [0,1,2,0,1]。在直接给出下一 token 目标的接口里，labels=[2,9,−100,9,−100]。位于第一个 EOS 的输出应跳过损失；若模型内部负责标签移位，则按其接口给未移位的标签，并在移位后核对同一批监督位置。

对 query 位置 3 逐列检查：只允许 key 3。query 4 可以读取 3 和 4。加入长度为 1 的滑窗后，两行均只保留对角线。窗口宽度包含当前 token，跨段处还需检查段号。

## 验证边界
将第一篇文档的 token 替换为其他值，第二篇独立前向得到的结果应保持一致。pad 与 EOS 共用 ID 时，保留显式段号以区分有效 EOS 与填充。对全为 False 的 padding 行，实际模型可跳过该 query 或采用有定义的空行处理，避免对全为负无穷的分数直接做 softmax。`,
    ['packing','sft'],['pack-independent-docs','packed-causal-mask'],
    ['给出两篇短文档，逐个问我第二篇首 token 的可见范围和监督目标。','帮我区分 collator 先移位和 causal LM 内部移位两种接口，并举双重移位的反例。']),
  lesson('rotary-coordinates','从二维旋转推导 RoPE',
    '推导绝对位置如何变成相对位移，再落实到 batch、head 和通道轴。',
    `## 位置为什么会进入注意力分数？
对一对通道 (a,b)，二维旋转 R(φ) 给出 (a cosφ−b sinφ, a sinφ+b cosφ)。分别将位置 m、n 对应的 query 和 key 旋转后，点积等于 qᵀR((n−m)θ)k，因为 R(mθ)ᵀR(nθ)=R((n−m)θ)。因此同移两个位置会保留这项点积。

## 从二维扩到一个头
令头维 D=4、base=100，第 0 对通道的角频率为 1，第 1 对为 0.1。位置 2 的输入 [1,0,1,0] 输出 [cos2,sin2,cos0.2,sin0.2]。先把 [B,T] 的 position ID 与 [D/2] 的频率相乘，再插入长度为 1 的 head 轴，得到 [B,1,T,D/2]。各头在相同位置使用相同旋转。

Meta 的示例把相邻两个实数通道当成一个复数；乘以单位复数和上述二维公式等价。部分实现将前半维与后半维配对，移植权重时应同时核对通道排列。解码续写时应沿用前缀之后的位置编号。

## 用性质找错
先验证位置零是恒等映射，任意位置下每对通道平方和保持不变。再分别算两组位置 (2,5) 和 (12,15) 的 query/key 点积，两者应相等。最后让同一 batch 的两条样本使用不同 position ID，检查广播是否把 batch 误当成了 head。`,
    ['rope','llama'],['rotary-position-embedding'],
    ['用一个二维 q、k 让我推导共同平移位置对点积的影响。','给我一组 D=4 的输入，对比相邻配对与前后半区配对会出现哪些差异。']),
  lesson('feedforward-and-residual','写出 SwiGLU 与 Pre-Norm 残差',
    '在前馈层核对三份权重，再把 attention 和 FFN 接成可训练的 decoder block。',
    `## 一个 token 的前馈网络怎样计算？
设输入宽度 D，前馈隐藏宽度 F。gate 与 up 权重的形状都是 [F,D]，输出权重是 [D,F]。先计算 g=xWgᵀ、u=xWuᵀ，再计算 SiLU(g)⊙u，最后投影回 D 维。SiLU(z)=z·sigmoid(z)，⊙ 表示对应元素相乘。若 D=2、F=3，这三个投影共 18 个无偏置参数。

将 gate 权重设为零，整个前馈输出应为零。让 gate 输出为负值、up 输出为正值，可以区分正确门控与把 SiLU 用在另一分支上。这些例子比三个单位矩阵更容易暴露次序错误。

## 接入 decoder block
Pre-Norm 把归一化放在各子层的输入端。令 h=x+Attention(Norm₁(x))，再令 y=h+FFN(Norm₂(h))。先算 h，再复用 h 作为第二条残差与第二个归一化的输入。nanoGPT 的前馈使用 GELU；同样的残差组织也可接入 SwiGLU。Llama 的实现则展示了 RMSNorm 配合门控前馈的组合。

## 验证模块能训练
将两个分支替换为恒零模块，输出应精确还原 x。接入真分支后，对输出求和并 backward，检查两处归一化参数均有梯度。用 named_parameters() 查找子层权重，核对它们已被父模块注册。面试中可以画出两次残差相加，逐个写出输入最后一维为何必须保持 D。`,
    ['glu','llama','nano','raschka'],['swiglu-feedforward','pre-norm-decoder-block'],
    ['给我一个输入和两组不同的权重，检查 SiLU 作用于哪条支路。','用两行伪代码让我解释 Pre-Norm 的两个残差，并设计一个能识别第二次误用 x 的样例。']),
  lesson('shared-input-output-embeddings','词嵌入与输出层如何共享梯度',
    '从同一张词表的两种用法，推导反向传播与参数量。',
    `## 为什么输入输出能用同一份参数？
设词表大小 V、隐藏维 D，词表权重 W 的形状为 [V,D]。输入 token i 查第 i 行得到向量，末层隐藏向量 h 乘 Wᵀ 得到 V 个 logits，每项是 h 与一个词向量的点积。将 embedding.weight 与 lm_head.weight 设为同一个 Parameter，可省下一份 V×D 的参数。使用 F.embedding 和 F.linear 时也可以直接传同一张 W。

## 一个可手算的前向
取 W=[[1,0],[0,2],[1,1]]，输入 ID=1，网络残差为 [1,0]。查表后 h=[1,2]，三个 logits 分别为 1、4、3。设损失为这三个 logits 的和，输出分支向 W 的每一行提供 h；输入分支还向第 1 行提供 W 各行的和 [2,3]。因此第 1 行的总梯度是 [3,5]。重复输入 ID 时，每次出现的输入分支梯度都要累加。

## 验证真正的权重共享
只比较一次前向会让复制两份初值相同的权重也显得正确。使用同一个损失做反向传播，再检查输入表的梯度是否包含上述两项。在 nn.Module 版本中可直接测试两个属性引用同一个 Parameter。遇到词表扩容时，复核输入和输出两端的词表轴是否同步更新。`,
    ['tying','nano','illustrated'],['tied-vocabulary-projection'],
    ['给我一个两词三维词表，逐项核对一次查表、词表投影和梯度贡献。','我的前向正确但共享参数的梯度缺一项，帮我通过小输入定位 detach 或复制操作。']),
  lesson('sparse-expert-dispatch','MoE 的路由、分发与聚合',
    '把路由的二维位置与专家收到的 token 对齐，再检查稀疏调用和求和。',
    `## 一个 token 交给哪些专家？
稀疏混合专家层（MoE）为每个 token 计算 E 个路由分数，选出 k 个专家。此处在所选分数上做 softmax，使每行权重和为 1。若 logits=[5,3,4]、k=2，会选专家 [0,2]，权重约为 [0.7311,0.2689]。各专家有独立的前馈网络，最终输出是这两份结果的加权和。

## 如何按专家批量处理？
设两个 token 的专家编号分别为 [2,0]、[0,1]。专家 0 需要同时接收两个输入，但它在第一个 token 的第二个槽、第二个 token 的第一个槽。以 (token 行号, 路由槽号) 定位权重，按 token 行号 gather 输入，算完后将加权输出 scatter-add 回原行。若对同一行直接覆盖赋值，后来的专家结果会抹掉先前贡献。

## 从数值检查看到实现代价
让每个专家用不同的标量乘输入，核对每个 token 的手算加权和。再记录每个专家实际接收的行数，合计应为 N×k，空闲专家的调用次数应为零。对每个专家分别扫描路由表易于实现；给分配项按专家排序、保存每个专家的起止偏移，可以减少扫描。真实训练还关心分配是否均匀，专家收到的 token 数是观察负载分布的直接依据。`,
    ['mixtral','moe'],['moe-topk-routing','moe-sparse-dispatch'],
    ['用三个专家和两个 token 检查我对 token 行号与路由槽号的理解。','在数值结果一致的情况下，我怎样判断实现确实只计算了分配到的专家？']),
];
module.exports = {problems:[train,encode,pack,mask,rope,glu,block,tied,route,dispatch],tutorials};
