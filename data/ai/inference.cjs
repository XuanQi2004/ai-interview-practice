'use strict';

const track = '推理与部署';
const resource = (title, author, kind, url, note) => ({ title, author, kind, url, note });
const readings = {
  normalizer: resource('Online normalizer calculation for softmax', 'Maxim Milakov、Natalia Gimelshein', '论文', 'https://arxiv.org/abs/1805.02867', '读在线更新最大值和归一化因子的算法，用两个相差很大的分数验证重标定。'),
  flashPaper: resource('FlashAttention', 'Tri Dao 等', '论文', 'https://arxiv.org/abs/2205.14135', '结合 Algorithm 1 的分块前向计算，追踪每个 query 行保存的中间量与 HBM 读写。'),
  flashRepo: resource('FlashAttention 官方实现', 'Dao AI Lab', '开源库', 'https://github.com/Dao-AILab/flash-attention', '在 README 搜索 flash_attn_func，核对 Q、K、V 的维度顺序、causal 开关以及测试入口。'),
  generation: resource('Generation strategies', 'Hugging Face Transformers', '文档', 'https://huggingface.co/docs/transformers/main/en/generation_strategies', '对照 greedy、sampling 和 beam search 的 generate 参数，区分候选数和返回序列数。'),
  decodingBlog: resource('How to generate text', 'Patrick von Platen · Hugging Face', '博客', 'https://huggingface.co/blog/how-to-generate', '分别阅读 Beam search、Top-K Sampling 和 Top-p sampling，画出逐步缩小的候选集合。'),
  specPaper: resource('Fast Inference from Transformers via Speculative Decoding', 'Yaniv Leviathan、Matan Kalman、Yossi Matias', '论文', 'https://arxiv.org/abs/2211.17192', '在 Algorithm 1 标出提议、接受概率、失败后的校正分布和全部通过后的额外 token。'),
  specBlog: resource('Looking back at speculative decoding', 'Google Research', '博客', 'https://research.google/blog/looking-back-at-speculative-decoding/', '沿草稿模型与目标模型的交互过程，列出一次校验节省了哪些串行调用。'),
  assisted: resource('Assisted Generation', 'João Gante · Hugging Face', '博客', 'https://huggingface.co/blog/assisted-generation', '阅读 Greedy decoding 与 Sample with assisted generation，比较贪心一致性和随机抽样的条件。'),
  paging: resource('vLLM 与 PagedAttention', 'Woosuk Kwon 等 · vLLM', '博客', 'https://vllm.ai/blog/2023-06-20-vllm', '阅读 The Secret Sauce: PagedAttention，通过块表示意图跟踪逻辑块、物理块与共享。'),
  prefix: resource('Automatic Prefix Caching', 'vLLM', '文档', 'https://docs.vllm.ai/en/latest/design/prefix_caching/', '阅读哈希键构成和完整块缓存小节，区分块内 token 与此前的上下文。'),
  batch: resource('Continuous batching', 'Hugging Face Transformers', '文档', 'https://huggingface.co/docs/transformers/main/en/continuous_batching', '对照请求动态加入和完成后释放位置的过程，观察不同生成长度在同一批次中的行为。'),
  benchmark: resource('serve benchmark 源码与指标', 'vLLM', '文档', 'https://docs.vllm.ai/en/latest/api/vllm/benchmarks/serve/', '搜索 calculate_metrics 和 output_throughput，对照输出 token 数、测量窗口和各请求的延迟统计。'),
  ggml: resource('ggml 参考量化实现', 'llama.cpp / ggml', '开源库', 'https://github.com/ggml-org/llama.cpp/blob/master/ggml/src/ggml-quants.c', '搜索 quantize_row_q8_0_ref，定位块内绝对最大值、尺度存储和 roundf；对照反量化函数。'),
  quantGuide: resource('llama-quantize 工具说明', 'llama.cpp', '文档', 'https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md', '从命令示例辨认输入模型、输出模型和类型参数，比较不同块格式的模型大小。'),
};

const problems = [];
function add(id, title, topic, difficulty, params, summary, statement, body, explanation, source, rubric, tests) {
  const signature = 'solve(' + params + ')';
  problems.push({
    id: 'ai-' + id, category: 'AI 模块', track, topic, difficulty, title, summary, statement,
    signature, starter: 'def ' + signature + ':\n    raise NotImplementedError\n',
    solution: 'def ' + signature + ':\n' + body.trimEnd(), explanation,
    source: {label: source.title, url: source.url}, rubric, cases: tests.map(([args, expected]) => ({args,expected})),
  });
}
add('online-attention','逐块累积注意力输出','高效注意力','进阶','blocks, d',
  '按块读取单个 query 的分数和值向量，数值稳定地累积注意力输出。',
  '每块含若干 [score, value]，score 是已缩放的有限浮点数，value 是长度 d 的向量。score 为 None 的元素已被遮罩。逐块计算全体有效元素的 softmax 加权和，返回长度 d 的列表。所有元素都被遮罩或没有块时返回全零。实现只保存 O(d) 的跨元素状态，允许空块。',
`    import math
    maximum = -math.inf
    denominator = 0.0
    numerator = [0.0] * d
    for block in blocks:
        for score, vector in block:
            if score is None:
                continue
            new_max = max(maximum, score)
            scale = math.exp(maximum - new_max)
            weight = math.exp(score - new_max)
            denominator = denominator * scale + weight
            for j, value in enumerate(vector):
                numerator[j] = numerator[j] * scale + weight * value
            maximum = new_max
    return [x/denominator for x in numerator] if denominator else numerator`,
  '每次变更指数的参考最大值，旧分母及旧分子应乘以同一系数。重复单元素更新即可跨块归并，时间 O(有效元素数 × d + 输入元素数)，辅助空间 O(d)。',readings.normalizer,
  ['推导最大值变化时分母与分子的缩放系数。','说明空块、全遮罩与大幅度 logits 的返回值。','比较跨块状态大小和显式保存所有权重的空间。'],[
    [[[[[1000,[2,4]]],[],[[1000,[6,0]],[null,[99,99]]]],2],[4,2]],
    [[[[[0,[0]]],[[Math.log(3),[8]]]],1],[6]],
    [[[[[null,[12,3]]],[]],2],[0,0]],[[[],3],[0,0,0]],
  ]);
add('sampling-filter','温度与 top-k、top-p 采样分布','解码采样','中等','logits, temperature, k, p',
  '将有限 logits 变为按 token ID 对齐的概率，依次应用温度、top-k 和 nucleus 截断。',
  'logits 为非空有限数列表，temperature≥0，k≥0，0<p≤1。温度为 0 时输出 argmax 所在位置为 1 的分布，同分优先小 ID。其他情况按分数降序（同分按 ID 升序）取前 k 项，k=0 表示保留全部；对保留项按温度做 softmax。再取累计概率首次达到 p 的最短前缀，最终归一化。返回与 logits 等长的概率列表。',
`    import math
    ids = sorted(range(len(logits)), key=lambda i: (-logits[i], i))
    out = [0.0] * len(logits)
    if temperature == 0:
        out[ids[0]] = 1.0
        return out
    if k:
        ids = ids[:k]
    maximum = logits[ids[0]]
    weights = [math.exp((logits[i]-maximum)/temperature) for i in ids]
    threshold = p * sum(weights)
    total = 0.0
    for i,w in zip(ids,weights):
        out[i] = w
        total += w
        if total >= threshold:
            break
    return [w/total for w in out]`,
  '排序固定同分时的选择，先减最大值再计算指数。top-k 后的概率是 top-p 累计概率的基准。排序 O(V log V)，空间 O(V)。',readings.decodingBlog,
  ['按题设解释三个变换的顺序。','覆盖温度为零、同分与 p=1。','解释用减最大值避免指数上溢。'],[
    [[[3,3,0],0,0,.7],[1,0,0]],[[[0,0,0,0],1,2,.6],[.5,.5,0,0]],[[[0,Math.log(3)],1,0,.7],[0,1]],[[[1000,1000,999],2,0,1],[1/(2+Math.exp(-.5)),1/(2+Math.exp(-.5)),Math.exp(-.5)/(2+Math.exp(-.5))]],
  ]);
add('beam-expansion','带结束标记的 beam search 单步更新','束搜索','中等','beams, log_probs, width, eos',
  '在联合候选中选累计对数概率最高的序列，并处理已经结束的 beam。',
  'beams 中每项是 [token 列表, 累计对数概率]，各序列互异。log_probs 对应每条 beam 的下一 token 对数概率行，None 表示禁用。已以 eos 结尾的序列原样作为一个候选；其余序列对每个可用 token 扩展一次。按总分降序、同分按完整 token 序列字典序升序，返回前 width 个 [序列, 总分]，候选不足时全部返回。width 为正，本题采用原始累计分数。',
`    candidates = []
    for (seq,score), row in zip(beams,log_probs):
        if seq and seq[-1] == eos:
            candidates.append([seq,score])
        else:
            for token,delta in enumerate(row):
                if delta is not None:
                    candidates.append([seq+[token],score+delta])
    candidates.sort(key=lambda item: (-item[1], item[0]))
    return candidates[:width]`,
  '每个已完成序列占一个候选，其余序列按可用词扩展后统一排序。若有 M 个候选，每条长度至多 L，朴素复制及最坏同分排序耗时 O(ML log(M+1))。',readings.generation,
  ['比较逐条独立选词与合并全部候选后的差异。','说明 EOS 的分数和序列如何保留。','能讨论长度归一化对短序列排序的影响。'],[
    [[[[[1],-.5],[[2],-.7]], [[-.3,-1.5,null],[]],2,2],[[[2],-.7],[[1,0],-.8]]],
    [[[[[],0]], [[-.8,-.8,null]],3,2],[[[0],-.8],[[1],-.8]]],
    [[[[[3],-1]],[[null,null]],2,2],[]],
  ]);
add('speculative-round','投机采样的一轮接受与校正','投机解码','进阶','draft, q, p, accept_u, sample_u',
  '用给定均匀随机数重放一次精确投机采样，覆盖提前拒绝和额外采样。',
  'draft 是草稿 token ID 序列。q[i]、p[i] 分别是同一前缀下草稿与目标模型的归一化概率行；p 额外含最后一行。所有行在同一有限词表上，q[i][draft[i]]>0。每个 i 用 [0,1) 中的 accept_u[i] 与 min(1,p_i(x)/q_i(x)) 做严格小于比较。首次拒绝时，从逐项 max(p[i]−q[i],0) 归一化后的分布抽一个替代 token 并结束；全部接受时，从 p 的最后一行再抽一个。上述最后一次抽样用 sample_u，按 ID 升序取累计概率严格大于 sample_u 的第一个 token。返回本轮发出的 token 列表。',
`    def draw(weights):
        threshold = sample_u * sum(weights)
        cumulative = 0.0
        for index, w in enumerate(weights):
            cumulative += w
            if cumulative > threshold:
                return index
        return max(i for i,w in enumerate(weights) if w > 0)

    output = []
    for i,token in enumerate(draft):
        if accept_u[i] < min(1.0,p[i][token]/q[i][token]):
            output.append(token)
        else:
            residual = [max(target-proposal,0.0) for target,proposal in zip(p[i],q[i])]
            output.append(draw(residual))
            return output
    return output + [draw(p[-1])]`,
  '候选从 q 抽出后被接受的概率质量为 min(p,q)，首次拒绝时缺少的质量是 (p−q) 的正部。此前已经接受的前缀保持有效。给定分布后，工作量 O(草稿长度+词表大小)。',readings.specPaper,
  ['从概率质量解释残差分布。','区分拒绝位置前后各 token 的有效性。','说明全部接受和草稿长度为零时如何生成额外 token。'],[
    [[[0,1],[[.8,.2],[.2,.8]],[[.4,.6],[.2,.8],[1,0]],[.5,.1],.8],[1]],
    [[[0,1],[[.6,.4],[.2,.8]],[[.6,.4],[.7,.3],[.5,.5]],[.4,.8],.2],[0,0]],
    [[[1],[[.4,.6]],[[.3,.7],[.25,.75]],[.99],.25],[1,1]],[[[],[],[[0,1]],[],0],[1]],
  ]);
add('paged-kv-gather','根据块表读取 KV 缓存','分页 KV 缓存','基础','pages, table, length, positions',
  '把逻辑 token 位置转换为物理块号及块内偏移，读取一条序列的缓存。',
  'pages 为若干相同正容量的物理页，每个槽保存一个数值向量。table 按逻辑顺序列出所用物理页号。length 是已写入 token 数（0 ≤ length ≤ 页容量 × table 长度）。对每个查询位置 t，若 0 ≤ t < length 则返回对应槽的向量；越界返回 None。positions 可为空、无序或重复，pages 至少含一页。',
`    block_size = len(pages[0])
    result = []
    for pos in positions:
        if 0 <= pos < length:
            logical, offset = divmod(pos,block_size)
            result.append(pages[table[logical]][offset])
        else:
            result.append(None)
    return result`,
  '逻辑块号只用于查表，得到物理页后再取偏移。尾页只开放已经写入的位置。查询 Q 个位置的索引计算为 O(Q)。',readings.paging,
  ['手算逻辑块号、物理页号和块内位置。','解释尾页已分配且尚未写入的槽。','举例说明按页存放为何可支持非连续物理空间。'],[
    [[[[[10],[11]],[[20],[21]],[[30],[31]]],[2,0],3,[2,0,3,-1,1,2]],[[10],[30],null,null,[31],[10]]],
    [[[[[7,8]]],[],0,[0]],[null]],[[[[[5]]],[0],1,[]],[]],
  ]);
add('prefix-block-cache','按完整上下文复用前缀块','前缀缓存','中等','prompts, block_size',
  '按请求顺序记录完整前缀块，计算下一次 prefill 能复用的 token 数。',
  'prompts 是按到达顺序处理的 token ID 列表集合，block_size 为正。每次请求开始时，返回可直接复用的最长完整前缀的 token 数。之后将该请求计算过的全部完整前缀块加入缓存，末尾的部分块留给本次请求。容量充足、无淘汰；相同的块内容在不同历史前缀下分别存储。返回每个请求的命中 token 数。',
`    root = {}
    hits = []
    for prompt in prompts:
        node = root
        matched = 0
        for start in range(0, len(prompt)-block_size+1, block_size):
            key = tuple(prompt[start:start+block_size])
            if key in node:
                matched += block_size
            else:
                node[key] = {}
            node = node[key]
        hits.append(matched)
    return hits`,
  '以 token 块为边构造前缀树。每条边的父节点包含完整历史，一处未命中后的后续边都会新建。哈希操作的期望总时间与处理的 token 数成正比。',readings.prefix,
  ['解释同一块的键为何需要父前缀。','区分部分块和完整块的命中。','说明扩展到多个模型或适配器时如何隔离缓存。'],[
    [[[[1,2,3,4,5],[1,2,3,9],[8,9,3,4],[1,2,3,4,8]],2],[0,2,0,4]],
    [[[[],[1],[1,2],[1,2]],2],[0,0,0,2]],[[[[1,3],[1,4],[2,4],[1,4]],1],[0,1,0,2]],
  ]);
add('decode-scheduler','连续批处理的逐步调度','连续批处理','中等','requests, slots',
  '根据请求到达时间与剩余长度逐步组成 decode 批次。',
  'requests 中每项为 [唯一字符串 ID, 非负整数到达时刻, 正整数输出长度]，已按到达时刻排序，同刻按输入顺序。slots≥1。采用简化的纯 decode 模型，每个整数时刻保留仍需生成的请求，然后按到达顺序补满空位；每个在批请求生成一个 token。本步完成的请求在下一时刻释放位置。返回各非空步的 [时刻, 本步请求 ID 列表]，列表中老请求保持原序，新请求追加在末尾。空闲时刻跳过。',
`    active = []
    batches = []
    i = 0
    t = 0
    while active or i < len(requests):
        if not active:
            t = max(t, requests[i][1])
        while len(active) < slots and i < len(requests) and requests[i][1] <= t:
            name, arrival, length = requests[i]
            active.append((name,length))
            i += 1
        batches.append([t,[name for name,remaining in active]])
        active = [(name,remaining-1) for name,remaining in active if remaining > 1]
        t += 1
    return batches`,
  '完成一次迭代就释放已结束请求，其余请求保留上下文，下一个迭代可吸收等待队列。时间与生成 token 总数成正比，活跃状态最多 slots 个请求。',readings.batch,
  ['区分请求到达、进入批次与完成的时刻。','解释短请求何时释放位置。','说明加入 prefill 计算预算后该模型需要哪些新状态。'],[
    [[[['a',0,3],['b',0,1],['c',0,2],['d',2,1]],2],[[0,['a','b']],[1,['a','c']],[2,['a','c']],[3,['d']]]],
    [[[['x',3,1],['y',7,1]],4],[[3,['x']],[7,['y']]]],[[[],1],[]],
  ]);
add('block-int8','实现对称分块 INT8 量化','模型量化','中等','values, block_size',
  '为每组权重选取独立尺度，得到有符号整数及其浮点尺度。',
  'values 是有限浮点列表，block_size 为正。按连续块量化，尾块可以短。非零块取 scale = max(abs(x))/127，将 x/scale 舍入为最近整数，恰在半整数时向远离零的方向舍入，截断至 [−127,127]。全零块取 scale=0 且所有整数码为 0。返回 {"scales": 每块尺度, "codes": 全部整数码按原顺序拼接}。练习使用普通浮点尺度，输入可为空。',
`    import math
    scales, codes = [], []
    for start in range(0,len(values),block_size):
        group = values[start:start+block_size]
        scale = max(abs(x) for x in group)/127
        scales.append(scale)
        for x in group:
            magnitude = math.floor(abs(x)/scale+0.5) if scale else 0
            codes.append(min(127,magnitude) * (-1 if x < 0 else 1))
    return {"scales":scales, "codes":codes}`,
  '同块共享一个比例系数，符号和幅值分开处理可精确表达题设的半整数舍入约定。实现耗时 O(n)，切片的额外空间 O(块大小)。',readings.ggml,
  ['说明 INT8 的有效码范围和全零尺度。','对照 half-away-from-zero 与 Python round 的结果。','分析较小块改善局部精度的同时引入的尺度存储。'],[
    [[[-127,-.5,.5,127,0,0],4],{scales:[1,0],codes:[-127,-1,1,127,0,0]}],
    [[[0,2,-4],2],{scales:[2/127,4/127],codes:[0,127,-127]}],[[[],3],{scales:[],codes:[]}],
  ]);
add('int8-block-dot','分块整数点积与反量化','模型量化','中等','x, x_scales, w, w_scales, block_size',
  '在整数域完成每块点积，用该块两端尺度将结果还原到浮点域。',
  'x 和 w 是等长的对称量化整数码数组，码在 [−127,127]。x_scales 与 w_scales 对应连续块的非负尺度，block_size 为正，尾块可以短。每个原近似值为对应码乘块尺度。返回两个近似向量的点积。先算块内整数点积并使用足够宽的累加器，再应用两个尺度；空输入返回 0。',
`    answer = 0.0
    for block,start in enumerate(range(0,len(x),block_size)):
        subtotal = sum(x[j]*w[j] for j in range(start,min(start+block_size,len(x))))
        answer += subtotal*x_scales[block]*w_scales[block]
    return answer`,
  '相同块内的两份尺度对每个乘积都相同，可提到块内整数求和外。各块按自己的尺度还原，再累加结果。时间 O(n)，额外空间 O(1)。',readings.ggml,
  ['解释何时能把尺度移到求和之外。','说明零尺度、尾块与负数码如何处理。','估算固定宽度整型累加器处理一个块所需的位数。'],[
    [[[2,-3,4],[.5,2],[5,2,-1],[.25,.5],2],-3.5],
    [[[127,127,127],[1], [127,127,127],[1],4],48387],
    [[[0,2],[0,1],[4,5],[1,1],1],10],[[[],[],[],[],2],0],
  ]);
add('serving-metrics','从 token 时间戳计算服务指标','推理性能','基础','requests',
  '汇总请求首 token 延迟、逐请求平均 token 间隔及全局输出吞吐。',
  '每个请求为 [到达毫秒, 各输出 token 的到达毫秒列表]，至少生成一个 token，时间戳非递减且均不早于请求。ttft_ms 是逐请求首 token 时间减到达时间的平均。tpot_ms 是先对每个至少有两个 token 的请求求 (末 token−首 token)/(个数−1)，再对这些请求等权平均。tokens_per_s 是总输出 token 数除以从最早请求到达到最后 token 到达的墙钟秒数。无可计样本的指标或零时长吞吐返回 None。返回含这三个同名字段的字典。',
`    ttfts, tpots = [], []
    count = 0
    start, end = float('inf'), -float('inf')
    for arrival,tokens in requests:
        ttfts.append(tokens[0]-arrival)
        if len(tokens) > 1:
            tpots.append((tokens[-1]-tokens[0])/(len(tokens)-1))
        count += len(tokens)
        start = min(start,arrival)
        end = max(end,tokens[-1])
    return {"ttft_ms":sum(ttfts)/len(ttfts) if ttfts else None,
            "tpot_ms":sum(tpots)/len(tpots) if tpots else None,
            "tokens_per_s":1000*count/(end-start) if end > start else None}`,
  'TTFT 包括从请求到达到首 token 的全部耗时，TPOT 使用首 token 之后的间隔。各请求可能并行，吞吐分母采用全局墙钟跨度。随机访问 token 列表时每个请求只读取首尾与长度。',readings.benchmark,
  ['比较逐请求均值与合并全部 token 间隔后的加权均值。','区分墙钟时间与所有请求延迟之和。','说明单 token、同刻返回与空批次的返回口径。'],[
    [[[[0,[20,30,40]],[10,[15]],[5,[25,65]]] ],{ttft_ms:15,tpot_ms:25,tokens_per_s:6000/65}],
    [[[[3,[3]]]],{ttft_ms:0,tpot_ms:null,tokens_per_s:null}],
    [[[]],{ttft_ms:null,tpot_ms:null,tokens_per_s:null}],
    [[[[0,[5,5]],[10,[30,50,70,90]]]],{ttft_ms:12.5,tpot_ms:10,tokens_per_s:6000/90}],
  ]);

const tutorials = [];
function teach(id,title,summary,body,resources,problemIds,prompts) {
  tutorials.push({ id:'learn-'+id, track, title, summary, body, resources,
    problemIds:problemIds.map(name=>'ai-'+name), prompts });
}

teach('online-softmax','分数分块抵达时，如何计算同一个注意力输出',
  '推导单个 query 的 online softmax，再把递推式用于注意力的 value 加权和。',
`## 问题

一个 query 对所有 key 的分数为 s。注意力输出是 Σ exp(sᵢ)vᵢ / Σ exp(sᵢ)。直接为长序列保存所有 query-key 分数需要较大的中间矩阵。只看一行，若缓存一次只能装下一部分 key 和 value，已有结果应保存成什么形式？

## 术语

- m 是已处理分数的最大值。
- Z 是相对 m 计算的权重总和，Z = Σ exp(sᵢ − m)。
- A 是相同权重下的 value 向量和，A = Σ exp(sᵢ − m)vᵢ，最终输出为 A/Z。

## 推导与手算

新分数 s 到达后取 M=max(m,s)。旧权重乘 exp(m−M)，新权重取 exp(s−M)。对 Z 和 A 同时执行缩放和相加，然后记 m=M。

第一块只有分数 0、value [2,4]，此时 m=0、Z=1、A=[2,4]。第二块分数为 ln 3、value [6,0]，旧权重变成 1/3，新权重为 1。Z=4/3，A=[20/3,4/3]，输出 [5,1]。若两块各自先算平均再等权相加，会得到 [4,2]。块的归一化质量决定两块怎样合并。

## 验证实现

将这两个分数同时加 1000，输出仍应是 [5,1]。再加入一个被遮罩且 value 极大的元素，检查输出保持相同。第一块被完全遮罩时跳过；练习为全行被遮罩单独约定输出零向量。库实现的全遮罩行为应按具体 API 验证。

FlashAttention 在 GPU 上对多行 Q 和多块 K、V 进行分块，减少中间结果在显存与片上存储之间的往返。这里的标量行递推可用于推导该算法的归一化；吞吐和带宽收益需要在对应内核上测量。`,
  [readings.normalizer,readings.flashPaper,readings.flashRepo],['online-attention'],
  ['请用三个分数分两块的例子，引导我自己写出跨块的归一化系数。','请像面试官一样追问：该实现保存多少状态，多 query 时怎样改变分块？']);
teach('sampling-beams','如何从下一 token 的分数选出词或序列',
  '用同一组候选推导 top-k、top-p 和 beam search，明确每次排序的对象。',
`## 问题

模型为当前位置输出每个 token 的 logit。单序列采样需要一个离散概率分布；束搜索要同时维护多个前缀，每个前缀都有自己的下一步分布。

## 从 logits 到概率

温度 T>0 时，权重与 exp(logit/T) 成正比。分数从大到小排列后，top-k 取固定个数的候选；top-p 从头取到累计概率达到 p，候选个数随概率形状改变。依题设顺序，先 top-k 并归一化，再 top-p 并重新归一化。

例如原概率为 [0.5,0.3,0.2]，取 k=2 时分布变成 [0.625,0.375,0]。此时 p=0.6 只保留 token 0，最终为 [1,0,0]。自己试着把 p 改成 0.7，得到 [0.625,0.375,0]。温度为零时显式选择最大 logit；数值稳定的指数运算先减候选最大值。

## 从单步概率到序列分数

一条序列的联合对数概率是沿途各步条件对数概率之和。假设前缀 A、B 的累计分数为 −0.5 和 −0.7，A 的最优后继贡献 −0.4，B 的最优后继贡献 −0.1。新分数分别为 −0.9 与 −0.8，后者排在前面。

练习采用一个由完成和未完成序列共用的候选集合。已结束的序列保留原分数；其余序列扩展后统一排序。生产实现还可设独立完成集合、长度惩罚及提前结束条件。把结束标记放进一个短前缀，再比较两种完成集合策略会返回哪些结果。`,
  [readings.decodingBlog,readings.generation],['sampling-filter','beam-expansion'],
  ['给我两组 logits，让我预测调整 temperature 后 top-p 的候选集合及理由。','请用一轮 beam search 的分数表考我，包含一个已结束序列和一次并列。']);
teach('speculative-sampling','草稿 token 何时接受，拒绝后怎样抽样',
  '用两类 token 手算接受质量与残差，检查一轮投机解码能否保留目标分布。',
`## 问题与术语

- q 是草稿模型在当前前缀下生成下一 token 的概率分布。
- p 是目标模型在相同前缀下的分布。
- 残差分布取每项 max(p−q,0)，再除以这些项的和。

草稿模型串行提出几个 token，目标模型对草稿的各前缀一次计算相应分布。解码器按顺序检验草稿。对于草稿产生的 x，以 min(1,p(x)/q(x)) 接受。第一个被拒绝的位置从残差分布抽样，然后结束这一轮。全部草稿通过时，再从目标模型给出的下一位置分布抽一个 token。

## 用两类 token 验证分布

令 q=[0.8,0.2]、p=[0.4,0.6]。草稿选 0 的概率 0.8，其中半数会被接受，直接输出 0 的概率是 0.4；草稿选 1 的 0.2 全部被接受。剩余 0.4 的概率来自拒绝，残差只在 token 1 上有质量。最终输出概率为 [0.4,0.6]。

把 p 改成 q，每个提议均被接受，可直接进入追加一个目标 token 的分支。再测试第二个提议被拒绝的情形：第一个 token 保留，拒绝位置之后的草稿需要基于新前缀重新计算。

## 验证与测量

练习显式输入均匀随机数。先把第一个接受随机数设为 0.49，再设为 0.50，检查严格小于边界。分析速度时，记录每次目标验证的耗时、草稿耗时与本轮发出的 token 数；接受较多能减少目标模型串行轮数，实际延迟还取决于两类模型执行的成本。`,
  [readings.specPaper,readings.assisted,readings.specBlog],['speculative-round'],
  ['请让我用三个 token 的 p 和 q 手推残差分布，并检查最终边际概率。','如果草稿的第三个 token 被拒绝，请追问我哪些 KV 状态还能用于下一轮。']);
teach('paged-prefix','一个 token 对应哪一页，哪些前缀可以共用',
  '用块表读出缓存中的位置，再检查相同块内容在不同前缀下是否适合复用。',
`## 术语

- 逻辑块是序列中按固定容量 B 切分的连续 token 段。位置 t 的逻辑块号与块内偏移分别为 t//B 和 t%B。
- 物理页是实际存放 KV 向量的存储块。块表将当前序列的逻辑块号映射到物理页号。
- 前缀命中 token 数是从序列起点开始，已缓存且与当前上下文一致的连续完整块所覆盖的 token 数。

## 手算一次读取

设 B=2，某请求的块表为 [5,1,7]，已写入 5 个 token。位置 2 对应逻辑块 1、偏移 0，使用物理页 1 的首槽。位置 4 使用物理页 7 的首槽；同页偏移 1 留给将来的位置 5。用乱序的查询 [4,0,2] 验证索引顺序。

## 手算一次复用

先处理 [1,2,3,4,5]，可缓存两个完整块 [1,2] 和 [3,4]。接下来 [1,2,3,9] 命中 2 个 token；[8,9,3,4] 的第二个块虽然也出现过，但先前的上下文已改变，因此命中 0 个。前缀树沿父节点走到具体块，或在缓存键中包含父块标识，都能保留这种依赖。

实际系统还要管理页的引用计数和回收。讨论同时共享一页的两个请求时，指出读共享前缀的阶段、可独立追加的尾页，以及对共享可写块采用写时复制的时机。练习指定只缓存完整块且容量充足，可专注验证索引和上下文身份。`,
  [readings.paging,readings.prefix],['paged-kv-gather','prefix-block-cache'],
  ['请给我一个两个请求部分共享前缀的块表，让我逐个标注逻辑位置和物理位置。','请用不同历史但相同末块的反例，追问为什么只按本块 token 建缓存键会错。']);
teach('batch-latency','连续批处理怎样影响等待、延迟与吞吐',
  '重放长短请求的到达轨迹，分别从单个请求和整个服务窗口计算指标。',
`## 术语

- TTFT（首 token 延迟）是首个输出 token 到达时间减请求到达时间。
- 逐请求 TPOT 是末 token 与首 token 的时间差除以输出 token 数减一；本练习对有至少两个 token 的请求等权平均。
- 输出吞吐是所有请求输出 token 总数除以测量窗口的墙钟时间。

## 调度推演

设每步有两个 decode 位置，A、B、C 同时到达，分别还需 3、1、2 个 token。第 0 步处理 A、B；B 完成后，第 1 步处理 A、C；第 2 步 A、C 同时结束。等待 C 的请求在第 1 步就能进入。真实服务还要分配 prefill、decode 和 KV 内存预算。给调度题增加一个长提示时，先明确它在哪个阶段开始产生首 token。

## 从客户端日志核对

A 于 0 ms 到达，输出时间为 [20,30,40]；B 于 10 ms 到达，只在 15 ms 发出一个 token。两请求首 token 延迟 20 和 5 ms，平均为 12.5 ms。A 的平均 token 间隔为 10 ms，B 只有一个 token，对 TPOT 的均值没有贡献。总吞吐为 4/0.040=100 token/s。

比较两种调度方式时保持同一到达轨迹、输入输出长度和计时点。若客户端把一次网络事件内的多个 token 记为一个时间点，日志会出现零间隔；记录测量点有助于解释这种结果。`,
  [readings.batch,readings.benchmark,readings.paging],['decode-scheduler','serving-metrics'],
  ['请给出到达时刻不同的五个请求，让我手算每个 decode 批次并检查顺序。','请给我两条长度差异很大的输出轨迹，让我比较按 token 和按请求平均的间隔。']);
teach('block-quantization','如何将一组权重压成 INT8 并计算点积',
  '手算块尺度、舍入误差和整数乘加，再把这些步骤对应到 llama.cpp 的参考实现。',
`## 术语

- 块尺度 s 把整数码转换成浮点近似值。对于练习中的对称 INT8，非零块取 s=max|x|/127。
- 整数码 q 是按约定舍入并夹到 [−127,127] 的 x/s。反量化值为 q×s。

## 手算量化与误差

权重为 [−127,−0.5,0.5,127]，作为同一块时 s=1。练习约定半整数向远离零方向舍入，因此编码为 [−127,−1,1,127]。第二项重建为 −1，与原值的绝对误差为 0.5。在准确尺度和最近舍入下，同块各项的绝对误差最多约半个尺度；实际格式存储低精度尺度还会带来额外误差。全零块的尺度与整数码均置零。

## 用块尺度还原点积

给定一块输入码 [2,−3]、尺度 0.5，权重码 [5,2]、尺度 0.25。块内整数乘加得到 2×5−3×2=4，乘两个尺度后得到 0.5。再接一块，若该块整数点积为 −4、尺度分别为 2 与 0.5，则总点积为 0.5−4=−3.5。检查实现时先逐元素反量化再求浮点点积，两种结果应一致。

在 ggml 中定位 quantize_row_q8_0_ref，找到 amax、d、整数舍入和尺度存储。练习允许任意尾块且采用普通浮点尺度；阅读实际 GGML 格式时另行核对固定块长、尺度类型和打包布局。部署比较同时观察模型文件大小、推理速度和下游精度。`,
  [readings.ggml,readings.quantGuide],['block-int8','int8-block-dot'],
  ['请给我同一组权重按整张量和分块量化的例子，让我手算两种误差。','整数码长度很大时，如何估算累加值的上界，选择合适的累加类型？']);

module.exports = {problems,tutorials};
