'use strict';

const ioPractice = { label: '输入格式练习 · 牛客', url: 'https://www.nowcoder.com/exam/oj/ta?tpId=372' };
const question = fields => ({
  category: '算法 OJ', mode: 'stdio', signature: '标准输入 → 标准输出', rubric: [],
  source: ioPractice, ...fields,
});
const example = (input, expected) => ({ args: [input], expected });

module.exports = [
  question({
    id: 'io-ledger', title: '多批库存流水', topic: '标准输入输出', difficulty: '基础',
    summary: '读到文件末尾，分别求出每一批流水所需的最低期初库存。',
    statement: '每一行是一批独立的库存流水。行首整数 n 是记录数，随后 n 个整数表示按时间排序的库存增减。求一个最小的非负期初库存，使每次增减后的库存都至少为 0。每行输出该批的期初库存。读到文件末尾（EOF）结束；n 可以为 0，此时输出 0。所有行共至多 200000 条记录，每个变动量的绝对值至多 10^9。',
    starter: 'import sys\n\nfor line in sys.stdin:\n    n, *changes = map(int, line.split())\n    # 计算这一批流水的期初库存并输出。\n    pass\n',
    solution: `import sys

for line in sys.stdin:
    n, *changes = map(int, line.split())
    balance = lowest = 0
    for change in changes:
        balance += change
        lowest = min(lowest, balance)
    print(-lowest)
`,
    explanation: '把期初库存设为 0，记下每个前缀的累计变动量，包括空前缀的 0。向上平移最低值至 0，就得到所有前缀均可行的最小期初库存。每行的余额和最低值从头计算。时间与本行记录数成正比。',
    cases: [
      example('4 -3 2 -5 7\n3 4 -1 -2\n0\n', '6\n0\n0\n'),
      example('1 -8', '8\n'),
      example('3\t-2  -1  3\n2 -1000000000 -1000000000\n', '3\n2000000000\n'),
      example('0\n1 0\n2 -1 1\n2 -1 1\n', '0\n0\n1\n1\n'),
    ],
  }),
  question({
    id: 'io-monitor', title: '监控在线时长', topic: '区间合并', difficulty: '中等',
    summary: '从无序监控记录中计算覆盖时长和最长连续在线时长。',
    statement: '第一行是记录数 n（0 到 200000），接下来 n 行各给两个整数 l r（0 ≤ l < r ≤ 10^12），表示某台监控设备在左闭右开区间 [l,r) 在线。任意一台在线就算系统在线。输出两个整数，依次为系统在线的总时长和最长一次连续在线的时长，用空格分隔。相邻端点相同的区间连续；n 为 0 时输出 0 0。',
    starter: "import sys\n\nlines = iter(sys.stdin)\nn = int(next(lines))\nintervals = [tuple(map(int, next(lines).split())) for _ in range(n)]\n# 合并记录并输出两个时长。\n",
    solution: `import sys

lines = iter(sys.stdin)
n = int(next(lines))
intervals = sorted(tuple(map(int, next(lines).split())) for _ in range(n))

total = longest = 0
if intervals:
    left, right = intervals[0]
    for start, end in intervals[1:]:
        if start <= right:
            right = max(right, end)
        else:
            total += right - left
            longest = max(longest, right - left)
            left, right = start, end
    total += right - left
    longest = max(longest, right - left)
print(total, longest)
`,
    explanation: '按开始时间排序。下一段从当前右端或更早开始时，取两个右端的最大值；出现空档时结算当前段。循环后再结算最后一段。排序耗时 O(n log n)，扫描耗时 O(n)。',
    source: { label: '延伸练习 · CSES Restaurant Customers', url: 'https://cses.fi/problemset/task/1619/' },
    cases: [
      example('5\n8 9\n2 4\n3 5\n5 7\n2 3\n', '6 5\n'),
      example('0\n', '0 0\n'),
      example('3\n91 1000000000000\n1 2\n0 1\n', '999999999911 999999999909\n'),
      example('4\n1 7\n1 7\n3 4\n7 8\n', '7 7\n'),
    ],
  }),
  question({
    id: 'io-relay', title: '服务节点的最近副本', topic: '多源 BFS', difficulty: '中等',
    summary: '解析节点与边的输入，用一次广度优先搜索计算每个节点的最短距离。',
    statement: '第一行包含 n m k，依次是节点数、无向连接数、已有副本的节点数。节点从 1 到 n 编号；1 ≤ k ≤ n ≤ 200000，0 ≤ m ≤ 200000。第二行给出 k 个互异的副本节点，随后 m 行各含两个节点编号 u v，每条连接耗时 1。按节点编号顺序在一行输出到最近副本的最短耗时，以空格分隔。已有副本输出 0，无法到达任何副本输出 -1。',
    starter: "import sys\nfrom collections import deque\n\nlines = iter(sys.stdin)\nn, m, k = map(int, next(lines).split())\nsources = list(map(int, next(lines).split()))\n# 读入边并计算每个节点的距离。\n",
    solution: `import sys
from collections import deque

lines = iter(sys.stdin)
n, m, k = map(int, next(lines).split())
sources = list(map(int, next(lines).split()))
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    u, v = map(int, next(lines).split())
    adj[u].append(v)
    adj[v].append(u)

dist = [-1] * (n + 1)
queue = deque(sources)
for vertex in sources:
    dist[vertex] = 0
while queue:
    u = queue.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            queue.append(v)
print(*dist[1:])
`,
    explanation: '把全部副本作为距离为 0 的第一层。所有边代价相同，队列依距离从小到大展开，第一次访问一个节点时得到到最近副本的最短距离。时间和空间均为 O(n+m)。',
    source: { label: '延伸练习 · CSES Message Route', url: 'https://cses.fi/problemset/task/1667/' },
    cases: [
      example('7 5 2\n1 5\n1 2\n2 3\n3 4\n4 5\n6 7\n', '0 1 2 1 0 -1 -1\n'),
      example('1 0 1\n1\n', '0\n'),
      example('4 0 2\n4 2\n', '-1 0 -1 0\n'),
      example('4 4 1\n4\n1 2\n2 3\n3 1\n1 4\n', '1 2 2 0\n'),
    ],
  }),
  question({
    id: 'io-job-queue', title: '支持改优先级的作业队列', topic: '堆与模拟', difficulty: '进阶',
    summary: '按命令流添加、更新、取消和取出作业，处理同优先级与重复添加。',
    statement: '第一行是操作数 q（1 到 200000），随后每行是一条命令。SET id p 新增或更新作业，把其优先级设为整数 p。DEL id 取消作业，作业已离开队列时跳过。TAKE 取出并删除优先级最高的作业，输出其 id；同优先级取字典序最小的 id；空队列输出 EMPTY。仅 TAKE 产生输出，每个结果独占一行。id 是 1 到 20 个小写英文字母，p 的绝对值至多 10^9，同一 id 可以在取消或取出后重新加入。',
    starter: "import sys\nimport heapq\n\nlines = iter(sys.stdin)\nq = int(next(lines))\nfor _ in range(q):\n    command = next(lines).split()\n    # 根据 SET、DEL 或 TAKE 更新队列。\n    pass\n",
    solution: `import sys
import heapq

lines = iter(sys.stdin)
q = int(next(lines))
live = {}
heap = []
for _ in range(q):
    command = next(lines).split()
    if command[0] == "SET":
        name, priority = command[1], int(command[2])
        live[name] = priority
        heapq.heappush(heap, (-priority, name))
    elif command[0] == "DEL":
        live.pop(command[1], None)
    else:
        while heap:
            neg_priority, name = heapq.heappop(heap)
            if live.get(name) == -neg_priority:
                del live[name]
                print(name)
                break
        else:
            print("EMPTY")
`,
    explanation: '字典记录当前有效优先级，小根堆按负优先级与 id 排序。取出时不断跳过已删除或优先级已改变的记录，随后删除选中 id 的字典项。同一 id 先后拥有相同优先级时，任一对应堆项都表示同一个当前作业，取走一次后其余副本自动失效。每条堆记录至多进出一次，总时间 O(q log q)，空间 O(q)。',
    cases: [
      example('9\nSET z 4\nSET a 4\nTAKE\nSET z 1\nSET b 2\nDEL b\nTAKE\nTAKE\nDEL z\n', 'a\nz\nEMPTY\n'),
      example('5\nSET b -2\nSET aa -2\nTAKE\nTAKE\nTAKE\n', 'aa\nb\nEMPTY\n'),
      example('10\nSET x 5\nDEL x\nSET x 5\nSET x 7\nSET x 5\nSET y 6\nTAKE\nTAKE\nTAKE\nTAKE\n', 'y\nx\nEMPTY\nEMPTY\n'),
      example('2\nSET one 0\nDEL one\n', ''),
    ],
  }),
];
