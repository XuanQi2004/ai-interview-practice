'use strict';

const track = '机器学习基础';
const refs = {
  micro: ['micrograd · 标量引擎', 'Andrej Karpathy', '开源库', 'https://github.com/karpathy/micrograd/blob/master/micrograd/engine.py', '在 Value.__mul__ 与 backward 中追踪同一变量参与两次乘法时的梯度累加。'],
  zero: ['Neural Networks: Zero to Hero', 'Andrej Karpathy', '课程', 'https://karpathy.ai/zero-to-hero.html', '从第一讲的 micrograd 例子开始，手算一个标量表达式，再和 PyTorch 的梯度比较。'],
  recipe: ['A Recipe for Training Neural Networks', 'Andrej Karpathy', '博客', 'https://karpathy.github.io/2019/04/25/recipe/', '读第 2 节的 get dumb baselines 和第 3 节 Overfit，观察单个批次的初始损失及参数更新。'],
  chain: ['CS231n · Backpropagation', 'Stanford CS231n', '课程', 'https://cs231n.github.io/optimization-2/', '阅读 Gradients for vectorized operations 和链式法则示例，检查梯度轴与累加方向。'],
  linear: ['线性回归的从零开始实现', '《动手学深度学习》作者团队', '课程', 'https://zh.d2l.ai/chapter_linear-networks/linear-regression-scratch.html', '选择 PyTorch 版本，读小批量数据、损失和参数更新；把线性输出接到不同损失上。'],
  bce: ['BCEWithLogitsLoss', 'PyTorch', '文档', 'https://docs.pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html', '核对 logits 输入、reduction 和 pos_weight 的含义，用官方 loss 验证数值。'],
  conv: ['CS231n · Convolutional Networks', 'Stanford CS231n', '课程', 'https://cs231n.github.io/convolutional-networks/', '在 Convolutional Layer 中读感受野、步幅和零填充，自己画一个输出位置读取的输入。'],
  channels: ['多输入多输出通道', '《动手学深度学习》作者团队', '课程', 'https://zh.d2l.ai/chapter_convolutional-neural-networks/channels.html', '阅读多输入通道示例，检查各通道互相关结果相加的顺序。'],
  norm: ['BatchNorm1d', 'PyTorch', '文档', 'https://docs.pytorch.org/docs/stable/generated/torch.nn.BatchNorm1d.html', '对照前向和 running_var 两种方差估计，检查 momentum 的加权方向。'],
  kmeans: ['Clustering · K-means', 'scikit-learn', '文档', 'https://scikit-learn.org/stable/modules/clustering.html#k-means', '读 Lloyd 迭代过程与 inertia 的定义，比较分配步骤和中心更新步骤。'],
  kexample: ['Demonstration of k-means assumptions', 'scikit-learn', '文档', 'https://scikit-learn.org/stable/auto_examples/cluster/plot_kmeans_assumptions.html', '结合各向异性、方差不同的示例，观察欧氏距离假设对聚类的影响。'],
  auc: ['roc_auc_score', 'scikit-learn', '文档', 'https://scikit-learn.org/stable/modules/generated/sklearn.metrics.roc_auc_score.html', '阅读二分类 y_score 与 sample_weight 的说明，用概率或原始决策分数核对 AUC。'],
  roc: ['Multiclass Receiver Operating Characteristic', 'scikit-learn', '文档', 'https://scikit-learn.org/stable/auto_examples/model_selection/plot_roc.html', '观察 one-vs-rest 曲线与 micro、macro 聚合，理解二分类实现如何扩展。'],
};
function resource(key) {
  const [title, author, kind, url, note] = refs[key];
  return { title, author, kind, url, note };
}
function exercise(key, title, params, entry, summary, statement, solution, explanation, rubric, cases) {
  return {
    id: 'ai-' + key, title, track, category: 'AI 模块', topic: title, difficulty: '中等',
    summary, statement, signature: 'solve(' + params + ')',
    starter: 'def solve(' + params + '):\n    raise NotImplementedError\n',
    solution, explanation, rubric, cases: cases.map(([args, expected]) => ({args, expected})),
    source: { label: refs[entry][0], url: refs[entry][3] },
  };
}

const problems = [
  exercise('scalar-backprop', '反向传播与共享参数', 'nodes', 'micro', '在标量计算图上累加每个节点的导数。',
    'nodes 按拓扑序给出。["input",值] 是输入，["add",a,b]、["mul",a,b] 使用前面两个下标的值。最后一个节点是标量损失 L。返回每个节点的 dL/dvalue，未参与损失的节点导数为 0；同一下标可同时出现在一个算子的两个位置。',
    `def solve(nodes):
    values = []
    for op, *args in nodes:
        if op == "input":
            values.append(args[0])
        else:
            a, b = args
            values.append(values[a] + values[b] if op == "add" else values[a] * values[b])
    gradients = [0.0] * len(nodes)
    gradients[-1] = 1.0
    for i in range(len(nodes) - 1, -1, -1):
        op, *args = nodes[i]
        if op != "input":
            a, b = args
            gradients[a] += gradients[i] * (values[b] if op == "mul" else 1)
            gradients[b] += gradients[i] * (values[a] if op == "mul" else 1)
    return gradients`,
    '保存前向值，按逆拓扑顺序应用链式法则。对每条入边都做加法，两个操作数引用同一个节点时两条边都贡献导数。时间、空间均为 O(N)。',
    ['解释损失节点梯度为何从 1 开始。','用 x²+x 说明同一节点的梯度如何累加。'],
    [[[[['input',3],['mul',0,0],['add',1,0]]],[7,1,1]], [[[['input',-2],['input',4],['mul',0,1],['mul',2,0]]],[-16,4,-2,1]], [[[['input',7],['input',2]]],[0,1]]]),
  exercise('logistic-batch', '逻辑回归的稳定损失和梯度', 'x, labels, w, bias', 'bce', '从 logits 求批均值损失和模型参数的梯度。',
    'x 为非空 [N,D] 特征，labels 为 0/1 标签，w 为 [D] 向量。令 z=xw+bias，计算平均二元交叉熵，返回 [loss, dw, db]，dw 是长度 D 的列表。输入含绝对值可达 1000 的 logits；用数值稳定的公式计算。',
    `import math

def solve(x, labels, w, bias):
    grad = [0.0] * len(w)
    loss = db = 0.0
    for row, y in zip(x, labels):
        z = sum(v * weight for v, weight in zip(row, w)) + bias
        loss += max(z, 0) - y * z + math.log1p(math.exp(-abs(z)))
        exp_abs = math.exp(-abs(z))
        p = (1 if z >= 0 else exp_abs) / (1 + exp_abs)
        error = p - y
        for j, value in enumerate(row):
            grad[j] += error * value
        db += error
    n = len(x)
    return [loss / n, [g / n for g in grad], db / n]`,
    '每个样本的 dL/dz 等于 sigmoid(z)−y。把误差乘相应特征然后求均值即可得到权重梯度。按 z 符号计算指数，可以处理很大的正负输入。',
    ['说明 bias 梯度与 w 梯度的差别。','展示 z=1000 且 y=0 时的损失与梯度。'],
    [[[[[2,0],[0,4]],[1,0],[0,0],0],[Math.log(2),[-0.5,1],0]], [[[[1],[-1]],[0,1],[1000],0],[1000,[1],0]], [[[[0]],[1],[9],Math.log(3)],[Math.log(4/3),[0],-0.25]]]),
  exercise('lloyd-step','K-means 分配与中心更新','points, centers','kmeans','完成一次 Lloyd 迭代并按新中心计算簇内误差。',
    'points 和 centers 均为非空列表，行宽一致。将每个样本分到最近的旧中心（平方欧氏距离；平局选下标较小者），再对各簇取均值，空簇沿用旧中心。返回 [样本簇下标, 新中心, inertia]。inertia 是保持本轮分配并按新中心计算的平方距离总和。',
    `def solve(points, centers):
    def distance(a, b):
        return sum((x-y)**2 for x, y in zip(a, b))
    labels = [min(range(len(centers)), key=lambda k: distance(row, centers[k]))
              for row in points]
    totals = [[0.0] * len(centers[0]) for _ in centers]
    counts = [0] * len(centers)
    for row, k in zip(points, labels):
        counts[k] += 1
        for j, value in enumerate(row):
            totals[k][j] += value
    updated = [[v / counts[k] for v in totals[k]] if counts[k] else list(old)
               for k, old in enumerate(centers)]
    return [labels, updated, sum(distance(row, updated[k]) for row, k in zip(points, labels))]`,
    '先用同一组旧中心给所有样本分配标签，再累加每簇各维度总和。若边分配边更新，后面的样本将看到不同的中心。主要耗时为 O(NKD)。',
    ['举例说明相同距离如何决策。','指出计算 inertia 使用的中心与标签。'],
    [[[[[0],[2],[10]],[[0],[10],[30]]],[[0,0,1],[[1],[10],[30]],2]], [[[[1,1],[3,3]],[[0,0],[2,2]]],[[0,1],[[1,1],[3,3]],0]], [[[[2],[4],[6]],[[2]]],[[0,0,0],[[4]],8]]]),
  exercise('rank-auc','含并列分数的 ROC AUC','labels, scores','auc','按分数分组求正负样本的两两排序正确率。',
    'labels 为 0/1 且两类都存在，scores 取值越大越偏向正类。AUC 为随机取一正一负时正例得分更高的概率，加上得分相同概率的一半。实现 O(N log N) 算法，返回浮点数。',
    `from itertools import groupby

def solve(labels, scores):
    negatives_below = wins = 0
    pairs = sorted(zip(scores, labels))
    for _, tied in groupby(pairs, key=lambda pair: pair[0]):
        targets = [y for _, y in tied]
        pos = sum(targets)
        neg = len(targets) - pos
        wins += pos * (negatives_below + neg / 2)
        negatives_below += neg
    positives = sum(labels)
    return wins / (positives * (len(labels) - positives))`,
    '升序遍历分数组，组内正例胜过此前所有负例，并与本组每个负例各算半分。统一在结算本组后增加负例累计数，结果与相同分数样本的输入顺序无关。',
    ['说明所有分数相同时 AUC 的值。','解释严格递增变换对 AUC 的影响。'],
    [[[[1,0,1,0],[2,1,1,0]],0.875],[[[0,1],[4,4]],0.5],[[[1,0,1],[0,2,1]],0]]),
  exercise('channel-correlation','多通道二维互相关','image, kernel, stride, pad','channels','对齐通道、步幅和零填充，手写一个卷积输出通道。',
    'image 形状 [C,H,W]，kernel 形状 [C,Kh,Kw]，两边向四周各补 pad 个零，纵横步幅均为正整数 stride。返回一个输出通道的二维列表。与 Conv2d 的互相关语义一致，核按给定顺序使用，偏置为零。输入保证能放下至少一个窗口。',
    `def solve(image, kernel, stride, pad):
    channels, h, w = len(image), len(image[0]), len(image[0][0])
    kh, kw = len(kernel[0]), len(kernel[0][0])
    out = []
    for top in range(-pad, h + pad - kh + 1, stride):
        row = []
        for left in range(-pad, w + pad - kw + 1, stride):
            value = 0
            for c in range(channels):
                for dy in range(kh):
                    for dx in range(kw):
                        y, x = top + dy, left + dx
                        if 0 <= y < h and 0 <= x < w:
                            value += image[c][y][x] * kernel[c][dy][dx]
            row.append(value)
        out.append(row)
    return out`,
    '枚举每个输出位置，累加落在有效输入范围内的通道和核位置。输出高为 floor((H+2p−Kh)/s)+1，宽的计算相同。',
    ['解释通道轴在计算中怎样被求和。','对非对称核说明翻转的影响。'],
    [
      [[[[[1, 2, 3], [4, 5, 6]]], [[[1, -1]]], 1, 0], [[-1, -1], [-1, -1]]],
      [[[[[1, 2]], [[2, -1]]], [[[1]], [[3]]], 1, 0], [[7, -1]]],
      [[[[[2]]], [[[1, 2], [3, 4]]], 1, 1], [[8, 6], [4, 2]]],
      [[[[[1, 2, 3, 4, 5]]], [[[1, 2]]], 2, 0], [[5, 11]]]
    ]),
  exercise('batchnorm-state','BatchNorm 的训练与推理状态','batch, mean, variance, training, momentum, eps','norm','分别计算训练批次输出与运行统计量的更新。',
    'batch 形状为 [N,C]，仿射系数固定为 1、偏置为 0。训练时 N≥2，用总体方差归一化当前批次；更新 running_var 时用样本方差（分母 N−1）。运行统计量更新为 (1−momentum)·旧值 + momentum·本批统计量。推理时使用传入的 mean、variance。返回 [归一化输出, 更新后的均值, 更新后的方差]。',
    `from math import sqrt

def solve(batch, mean, variance, training, momentum, eps):
    n = len(batch)
    if training:
        mu = [sum(col)/n for col in zip(*batch)]
        var = [sum((x-m)**2 for x in col)/n for col, m in zip(zip(*batch), mu)]
        next_mu = [(1-momentum)*a + momentum*b for a,b in zip(mean,mu)]
        next_var = [(1-momentum)*a + momentum*b*n/(n-1) for a,b in zip(variance,var)]
    else:
        mu, var, next_mu, next_var = mean, variance, mean, variance
    y = [[(x-m)/sqrt(v+eps) for x,m,v in zip(row,mu,var)] for row in batch]
    return [y, next_mu, next_var]`,
    '归一化和状态更新共用批均值，但使用不同的方差估计。推理分支直接读运行统计。时间 O(NC)，除输出外的空间为 O(C)。',
    ['解释训练输出为什么与运行方差的分母不同。','指出推理时哪些状态保持原值。'],
    [
      [[[[1], [3]], [0], [4], true, 0.5, 3], [[[-0.5], [0.5]], [1], [3]]],
      [[[[3, 6]], [1, 3], [3, 8], false, 0.5, 1], [[[1, 1]], [1, 3], [3, 8]]],
      [[[[5], [5]], [0], [4], true, 1, 0.1], [[[0], [0]], [5], [0]]]
    ]),
];

function tutorial(id, title, summary, body, keys, ids, prompts) {
  return {id: 'learn-' + id, title, track, summary, body, resources: keys.map(resource),
    problemIds: ids.map(i => 'ai-' + i), prompts};
}
const tutorials = [
  tutorial('backward-graph','共享参数怎样累加梯度','在 x²+x 的计算图上走一次前向、反向与数值检查。',
    '### 手算一个共享节点\n令 x=3，u=x×x，L=u+x。前向依次得到 3、9、12。反向从 dL/dL=1 开始，末次加法给 u 和 x 各贡献 1；乘法的两个输入都指向 x，各贡献 3。最终 dL/dx=7。若用赋值覆盖梯度，会丢掉同一节点的其他贡献。\n\n### 写成 Python\n先按拓扑顺序保存每个节点的值，再逆序访问。对乘法 y=a×b，分别执行 grad[a] += grad[y]×value[b] 和 grad[b] += grad[y]×value[a]。重复的操作数也要做两次累加。\n\n### 检查一个局部错误\n比较 (L(3+h)−L(3−h))/(2h) 与手算导数，取 h=0.001。接着在图中加一个与 L 无关的输入，它的导数应保持为零。打开 micrograd 的 Value 类，找出与这两个检查对应的代码。',
    ['micro','zero','chain'],['scalar-backprop'],['把 x²+x 改为 (x²+x)²，带我手算梯度。','为什么从输出按逆拓扑序遍历？']),
  tutorial('binary-objective','让二分类损失在极端输入下仍能训练','用初始损失、梯度方向和大幅 logits 检验一个小批次。',
    '### 从零参数开始\n设特征为 [[2,0],[0,4]]，标签 [1,0]，权重和偏置都是零。两个正类概率均为 0.5，每个样本的损失均为 log(2)。误差 p−y 分别为 −0.5 和 0.5，取均值后 dw=[−0.5,1]，db=0。按梯度下降更新，第一维权重增加，第二维减少。\n\n### 稳定计算\n对单个 logit z 与标签 y，可用 max(z,0)−y×z+log1p(exp(−abs(z))) 求损失。令 z=1000、y=0，损失约为 1000，dL/dz 约为 1。这个例子能发现指数溢出以及取 log(0) 的实现错误。\n\n### 独立验证\n先在零参数处打印损失，再与 PyTorch 的 BCEWithLogitsLoss 在同一批数据上对照。用一个小批次重复更新，观察标签为 1 的样本分数是否逐步上升。Karpathy 的训练笔记给出了从简单基线定位问题的做法。',
    ['bce','linear','recipe'],['logistic-batch','scalar-backprop'],['为什么 p−y 已经包含了 sigmoid 的导数？','把均值损失改为求和后，参数梯度怎样变化？']),
  tutorial('conv-and-bn','卷积和 BatchNorm 各沿哪些轴计算','从一个输出像素和两条训练样本，分别算出层输出与运行状态。',
    '### 一个二维窗口\n输入单通道行 [1,2,3]，核 [1,−1]，步幅为 1。两个窗口的输出都是 −1。如果再加入第二个输入通道，给它单独的核，把两个通道对应位置的结果相加。输出通道数等于这样的核组数。\n\n### 一个批次的两种方差\n某一通道的批次值是 [1,3]，均值为 2，总体方差为 1，样本方差为 2。设 eps=3，训练输出分别为 −0.5 和 0.5。若原 running_var=4，momentum=0.5，则更新后的 running_var=3。\n\n### 验证形状与状态\n换一个非对称核检验输出符号，放大步幅检验窗口位置。随后把 BatchNorm 切换到推理模式，给只有一行的批次，用已有均值与方差算输出，检查两项运行状态保持原值。',
    ['channels','conv','norm'],['channel-correlation','batchnorm-state'],['用一个非对称核说明二维卷积与互相关的差异。','为什么训练 batch 的输出使用分母 N，running_var 却使用 N−1？']),
  tutorial('kmeans-iteration','手算一次 K-means 并解释每个输出','通过固定中心把距离计算、分簇和误差计算拆开。',
    '### 做一次迭代\n一维样本为 [0,2,10]，旧中心为 [0,10,30]。按旧中心分配得到标签 [0,0,1]，前两个样本均归入簇 0。重算中心后得到 [1,10,30]，空的簇 2 按本题约定保留原中心。\n\n### 计算 inertia\ninertia 是所有样本到所属中心的平方欧氏距离之和。使用新中心与当前标签，误差为 (0−1)²+(2−1)²+(10−10)²=2。拿更新前后的中心都算一次，可以发现实现中是否混用了两组中心。\n\n### 从代码看建模假设\n把一个特征放大十倍，该维对平方距离的贡献放大一百倍。在 scikit-learn 的示例中观察簇的形状，再解释为何欧氏距离与均值更新配套使用。',
    ['kmeans','kexample'],['lloyd-step'],['若边分配边更新，换一组样本顺序会发生什么？','怎样以矩阵运算得到全部样本到全部中心的距离？']),
  tutorial('auc-ties','相同分数的样本怎样计入 AUC','从正负样本配对推导只需一次排序的计算方法。',
    '### 手算四个正负配对\n正例分数为 [2,1]，负例分数为 [1,0]。四对贡献依次是 1、1、0.5、1，因此 AUC=3.5/4=0.875。相同分数计半分，改变这些样本的输入顺序不影响结果。\n\n### 一次排序\n升序处理每一组相同分数。若当前组有 p 个正例、n 个负例，之前已经过 m 个负例，向分子加入 p×(m+n/2)，再把 n 加入 m。最后除以正例总数与负例总数的乘积。\n\n### 解释指标\n将所有分数都乘以 10 再加 3，排序与并列关系保持，AUC 相同。对推荐或检索系统，AUC 描述全体正负配对；要研究最前面几个位置，应再选择与截断位置相关的指标。',
    ['auc','roc'],['rank-auc'],['并列时全部给一分会对模型评价产生什么影响？','给样本加权后，如何修改这一遍分组统计？']),
];
module.exports = { problems, tutorials };
