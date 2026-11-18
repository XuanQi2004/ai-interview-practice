'use strict';

const track = '检索与评测';
const references = {
  haystack: ['DocumentSplitter', 'deepset · Haystack', '文档', 'https://docs.haystack.deepset.ai/docs/documentsplitter'],
  qa: ['Question answering', 'Hugging Face LLM Course', '课程', 'https://huggingface.co/learn/llm-course/chapter7/7'],
  nested: ['Nested query 与 score_mode', 'Elastic', '文档', 'https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-nested-query'],
  bm25: ['Practical BM25, Part 2', 'Elastic', '博客', 'https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables'],
  rankbm25: ['rank_bm25.py', 'Dorian Brown', '开源库', 'https://github.com/dorianbrown/rank_bm25/blob/master/rank_bm25.py'],
  faiss: ['MetricType and distances', 'Faiss 项目组', '文档', 'https://github.com/facebookresearch/faiss/wiki/MetricType-and-distances'],
  rerank: ['Retrieve & Re-Rank', 'Sentence Transformers 项目组', '文档', 'https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html'],
  rrf: ['Reciprocal Rank Fusion', 'Gordon Cormack、Charles Clarke、Stefan Büttcher', '论文', 'https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf'],
  hybrid: ['Hybrid Search and the Universal Query API', 'Qdrant', '课程', 'https://qdrant.tech/course/essentials/day-3/hybrid-search/'],
  mmr: ['Search Relevance · Maximal Marginal Relevance', 'Qdrant', '文档', 'https://qdrant.tech/documentation/search/search-relevance/#maximal-marginal-relevance-mmr'],
  context: ['Lost in the Middle', 'Nelson Liu 等', '论文', 'https://aclanthology.org/2024.tacl-1.9/'],
  ir: ['Measures', 'ir-measures 项目组', '文档', 'https://ir-measur.es/en/latest/measures.html'],
  beir: ['BEIR', 'BEIR 项目组', '开源库', 'https://github.com/beir-cellar/beir'],
  alce: ['Enabling Large Language Models to Generate Text with Citations', 'Tianyu Gao 等', '论文', 'https://aclanthology.org/2023.emnlp-main.398/'],
  alceCode: ['ALCE', 'Princeton NLP', '开源库', 'https://github.com/princeton-nlp/ALCE'],
  ragas: ['Faithfulness', 'Ragas 项目组', '文档', 'https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/'],
};
function resource(key, note) {
  const [title, author, kind, url] = references[key];
  return { title, author, kind, url, note };
}
function exercise(data, ref, examples) {
  const [label, , , url] = references[ref];
  return {
    category: 'AI 模块', track, requiresTorch: false, ...data,
    starter: 'def ' + data.signature + ':\n    raise NotImplementedError\n',
    source: { label, url }, cases: examples.map(([args, expected]) => ({ args, expected })),
  };
}

const problems = [
  exercise({
    id: 'ai-chunk-offsets', title: '用 token 偏移量生成重叠文本块', topic: '文本分块', difficulty: '基础',
    summary: '按 token 数分块，同时保留原文字符范围、块内空白和最终短块。',
    statement: '输入原文 text，以及每个内容 token 对应的字符区间 offsets。区间是递增、互不相交的 [start,end)，按 Python 字符串下标计数。width 为每块最多包含的 token 数，0 ≤ overlap < width。每块从首 token 的 start 截到末 token 的 end，保留区间内全部原文。最后一个 token 被覆盖时立即结束。返回按文档顺序排列的 [start,end,片段原文] 列表。',
    signature: 'solve(text, offsets, width, overlap)',
    solution: `def solve(text, offsets, width, overlap):
    chunks = []
    begin = 0
    while begin < len(offsets):
        stop = min(begin + width, len(offsets))
        left, right = offsets[begin][0], offsets[stop-1][1]
        chunks.append([left, right, text[left:right]])
        if stop == len(offsets):
            break
        begin += width - overlap
    return chunks`,
    explanation: '在 token 下标上移动窗口，在字符下标上切片。输出切片的总字符数为 L、块数为 C 时，时间 O(L+C)。最后一块命中原文末端即返回，避免额外生成仅含重叠部分的尾块。',
    rubric: ['区分 token 窗口和字符偏移，保留原始空白与 Unicode 字符。', '能解释重叠量与步长的关系，覆盖空输入和尾块。'],
  }, 'qa', [
    [['  甲乙  GPU! ok', [[2,3],[3,4],[6,9],[9,10],[11,13]], 3, 1], [[2,9,'甲乙  GPU'],[6,13,'GPU! ok']]],
    [['a b c d', [[0,1],[2,3],[4,5],[6,7]], 3, 0], [[0,5,'a b c'],[6,7,'d']]],
    [['🚀 x', [[0,1],[2,3]], 2, 1], [[0,3,'🚀 x']]], [['   ', [], 3, 1], []],
  ]),
  exercise({
    id: 'ai-passage-grouping', title: '按文档聚合片段检索结果', topic: '分组检索', difficulty: '基础',
    summary: '为每份文档保留分数最高的片段，并返回去重后的前 k 份文档。',
    statement: 'hits 中每项为 [文档 ID, 片段 ID, 相关性分数]。分数越大越相关，允许负值。对每个文档取最高分，片段同分时选片段 ID 字典序最小者。按文档最高分降序返回至多 k 个 [文档 ID, 片段 ID]；文档最高分相同按文档 ID 升序。k 为非负数，ID 为 ASCII 字符串。',
    signature: 'solve(hits, k)',
    solution: `def solve(hits, k):
    best = {}
    for doc, chunk, score in hits:
        candidate = (-score, chunk)
        if doc not in best or candidate < best[doc]:
            best[doc] = candidate
    ordered = sorted(best, key=lambda doc: (best[doc][0], doc))
    return [[doc, best[doc][1]] for doc in ordered[:k]]`,
    explanation: '以文档为键保存胜出的片段，再对文档排序。设共有 N 个命中、D 个不同文档，时间 O(N+D log D)，辅助空间 O(D)。',
    rubric: ['取文档级最大值后截断，避免同一文档多次占位。', '明确片段并列、文档并列和全负分的处理。'],
  }, 'nested', [
    [[[['z','b',7],['z','a',7],['a','c',7],['a','d',2],['x','k',6]],2],[['a','c'],['z','a']]],
    [[[['d','x',-5],['e','y',-3],['d','z',-4]],9],[['e','y'],['d','z']]],
    [[[['a','p',0]],0],[]], [[[],3],[]],
  ]),
  exercise({
    id: 'ai-bm25-scores', title: '计算带长度归一化的 BM25 分数', topic: '稀疏检索', difficulty: '进阶',
    summary: '从已分词的语料计算文档频率、长度归一化项与逐文档 BM25 分数。',
    statement: 'docs 是 token 列表的列表，query 是 token 列表，词项精确匹配。设 N 为文档数（含空文档），avg 为平均 token 数。对每个不同查询词 t，令 df 为包含 t 的文档数，tf 为 t 在当前长度 L 的文档中的次数。该词对文档的贡献为 ln(1+(N-df+0.5)/(df+0.5)) × tf × (k1+1)/(tf+k1×(1-b+b×L/avg))；tf=0 时贡献为 0。k1>0，0≤b≤1。按输入顺序返回各文档分数，全部空文档时均为 0。',
    signature: 'solve(docs, query, k1, b)',
    solution: `from collections import Counter
from math import log1p

def solve(docs, query, k1, b):
    n = len(docs)
    lengths = [len(doc) for doc in docs]
    total = sum(lengths)
    if not total:
        return [0.0] * n
    counts = [Counter(doc) for doc in docs]
    terms = set(query)
    df = Counter()
    for freq in counts:
        df.update(terms.intersection(freq))
    idf = {t: log1p((n - df[t] + 0.5) / (df[t] + 0.5)) for t in terms}
    average = total / n
    scores = []
    for length, freq in zip(lengths, counts):
        norm = k1 * (1 - b + b * length / average)
        score = sum(idf[t] * freq[t] * (k1 + 1) / (freq[t] + norm)
                    for t in terms if freq[t])
        scores.append(score)
    return scores`,
    explanation: '词频按同一文档内的出现次数统计，文档频率对每份文档只加一次。词频项随重复出现逐渐饱和，长度项按文档与平均长度之比缩放。',
    rubric: ['区分 tf、df 与查询中的重复词。', '分别说明 k1、b 变化如何影响相同词频的两份文档。'],
  }, 'bm25', [
    [[[['x','x'],['x','y','y','y'],[]],['x','x','z'],1,1], [Math.log(1.6)*4/3, Math.log(1.6)*2/3,0]],
    [[[['a'],['b']],['a','b'],1.2,0], [Math.log(2),Math.log(2)]],
    [[[['x','r'],['x'],['x','x']],['x','r'],1,0], [Math.log(8/7)+Math.log(8/3), Math.log(8/7), Math.log(8/7)*4/3]],
    [[[[],[]],['x'],1.5,1],[0,0]], [[[],['x'],1.2,0.5],[]], [[[['t']],[],2,0],[0]],
  ]),
  exercise({
    id: 'ai-cosine-topk', title: '精确余弦 top-k 检索', topic: '向量检索', difficulty: '基础',
    summary: '返回与查询方向最接近的向量，处理不同模长、零向量和并列分数。',
    statement: 'query 与 vectors 中的每个向量维度相同，元素为有限数值。计算 dot(q,v)/(‖q‖₂‖v‖₂)，按余弦相似度降序返回至多 k 个原始行下标，同分取较小下标。忽略零向量文档；查询为零向量或 k=0 时返回空列表。k 为非负整数。',
    signature: 'solve(query, vectors, k)',
    solution: `from math import hypot
from heapq import nsmallest

def solve(query, vectors, k):
    qnorm = hypot(*query)
    if qnorm == 0 or k == 0:
        return []
    q = [value / qnorm for value in query]
    def candidates():
        for i, vector in enumerate(vectors):
            norm = hypot(*vector)
            if norm:
                cosine = sum(x * (y / norm) for x, y in zip(q, vector))
                yield (-cosine, i)
    return [i for _, i in nsmallest(k, candidates())]`,
    explanation: '分别对查询和文档作 L2 归一化，内积即余弦相似度。逐行计算，用堆保留所需结果。对 N 个 d 维向量，时间 O(Nd+N log(k+1))，额外空间 O(d+k)。',
    rubric: ['能举例区分原始内积排序与余弦排序。', '处理零范数、负相似度和边界 k；说明预归一化文档的作用。'],
  }, 'faiss', [
    [[[1,0],[[8,8],[2,0],[0,0],[-1,0],[1,0]],4],[1,4,0,3]],
    [[[0,1],[[1,0],[0,-1],[0,0]],8],[0,1]], [[[0,0],[[4,1]],1],[]], [[[1],[[1]],0],[]],
  ]),
  exercise({
    id: 'ai-reciprocal-rank-fusion', title: '用 RRF 融合两路或多路检索', topic: '混合检索', difficulty: '进阶',
    summary: '将不同检索器的排名合并，处理缺失、重复和并列。',
    statement: 'rankings 是多个按相关性排列的文档 ID 列表。每个列表先按首次出现去重，再从 1 开始计名次。文档的 RRF 分数等于它出现的各列表中 1/(c+名次) 之和。c 是非负整数，按分数降序、并列按 ID 字典序升序，返回至多 k 个 ID。ID 为 ASCII 字符串，k≥0。',
    signature: 'solve(rankings, c, k)',
    solution: `from collections import defaultdict
from fractions import Fraction

def solve(rankings, c, k):
    scores = defaultdict(Fraction)
    for ranking in rankings:
        for rank, doc in enumerate(dict.fromkeys(ranking), 1):
            scores[doc] += Fraction(1, c + rank)
    return sorted(scores, key=lambda doc: (-scores[doc], doc))[:k]`,
    explanation: '每一路排名独立去重并计分，缺席贡献为零。参考解使用分数运算保证相同理论分数可稳定比较；大规模在线服务可使用浮点计算并明确并列规则。',
    rubric: ['消除同一榜单内重复 ID 的影响，跨榜单出现继续计分。', '能解释 c 对榜首与靠后名次的相对权重影响。'],
  }, 'rrf', [
    [[[['b','b','a'],['a','c']],0,3],['a','b','c']], [[[['z','a'],['a','z'],[]],60,2],['a','z']],
    [[[['a','d','b'],['x','y','b']],0,1],['a']],
    [[[['a','d','b'],['x','y','b']],3,1],['b']],
    [[[['p','q'],['q'],['x','p']],1,2],['p','q']], [[[],60,2],[]], [[[['x']],10,0],[]],
  ]),
  exercise({
    id: 'ai-mmr-selection', title: '用 MMR 选择互补证据', topic: '多样性重排', difficulty: '进阶',
    summary: '给定查询相关性和候选两两相似度，逐步选择兼顾相关性与差异的片段。',
    statement: 'relevance[i] 是第 i 条候选的查询相关性，similarity[i][j] 是候选间相似度，取值均在 [0,1]。第一项取查询相关性最高者；此后反复选取使 weight×relevance[i]−(1−weight)×max(similarity[i][j] for j in 已选) 最大的未选候选。weight 在 [0,1]，并列选较小下标，返回最多 k 个下标，k≥0。',
    signature: 'solve(relevance, similarity, weight, k)',
    solution: `def solve(relevance, similarity, weight, k):
    count = len(relevance)
    used = [False] * count
    redundancy = [0.0] * count
    result = []
    for step in range(min(k, count)):
        def score(i):
            if step == 0:
                return relevance[i]
            return weight * relevance[i] - (1 - weight) * redundancy[i]
        best = max((i for i in range(count) if not used[i]), key=score)
        used[best] = True
        result.append(best)
        for i in range(count):
            redundancy[i] = max(redundancy[i], similarity[i][best])
    return result`,
    explanation: '每加入一个候选，逐项维护与已选集合的最大相似度。除给定矩阵外空间 O(N)，选择 k 项用时 O(N·min(k,N))。',
    rubric: ['区分查询相关性与候选间相似度。', '每轮更新对整个已选集合的最大相似度，并说明 weight 两端的行为。'],
  }, 'mmr', [
    [[[1,0.9,0.75],[[1,1,0],[1,1,0],[0,0,1]],0.5,3],[0,2,1]],
    [[[0.7,1,0.8],[[1,0.9,0],[0.9,1,0.2],[0,0.2,1]],0,2],[1,2]],
    [[[1,0.9,0.8,0.75],[[1,0.2,0.95,0.4],[0.2,1,0,0.4],[0.95,0,1,0.1],[0.4,0.4,0.1,1]],0.5,3],[0,1,3]],
    [[[0.8,0.8],[[1,1],[1,1]],1,5],[0,1]], [[[],[],0.8,2],[]], [[[1],[[1]],0,0],[]],
  ]),
  exercise({
    id: 'ai-rerank-context-budget', title: '按重排分数组织 RAG 上下文', topic: '上下文构建', difficulty: '进阶',
    summary: '把候选片段按重排分数放入 token 预算，计算分隔符并限制单个来源占用的片段数。',
    statement: 'items 中每行是 [片段ID,文档ID,token数,重排分数]，片段 ID 唯一，token 数为正整数。按分数降序扫描，同分沿用输入顺序。每份文档至多选 cap 个片段，相邻入选片段之间需要 sep 个 token，总预算为 budget。某个片段放不下时继续考虑后面的候选。返回 [入选片段ID列表,使用token总数]。budget、sep、cap 为非负整数。',
    signature: 'solve(items, budget, sep, cap)',
    solution: `from collections import Counter

def solve(items, budget, sep, cap):
    count, selected, used = Counter(), [], 0
    for chunk, doc, length, score in sorted(items, key=lambda row: -row[3]):
        cost = length + (sep if selected else 0)
        if count[doc] < cap and used + cost <= budget:
            selected.append(chunk)
            count[doc] += 1
            used += cost
    return [selected, used]`,
    explanation: '排序后维护已用长度与每份文档的已选数量，被跳过的候选不消耗预算。时间 O(N log N)，空间 O(N)。该策略固定按重排优先级选择，适用于要求保持该优先级的提示构建。',
    rubric: ['把分隔符和片段正文放在同一 token 计数口径中。', '能区分候选重排、按预算选择与全局优化三个问题。'],
  }, 'rerank', [
    [[[['x','A',7,9],['b','B',3,8],['a','B',1,7],['c','C',1,6]],6,1,1],[['b','c'],5]],
    [[[['z','Z',2,1],['y','Y',2,1],['w','Y',1,2]],6,1,2],[['w','z'],4]],
    [[[['a','D',2,1]],2,3,1],[['a'],2]], [[[['a','D',2,1]],10,0,0],[[],0]],
  ]),
  exercise({
    id: 'ai-ranking-recall-mrr', title: '跨查询统计 Recall@k 与 MRR@k', topic: '检索指标', difficulty: '基础',
    summary: '从查询相关文档集合与有序返回结果，分别求覆盖率和首个相关结果位置。',
    statement: 'queries 每项为 [相关文档ID列表,返回文档ID列表]。相关文档按集合处理；返回列表按首次出现去重后截取前 k 项，排名从 1 开始。单查询 Recall@k 为命中的不同相关文档数除以全部不同相关文档数，RR@k 为首个命中名次的倒数。无相关文档或无命中时相应指标记 0。对全部查询等权求平均，返回 [平均Recall@k,MRR@k]。空批次返回 [0,0]，k≥0。',
    signature: 'solve(queries, k)',
    solution: `def solve(queries, k):
    total_recall = total_rr = 0.0
    for labels, results in queries:
        relevant = set(labels)
        top = list(dict.fromkeys(results))[:k]
        hits = [rank for rank, doc in enumerate(top, 1) if doc in relevant]
        if relevant:
            total_recall += len(hits) / len(relevant)
        if hits:
            total_rr += 1 / hits[0]
    return [total_recall / len(queries), total_rr / len(queries)] if queries else [0, 0]`,
    explanation: '召回率的分母是该查询的全部相关文档数。MRR 是各查询首个命中的倒数名次平均值，含无命中时的零值。实现对输入总条目数呈线性增长。',
    rubric: ['明确查询级平均、重复项和空标注的约定。', '能构造召回率相同、首个相关结果位置不同的两个排序。'],
  }, 'ir', [
    [[[[['a','b'],['x','x','b','a']],[['c'],['c']],[[],['d']]],2],[0.5,0.5]],
    [[[[['a','a','b','c'],['b','a']],[['x'],[]]],3],[1/3,0.5]],
    [[[[['q'],['q']]],0],[0,0]], [[[],5],[0,0]],
  ]),
  exercise({
    id: 'ai-graded-ndcg', title: '计算分级相关性的 nDCG@k', topic: '检索指标', difficulty: '进阶',
    summary: '用全量标注建立理想排序，为分级相关性结果计算带折扣的归一化得分。',
    statement: 'grades 将文档 ID 映射到 0 至 3 的相关等级，ranking 是无重复 ID 的返回列表。第 r 名（从 1 开始）贡献 (2**等级−1)/log2(r+1)，未标注文档等级为 0。DCG@k 为前 k 名贡献之和；IDCG@k 用全部标注文档按等级降序计算。返回 DCG@k/IDCG@k，IDCG@k 为 0 时返回 0。k 为非负整数。',
    signature: 'solve(grades, ranking, k)',
    solution: `from math import log2

def solve(grades, ranking, k):
    def dcg(levels):
        return sum((2 ** grade - 1) / log2(rank + 1)
                   for rank, grade in enumerate(levels, 1))
    ideal = dcg(sorted(grades.values(), reverse=True)[:k])
    observed = dcg(grades.get(doc, 0) for doc in ranking[:k])
    return observed / ideal if ideal else 0.0`,
    explanation: '实际排名和理想排名使用完全相同的增益、折扣及截断深度。对 G 份标注，排序用时 O(G log G)，扫描返回前 k 项用时 O(k)。',
    rubric: ['理想排序涵盖未被检索器返回的高等级文档。', '写清增益和折扣公式、首位名次及对零分母的处理。'],
  }, 'ir', [
    [[{a:3,b:1,c:2},['b','x','a'],2],1/(7+3/Math.log2(3))], [[{a:1,b:3},['x','b'],2],(7/Math.log2(3))/(7+1/Math.log2(3))],
    [[{a:2,b:1},['a','b'],5],1], [[{a:0},['a'],1],0], [[{a:3},['a'],0],0],
  ]),
  exercise({
    id: 'ai-citation-evidence', title: '根据证据标注评测回答引用', topic: 'RAG 评测', difficulty: '进阶',
    summary: '把断言级证据覆盖与引用对的正确率分开计算，定位缺引用和错引用。',
    statement: 'claims 每项代表一条可核验断言，格式为 [能独立支持该断言的文档ID列表,回答为该断言引用的文档ID列表]。对每条断言分别去重。引用精确率为支持该断言的实际引用对数除以全部实际引用对数，同一文档用于两条断言算两个引用对。断言覆盖率为至少有一个正确引用的断言数除以断言总数。分母为 0 时记 0。返回 [引用精确率,断言覆盖率]。支持关系直接使用给定标注。',
    signature: 'solve(claims)',
    solution: `def solve(claims):
    correct = cited = covered = 0
    for evidence, citations in claims:
        predicted = set(citations)
        supported = set(evidence).intersection(predicted)
        correct += len(supported)
        cited += len(predicted)
        covered += bool(supported)
    precision = correct / cited if cited else 0.0
    coverage = covered / len(claims) if claims else 0.0
    return [precision, coverage]`,
    explanation: '先按每条断言对齐引用与证据，再分别累计引用对和断言。固定证据标注后判分可重复，涉及多文档联合推理时应把支持关系扩展为证据集合。',
    rubric: ['区分断言数和引用对数，给出两个指标的分母。', '说明错误引用、未引用断言、同一出处重复标记各自影响哪个计数。'],
  }, 'alce', [
    [[[[['x','y'],['x','x','z']],[['z'],[]],[['x'],['x']]]],[2/3,2/3]],
    [[[[['a'],['a','x']],[['b'],['b']]]],[2/3,1]],
    [[[[['a'],['a']],[['b'],[]],[['c'],[]]]],[1,1/3]],
    [[[[['a','b'],['a','b','c']],[['z'],['q']]]],[0.5,0.5]], [[[[[],['a']],[['b'],[]]]],[0,0]], [[[]],[0,0]],
  ]),
];

const tutorials = [
  {
    id: 'learn-retrieval-chunking', track, title: '切分文档并定位原文证据',
    summary: '把检索单元、评测单元与原文坐标对应起来，解释重叠窗口为何影响最终排名。',
    body: `## 问题

用户问某个训练配置为什么会丢弃最后一批样本。答案在实验说明的一句话里，检索器按片段打分，人工标注却记录整份文档的 ID。系统既需要展示原句，也需要比较文档级召回结果。

## 术语

- 字符偏移量是字符在原字符串中的位置。本练习以 Python 字符串下标计数，用左闭右开区间表示片段。
- 分块宽度是每个窗口容纳的最大 token 数。重叠量是相邻窗口共用的 token 数，步长等于宽度减重叠量。

## 从 token 找回原文

设五个 token 的字符范围为 [0,2)、[3,4)、[4,7)、[8,9)、[10,12)。宽度为 3、重叠量为 1 时，两个窗口的 token 下标范围分别是 [0,3)、[2,5)。对应原文范围是 [0,7)、[4,12)。对原文切片能保留词间空格和标点。最后一个窗口已经覆盖末尾，继续移动会多生成一个只含重复内容的小块。

索引时可同时保存文档 ID、片段 ID、原文起止位置。跨文档累加 token 下标会使引用偏移；每个文档单独分词并保存该文档中的位置。若经过文本标准化，建立标准化文本与原文的位置对应关系。

## 怎样比较

把相关段落置于相邻窗口的边界，比较重叠为 0 和 1 时，是否至少有一个窗口完整包含它。再让文档 A 的两个块分别得到 0.92、0.90，文档 B 的块得到 0.86。取前两份文档时，先按文档聚合再截断，结果为 A、B；直接截断两个块会只显示 A。保留 A 的最高分块用于引用，并用文档 ID 对齐文档级标注。`,
    resources: [
      resource('haystack', '从 Overview 对照 split_by、split_length、split_overlap 的单位，在示例中观察块与原文来源。'),
      resource('qa', '运行长上下文分窗示例，沿 offset_mapping 与 overflow_to_sample_mapping 找到原文字符范围。'),
      resource('nested', '看 score_mode=max 如何把匹配子对象的最高分用作父文档得分。'),
    ], problemIds: ['ai-chunk-offsets','ai-passage-grouping'],
    prompts: ['给我五个不等长 token 和字符区间，让我手算宽度为三的两个窗口；我回答后再检查。', '片段检索的 top-5 来自同一篇文章，人工标注却是文档级。请用一个反例追问我的评测设计。'],
  },
  {
    id: 'learn-retrieval-bm25-cosine', track, title: '实现 BM25 与精确向量检索',
    summary: '从一个包含报错代码和自然语言描述的查询出发，分别计算词项分数与向量相似度。',
    body: `## 问题

同一条工单既可用精确错误码检索，也可用“恢复任务后学习率异常”检索。先用相同文档和查询分别生成两个候选列表，保留各自的分数和名次，就能观察哪些相关文档只由一路找到。

## 术语

- 词频 tf 是某词在一份文档内出现的次数；文档频率 df 是语料中至少出现一次该词的文档数。
- 余弦相似度是两个非零向量的内积除以各自 L2 范数之积，结果越大，方向越接近。

## 算一遍

语料含三份文档，长度分别为 2、4、0。词 x 在前两篇中分别出现两次、一次。因此平均长度为 2，df 为 2。本练习取自然对数和带加一平滑的 IDF，得 ln(1.6)。取 k1=1、b=1，第一篇的词频与长度系数为 4/3，第二篇为 2/3。重复查询词按本练习约定只贡献一次。其他 BM25 实现可能采用自己的 IDF 与查询词计数策略，比较时把公式和分词方式一起记录下来。

向量例子取查询 (1,0)，文档 A=(8,8)、B=(2,0)。内积分别为 8、2；余弦相似度约为 0.707、1。若目标是余弦排序，可在建立索引时归一化文档，在查询时归一化查询，再做内积检索。零向量的处理需要在接口中定义，本练习跳过零向量文档。

## 怎样比较

固定文档集，把含完整错误码的查询与描述同一故障的改写查询分别运行两路检索。查看首个相关文档的排名，分别记录分词是否保留错误码、向量检索是否找回改写。后续评估近似向量索引时，以相同向量、相同距离函数的精确 top-k 为参照。`,
    resources: [
      resource('bm25', '阅读词频饱和与长度归一化的图，改变 k1 或 b，预测排序如何变化。'),
      resource('rankbm25', '对照 BM25Okapi._calc_idf 和 get_scores，找出其负 IDF 处理以及重复查询词的累计方式。'),
      resource('faiss', '复现 cosine similarity 小节中的归一化与内积步骤，对照未经归一化的排序。'),
    ], problemIds: ['ai-bm25-scores','ai-cosine-topk'],
    prompts: ['给我两份包含同一关键词的不同长度文档，让我说明 tf、df、b 分别影响哪一项。', '请用二维向量考我：改变某个文档的向量模长，哪些相似度和排序会变化？'],
  },
  {
    id: 'learn-retrieval-fusion-mmr', track, title: '融合多路排名，再选出互补片段',
    summary: '手算 RRF 和 MMR，比较多路候选一致性与结果集内部冗余。',
    body: `## 问题

部署说明和故障手册同时命中同一问题时，需要把关键词与向量的候选合起来。若排名靠前的四个结果恰好是重叠文本块，还需要决定上下文中是否应保留另一份互补材料。

## 术语

- Reciprocal Rank Fusion（RRF）把文档在每个检索器中的名次 r 转成 1/(c+r)，再对同一文档求和。本练习的 r 从 1 开始。
- Maximal Marginal Relevance（MMR）从候选中逐项选择，每轮比较查询相关性，并扣除与已选集合中最相似条目的相似度。

## 算一遍

两张榜单分别为 [A,B]、[B,C]，取 c=1。A 得 1/2，B 得 1/3+1/2，C 得 1/3。融合顺序为 B、A、C。增加 c 会缩小相邻名次的权重差。实现时要对齐名次从 0 或 1 开始的约定，相同 c 搭配不同起点会改变贡献。

假设某一路得到三段的查询相关性分别为 1、0.9、0.75。先选第一段，第二段与它的相似度是 1，第三段是 0。当相关性权重为 0.5，两段的下一轮 MMR 得分分别为 −0.05、0.375，因此先选第三段。再选后续项时，用它与全部已选片段的最大相似度作为冗余项。

## 怎样比较

对同一份相关性标注，先比单路与 RRF 的前 k 名覆盖了多少相关文档，再固定候选池和 k，看 MMR 后结果是否覆盖不同小节的证据。保留名次、每轮选中项与冗余项，便于区分哪一步改变了排序。`,
    resources: [
      resource('rrf', '读论文第一页的求和式并以一开始的名次复算两张小榜单。'),
      resource('hybrid', '看 Fusion 小节，用稀疏和稠密预检索结果构造两张输入榜单。'),
      resource('mmr', '看 MMR 公式及 diversity 参数与相关性权重的关系，逐轮对照候选选择。'),
    ], problemIds: ['ai-reciprocal-rank-fusion','ai-mmr-selection'],
    prompts: ['构造一对榜单，让两个候选的 RRF 得分恰好相等，追问稳定排序应怎么写。', '请当面试官，让我手算三轮 MMR，并指出只比较刚选中的片段会在哪轮出错。'],
  },
  {
    id: 'learn-retrieval-reranking-budget', track, title: '从候选重排到 token 预算',
    summary: '把交叉编码器的相关性分数变成实际可发送的上下文，并逐项检查预算。',
    body: `## 问题

检索得到多段技术文档，生成模型只能接收其中一部分。这里有两次不同的选择：检索器确定候选池，重排器对池内的查询与片段重新打分。还要根据片段长度构造模型真正看到的输入。

## 术语

- 双编码器分别编码查询和文档，允许预计算文档向量。
- 交叉编码器将查询和候选作为一对输入，输出针对这一对的相关性分数。
- 可用证据预算是模型上下文上限扣除系统提示、问题、消息模板和预留输出 token 数后的剩余量。分隔符也占用这个预算。

## 算一遍

设可用预算为 9。重排后的三个片段长度是 7、3、1，片段间分隔符长 1。按顺序加入第一个，剩 2；第二个连同分隔符共需 4，跳过它；第三个连同分隔符共需 2，可以恰好放入，最终使用 9。把剩余总量、单文档已选片段数和入选 ID 都记录下来，就能还原送给生成模型的证据。

练习中 token 长度由调用者提供，排序保持相同分数的输入次序。接入真实模型时，应使用对应 tokenizer 和实际消息模板重新计数；拼接后可能在边界处分词，独立字符串长度之和与整段编码长度可能不同。

## 怎样比较

分两次定位问题。固定候选池，看重排能否提高首篇相关材料的名次。再固定重排和预算，仅改变证据片段的位置，比较回答正确率或证据引用。Lost in the Middle 论文的文档问答与键值检索实验展示了位置变化可以影响表现，这个实验可用于解释“证据已经入选”之后的错误。`,
    resources: [
      resource('rerank', '按 Retrieve & Re-Rank Pipeline 阅读候选检索和 CrossEncoder 打分两个阶段，查看每一阶段的输入。'),
      resource('context', '对照改变相关文档位置的实验设计，练习说明怎样保持证据、一组干扰文档及总长度一致。'),
      resource('qa', '借助 tokenizer 返回的 input_ids 检查实际拼接文本的长度。'),
    ], problemIds: ['ai-rerank-context-budget','ai-passage-grouping'],
    prompts: ['给我五个长度和分数不同的片段、分隔符和预算，等我说出入选 ID 后再评分。', '已知证据进入候选池，但答案仍错。请追问我如何分别检验重排、截断和提示中的位置。'],
  },
  {
    id: 'learn-retrieval-ranking-metrics', track, title: '对齐 Recall、MRR 与 nDCG 的计算口径',
    summary: '把检索输出与人工相关性标注逐查询对齐，比较覆盖、首次命中和分级排序。',
    body: `## 问题

同一模型升级后，相关文档进入候选池的数量增加，但第一个答案出现得更晚。先按查询保存排名和标注，再用不同指标描述这两种变化。

## 术语

- Recall@k 是前 k 名命中的不同相关文档数除以该查询全部相关文档数。
- RR@k 是前 k 名中第一个相关文档名次的倒数；没有命中记 0。MRR@k 是各查询 RR@k 的等权平均。
- nDCG@k 是实际排序的折扣累计增益除以所有相关性标注能够达到的理想折扣累计增益。本练习第 r 名的贡献为 (2 的 grade 次方−1)/log₂(r+1)。零理想增益记 0。

## 算一遍

对查询 Q，已知 A 等级为 3、B 等级为 1，其他文档为 0。系统返回 [X,B,A]，k=2。前两名只命中 B，Recall@2 为 1/2，RR@2 为 1/2。实际增益为 1/log₂3，理想增益为 7+1/log₂3，nDCG@2 约为 0.083。即使系统漏掉 A，A 仍参与理想排序。

若第二个查询一个命中都没有，两查询的 MRR@2 是 (0.5+0)/2=0.25。若从同一文档返回重复片段，先把片段映射为评测文档 ID 并规定去重时机。本练习的 Recall 和 MRR 先去重再截断，nDCG 题则直接接收已去重的排序。

## 怎样比较

用同一批查询、同一标注和相同 k 比较两套系统，并明确增益是等级值还是指数增益。记录两种排名变化：交换已入选文档的位置会改变 MRR 或 nDCG，加入此前遗漏的相关文档可以提高召回率。对无相关标注的查询，本练习保留查询并给 0；与外部库对比时同步这一约定。`,
    resources: [
      resource('ir', '分别查 R、RR 和 nDCG 的 cutoff 与相关性参数，尤其查看 nDCG 的 dcg 和 gains 取值。'),
      resource('beir', '阅读 README 中 corpus、queries、qrels 与检索结果的对应，并对照 EvaluateRetrieval 的评测示例。'),
    ], problemIds: ['ai-ranking-recall-mrr','ai-graded-ndcg'],
    prompts: ['给两套前三名结果，使一套 Recall 更高、另一套 MRR 更高，让我手算并解释该选哪个指标。', '我的 nDCG 和外部评测库不同，请按增益、截断、并列、空标注和 IDCG 来源逐项提问。'],
  },
  {
    id: 'learn-retrieval-citation-audit', track, title: '逐条判断回答引用是否支持断言',
    summary: '从回答、引用和证据标注构造可手算的引用评测，区分正确引用与断言覆盖。',
    body: `## 问题

一条回答声称“优化器状态以 FP32 保存，推理时使用 BF16”。运行记录 E1 能证明前半句，记录 E2 能证明后半句。若两条断言都引用 E1，引用格式看起来完整，逐条对齐时会发现只有一条获得了正确支持。

## 术语

- 引用对由一条断言和它实际指向的一份文档构成，同一断言对同一出处的重复标记只计一次。
- 本练习的引用精确率等于有支持关系的实际引用对数除以全部实际引用对数。
- 本练习的断言覆盖率等于具有至少一个正确引用的断言数除以全部可核验断言数。

## 算一遍

若第一条引用 [E1,E3]、第二条引用 [E2]，且两条断言分别仅获 E1、E2 支持，正确引用有两对，实际引用有三对，精确率为 2/3。每条断言都有正确证据，覆盖率为 1。再删除第二条的全部引用，精确率变为 1/2，覆盖率变为 1/2。原文包含更多正确材料并不会自动增加实际引用对的正确数。

Ragas 的 faithfulness 将回答拆成断言，再考察整个检索上下文能否支持各条断言。ALCE 研究回答中的具体引用与文本支持关系。本地题直接给出人工标注的“文档能独立支持断言”关系，练习复现计数过程；若结论需要联合使用两份文档，可把标注扩展成多份文档组成的证据集合，并按集合是否被引用评测。

## 怎样比较

固定同一答案、同一证据标注，分别删除正确引用、增加错误引用、重复同一引用，计算两个指标并找出各自变化的计数。再固定检索上下文与回答，单独替换引用来源，观察断言的上下文支持情况和实际引用质量如何分别变化。`,
    resources: [
      resource('alce', '阅读 citation quality 部分，区分一条陈述获得的整组证据与单个引用作出的贡献。'),
      resource('alceCode', '在评测代码中追踪生成回答中的引用编号如何映射回检索文档。'),
      resource('ragas', '阅读 How It’s Calculated，把整段上下文支持的断言数与实际引用对的计数做一次手算比较。'),
    ], problemIds: ['ai-citation-evidence','ai-chunk-offsets'],
    prompts: ['给三条断言、四个证据 ID 和模型引用结果，等我算出两个分数后检查每个分母。', '如果一条断言必须同时引用两个证据才能成立，请让我设计新的标注格式、判分函数和一个反例。'],
  },
];

module.exports = { problems, tutorials };
