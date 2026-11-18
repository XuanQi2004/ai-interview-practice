// 题目和参考实现均为本地练习编写；每个链接对应同专题的原站题。
function exercise(id, title, topic, difficulty, summary, statement, params, body, explanation, slug, tests) {
  const signature = `def solve(${params}):`;
  return {
    id, title, category: '算法 OJ', topic, difficulty, summary, statement, signature,
    starter: `${signature}\n    pass\n`,
    solution: `${signature}\n${body.trimEnd()}\n`, explanation,
    cases: tests.map(([args, expected]) => ({ args, expected })),
    source: { label: '力扣 · 同专题原题', url: `https://leetcode.cn/problems/${slug}/` },
    rubric: []
  };
}

module.exports = [
  exercise('pair-budget', '配对预算', '哈希表', '简单', '从记录中找出总和等于预算的两个位置。',
    '给定整数数组 values 和整数 budget，返回两个不同下标 [i, j]，使 i < j 且 values[i] + values[j] 等于 budget。存在多组答案时，优先选择 j 最小的一组，再选择 i 最小的一组。找不到时返回 []。数组可以含有重复值和负数。',
    'values, budget', `    first = {}
    for j, value in enumerate(values):
        complement = budget - value
        if complement in first:
            return [first[complement], j]
        first.setdefault(value, j)
    return []`,
    '从左到右枚举右端 j，只在左侧已出现的数字里查补数。字典为每个数保留最早的下标，因此第一次命中就满足两个优先条件。平均时间 O(n)，额外空间 O(n)。', 'two-sum',
    [[[[4,7,1,6],8],[1,2]],[[[3,3],6],[0,1]],[[[2,2,8],10],[0,2]],[[[4],8],[]],[[[],0],[]],[[[-2,0,5,1],3],[0,2]],[[[0,1,4,3],4],[0,2]]]),

  exercise('token-window', '最长单一出现片段', '滑动窗口', '中等', '在 token 序列中找出元素互异的最长连续片段。',
    'tokens 是字符串数组。返回一个连续子数组的最大长度，要求该子数组内每一种 token 都只出现一次。相等性按完整字符串判断，大小写敏感。空数组返回 0。',
    'tokens', `    last = {}
    left = best = 0
    for right, token in enumerate(tokens):
        left = max(left, last.get(token, -1) + 1)
        last[token] = right
        best = max(best, right - left + 1)
    return best`,
    '字典记录每种 token 最近一次出现的位置。右端加入当前 token 后，把左端移到冲突位置之后。取 max 可避免一次很早的重复把左端移回去。平均时间 O(n)，额外空间 O(u)，u 是 token 种数。', 'longest-substring-without-repeating-characters',
    [[[['a','b','b','a','c']],3],[[[]],0],[[['x','x','x']],1],[[['ab','a','b']],3],[[['苏','A','a','苏']],3],[[['']],1],[[['a','b','c','a','d','b']],4]]),

  exercise('sum-spans', '目标净变化的片段数', '前缀和', '中等', '统计总变化量恰好等于目标的连续区间。',
    'changes 是按时间排列的整数，可正可负。返回有多少个非空连续片段的元素和恰好等于 target。不同起止位置分别计数。空数组返回 0。',
    'changes, target', `    counts = {0: 1}
    total = answer = 0
    for change in changes:
        total += change
        answer += counts.get(total - target, 0)
        counts[total] = counts.get(total, 0) + 1
    return answer`,
    '若当前位置的前缀和为 s，左边界之前的前缀和就应是 s−target。先查询出现次数，再登记当前前缀，确保所计片段非空。初始的 0 表示从下标 0 开始。平均时间 O(n)，空间 O(n)。', 'subarray-sum-equals-k',
    [[[[1,-1,1],1],3],[[[],3],0],[[[0,0,0],0],6],[[[-3],-3],1],[[[2,2,2],3],0],[[[1,2,1,2],3],3]]),

  exercise('range-bounds', '分数的索引区间', '二分查找', '中等', '在有序数组中定位重复分数的完整范围。',
    'scores 按非递减顺序排列。返回值等于 target 的下标范围 [left, right)，右端为最后一次匹配的下标加一。若不存在该值，两个端点都取保持有序时最靠左的插入位置。请尝试对数时间。',
    'scores, target', `    def boundary(after):
        low, high = 0, len(scores)
        while low < high:
            mid = (low + high) // 2
            if scores[mid] < target or (after and scores[mid] == target):
                low = mid + 1
            else:
                high = mid
        return low

    return [boundary(False), boundary(True)]`,
    '分别寻找第一个大于等于 target 的位置，以及第一个严格大于 target 的位置。以 len(scores) 作为所有值均小时的答案。两次二分总时间 O(log(n+1))，额外空间 O(1)。', 'find-first-and-last-position-of-element-in-sorted-array',
    [[[[1,3,3,3,8],3],[1,4]],[[[],8],[0,0]],[[[2,4],3],[1,1]],[[[2,4],1],[0,0]],[[[2,4],5],[2,2]],[[[4,4,4],4],[0,3]]]),

  exercise('next-rise', '下次吞吐上升', '单调栈', '中等', '为每个时间点找到下一次严格更高的观测值。',
    '给定每日的整数观测值 readings。按原顺序返回一个数组，位置 i 的值是从 i 到之后第一次严格高于 readings[i] 的位置相隔的天数。不存在时填 0。相等读数不算上升。',
    'readings', `    waiting = []
    answer = [0] * len(readings)
    for day, value in enumerate(readings):
        while waiting and readings[waiting[-1]] < value:
            previous = waiting.pop()
            answer[previous] = day - previous
        waiting.append(day)
    return answer`,
    '栈内存下标，对应的观测值从底到顶非递增。当前值严格大于栈顶时结算栈顶；相等值继续等待。每个下标各入栈一次、至多出栈一次。时间 O(n)，空间 O(n)。', 'daily-temperatures',
    [[[[3,3,5,2,6]],[2,1,2,1,0]],[[[]],[]],[[[4,4,4]],[0,0,0]],[[[4,3,2]],[0,0,0]],[[[-2,-1,0]],[1,1,0]],[[[5]],[0]]]),

  exercise('memory-windows', '合并占用时段', '区间合并', '中等', '把重叠或相接的时间区间整理为连续占用时段。',
    '每条记录 [start, end] 表示半开区间 [start, end)，端点是整数且 start < end。返回按起点递增的占用时段列表，覆盖的时间与输入相同。重叠或首尾相接的记录合并。输入可以为空，顺序任意。',
    'intervals', `    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    '排序后只需比较最后一个输出段的右端和当前起点。相接时同样合并，嵌套区间通过取较大右端处理。时间 O(n log n)，复制排序和输出使用 O(n) 空间。', 'merge-intervals',
    [[[[[7,9],[1,3],[3,5],[2,4]]],[[1,5],[7,9]]],[[[]],[]],[[[[1,8],[2,3],[1,8]]],[[1,8]]],[[[[-4,0],[0,1]]],[[-4,1]]],[[[[4,5]]],[[4,5]]],[[[[4,5],[1,2]]],[[1,2],[4,5]]]]),

  exercise('rank-stream', '逐次查询第 k 大', '堆', '中等', '一边接收分数，一边返回当前的第 k 大值。',
    '顺次读入整数分数 scores。每加入一个分数，就输出目前所有分数中的第 k 大值，相同分数按出现次数计。已接收的分数少于 k 个时，该次输出 None。k 是正整数；返回与 scores 等长的列表。',
    'scores, k', `    import heapq
    top = []
    result = []
    for score in scores:
        if len(top) < k:
            heapq.heappush(top, score)
        elif score > top[0]:
            heapq.heapreplace(top, score)
        result.append(top[0] if len(top) == k else None)
    return result`,
    '用大小最多为 k 的小顶堆保存已见过的最大 k 个数。堆满后，堆顶就是第 k 大。时间 O(n log(k+1))，除返回值外空间 O(min(n,k))。', 'kth-largest-element-in-a-stream',
    [[[[4,8,2,9],2],[null,4,4,8]],[[[],1],[]],[[[7,7,7],2],[null,7,7]],[[[-3,-1,-2],1],[-3,-1,-1]],[[[1,2],3],[null,null]],[[[8,2,7,1],3],[null,null,2,2]]]),

  exercise('linked-cycle', '链表循环入口', '链表', '中等', '沿单向指针查找从起点可以到达的环入口。',
    '用数组 nxt 表示链表指针：nxt[i] 是节点 i 的下一个下标，-1 表示结束。head 是起点或 -1。每个指针都合法。返回从 head 出发第一个会被第二次访问的节点下标；如果遍历会结束，返回 -1。尝试使用常量额外空间。',
    'nxt, head', `    slow = fast = head
    while fast != -1 and nxt[fast] != -1:
        slow = nxt[slow]
        fast = nxt[nxt[fast]]
        if slow == fast:
            probe = head
            while probe != slow:
                probe = nxt[probe]
                slow = nxt[slow]
            return probe
    return -1`,
    '快指针每次两步，慢指针每次一步。在环中相遇时，慢指针已走的距离是环长的整数倍。一个指针回到起点，两个指针同速前进，便在入口相遇。时间 O(n)，额外空间 O(1)。', 'linked-list-cycle-ii',
    [[[[2,-1,3,4,2],0],2],[[[],-1],-1],[[[0],0],0],[[[1,-1],0],-1],[[[1,0,-1],2],-1],[[[2,2,3,2],1],2]]),

  exercise('tree-profile', '树的逐层统计', '二叉树', '中等', '计算二叉树每一层的节点值之和。',
    'nodes[i] 是 [value, left, right]，两个子节点用下标表示，-1 为空。输入是一棵树，非空时根下标为 0，每个节点从根可达。按从根到叶的顺序返回各层的节点值之和。空树返回 []。',
    'nodes', `    from collections import deque
    if not nodes:
        return []
    queue = deque([0])
    sums = []
    while queue:
        level_sum = 0
        for _ in range(len(queue)):
            value, left, right = nodes[queue.popleft()]
            level_sum += value
            if left != -1:
                queue.append(left)
            if right != -1:
                queue.append(right)
        sums.append(level_sum)
    return sums`,
    '每一轮先取当前队列长度，此轮只弹出这一层的节点；产生的子节点在下一轮处理。时间 O(n)，队列最多存储 O(w) 个节点，w 是树的最大层宽。', 'binary-tree-level-order-traversal',
    [[[[[3,1,2],[6,-1,-1],[-2,3,-1],[8,-1,-1]]],[3,4,8]],[[[]],[]],[[[[-1,-1,-1]]],[-1]],[[[[2,-1,1],[2,2,-1],[-3,-1,-1]]],[2,2,-3]],[[[[0,2,1],[4,-1,-1],[-4,-1,-1]]],[0,0]]]),

  exercise('grid-distance', '网格最短步数', '广度优先搜索', '中等', '在有障碍的网格中求两个位置之间的最少步数。',
    'grid 是非空等长的字符串列表，字符 . 可通行、# 为障碍。start、goal 均为有效的 [行, 列]。每步上下左右移动一格。返回最少移动次数；任一端点在障碍上或两者不连通时返回 -1。',
    'grid, start, goal', `    from collections import deque
    origin, target = tuple(start), tuple(goal)
    if grid[origin[0]][origin[1]] == "#" or grid[target[0]][target[1]] == "#":
        return -1
    queue = deque([(origin, 0)])
    seen = {origin}
    while queue:
        (r, c), distance = queue.popleft()
        if (r, c) == target:
            return distance
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]):
                if grid[nr][nc] == "." and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    queue.append(((nr, nc), distance + 1))
    return -1`,
    '将格子视作节点，每个相邻移动的代价相同。BFS 以距离递增的顺序扩展节点，入队时标记可避免重复遍历。R 行 C 列的时间和空间均为 O(RC)。', 'shortest-path-in-binary-matrix',
    [[[['..#','.#.','...'],[0,0],[1,2]],5],[[['.'],[0,0],[0,0]],0],[[['#'],[0,0],[0,0]],-1],[[['.#','#.'],[0,0],[1,1]],-1],[[['..'],[0,0],[0,1]],1],[[['.#'],[0,0],[0,1]],-1]]),

  exercise('dependency-rounds', '依赖任务的最少轮数', '拓扑排序', '中等', '计算所有任务在并行执行时需要多少轮。',
    '有 n 个任务，编号 0 到 n−1。[a, b] 表示 b 必须等 a 完成后才能开始，依赖边互异。每项任务耗时一轮，同一轮可并行执行任意多个已就绪的任务。返回全部完成的最少轮数；存在依赖环时返回 -1；n 为 0 时返回 0。',
    'n, edges', `    from collections import deque
    children = [[] for _ in range(n)]
    indegree = [0] * n
    for parent, child in edges:
        children[parent].append(child)
        indegree[child] += 1
    ready = deque(i for i in range(n) if indegree[i] == 0)
    done = rounds = 0
    while ready:
        rounds += 1
        for _ in range(len(ready)):
            parent = ready.popleft()
            done += 1
            for child in children[parent]:
                indegree[child] -= 1
                if indegree[child] == 0:
                    ready.append(child)
    return rounds if done == n else -1`,
    '剩余入度为零代表前置任务均已完成。一轮只处理轮初就绪的任务，新就绪的任务等下一轮。处理数小于任务总数表示剩余依赖存在环。时间与空间均为 O(n+e)，e 为依赖数。', 'course-schedule',
    [[[4,[[0,2],[1,2],[2,3]]],3],[[0,[]],0],[[3,[]],1],[[2,[[0,1],[1,0]]],-1],[[1,[[0,0]]],-1],[[5,[[0,1],[2,3],[3,4]]],3],[[4,[[0,1],[2,3],[3,2]]],-1]]),

  exercise('batch-count', '组装批量大小', '动态规划', '中等', '用可重复使用的固定大小，精确达到目标批量。',
    'sizes 给出若干正整数，每种大小可以使用任意次。返回使总和恰好为 total 所需的最少个数。total 是非负整数；无法组成时返回 -1，total 为 0 时返回 0。',
    'sizes, total', `    impossible = total + 1
    best = [0] + [impossible] * total
    for amount in range(1, total + 1):
        for size in sizes:
            if size <= amount:
                best[amount] = min(best[amount], 1 + best[amount - size])
    return best[total] if best[total] != impossible else -1`,
    '令 best[x] 表示总和 x 的最少个数。枚举最后一个块 size，用 best[x−size]+1 更新。比如大小 1、3、4 组成 6 时，选两个 3 优于从 4 开始的贪心。时间 O(total × len(sizes))，空间 O(total)。', 'coin-change',
    [[[[1,3,4],6],2],[[[],0],0],[[[],2],-1],[[[4,6],7],-1],[[[5],10],2],[[[3,3,6],9],2],[[[9],2],-1]]),

  exercise('edit-tokens', '对齐两个 token 序列', '二维动态规划', '中等', '计算把一个 token 序列变成另一个所需的最少编辑次数。',
    'source、target 是由字符串 token 组成的列表。插入、删除或替换一个完整 token 均计一次，已经相同的 token 可保留。返回把 source 变成 target 所需的最少编辑次数。',
    'source, target', `    previous = list(range(len(target) + 1))
    for i, src in enumerate(source, start=1):
        current = [i]
        for j, dst in enumerate(target, start=1):
            current.append(min(previous[j] + 1, current[j - 1] + 1,
                               previous[j - 1] + (src != dst)))
        previous = current
    return previous[-1]`,
    '状态是两个前缀之间的编辑距离。删除取上一行同列，插入取同一行左列，替换或保留取左上角。空前缀到长度 j 的目标代价为 j。时间 O(mn)，空间 O(n)，n 为目标长度。', 'edit-distance',
    [[[['I','like','AI'],['I','love','AI','tools']],2],[[[],[]],0],[[[],['ab','c']],2],[[['a','b'],[]],2],[[['a','a'],['a']],1],[[['猫'],['猫']],0],[[['a','b'],['b','a']],2]]),

  exercise('span-peak', '滑动窗口峰值', '单调队列', '困难', '在线输出每个固定长度窗口的最大观测值。',
    '输入整数数组 values 和正整数 width。返回按起点顺序排列的每个长度为 width 的连续窗口的最大值。width 超过数组长度时返回 []。请尝试线性时间。',
    'values, width', `    from collections import deque
    candidates = deque()
    peaks = []
    for right, value in enumerate(values):
        while candidates and candidates[0] <= right - width:
            candidates.popleft()
        while candidates and values[candidates[-1]] <= value:
            candidates.pop()
        candidates.append(right)
        if right + 1 >= width:
            peaks.append(values[candidates[0]])
    return peaks`,
    '队列依照下标递增、数值严格递减排列。右侧较新且更大的数能覆盖旧数未来的贡献。左端弹出已过期的下标后，队首对应当前最大值。时间 O(n)，除返回值外空间 O(width)。', 'sliding-window-maximum',
    [[[[2,4,1,4,3],3],[4,4,4]],[[[],2],[]],[[[5],2],[]],[[[3,2,1],1],[3,2,1]],[[[-4,-1,-7],2],[-1,-1]],[[[9,8,7,6],2],[9,8,7]]]),

  exercise('event-capacity', '两项请求的最大可行总量', '双指针', '简单', '在给定总容量内选出两项需求，使使用量最大。',
    'needs 是非负整数数组，capacity 为非负整数。选出两个不同位置的需求，返回和不超过 capacity 的最大总量；任何两项都无法同时容纳时返回 -1。相同数值可以来自两个不同位置。',
    'needs, capacity', `    ordered = sorted(needs)
    left, right = 0, len(ordered) - 1
    best = -1
    while left < right:
        amount = ordered[left] + ordered[right]
        if amount <= capacity:
            best = max(best, amount)
            left += 1
        else:
            right -= 1
    return best`,
    '排序后若两端和超限，右端与区间中任何元素搭配都会超限；若两端和可行，这已是当前左端能取得的最大值。每步排除一个端点。排序主导时间 O(n log n)，复制数组空间 O(n)。', 'two-sum-ii-input-array-is-sorted',
    [[[[6,1,4,7],10],10],[[[],4],-1],[[[2],4],-1],[[[0,0,4],0],0],[[[4,4,5],8],8],[[[5,6],10],-1]]),

  exercise('subset-schedules', '恰好达到工时的组合', '回溯', '中等', '枚举不同工时的若干任务组合。',
    'hours 是互异的正整数数组，每项任务最多选择一次。返回所有工时和为 total 的方案。每个方案中的工时按升序，外层列表按 Python 列表的字典序排列。total 是非负整数，目标为 0 时返回 [[]]。',
    'hours, total', `    ordered = sorted(hours)
    result, path = [], []
    def search(start, remaining):
        if remaining == 0:
            result.append(path.copy())
            return
        for i in range(start, len(ordered)):
            value = ordered[i]
            if value > remaining:
                break
            path.append(value)
            search(i + 1, remaining - value)
            path.pop()
    search(0, total)
    return result`,
    '从当前下标向右选择下一个元素，递归到 i+1 保证每个任务至多用一次。数组排序后，剩余时间小于当前值即可终止这一层枚举。最坏时间 O(n·2ⁿ)，除结果外空间 O(n)。', 'combination-sum-ii',
    [[[[6,2,4,1,3],6],[[1,2,3],[2,4],[6]]],[[[],0],[[]]],[[[],1],[]],[[[1,4],2],[]],[[[4,1,5],5],[[1,4],[5]]],[[[9,11],0],[[]]]]),

  exercise('book-rooms', '并行会话所需房间数', '扫描线', '中等', '利用开始与结束事件计算同时进行的会话数峰值。',
    '每个会话用整数区间 [start, end) 表示，start < end。一个房间同一时刻只能承担一个会话，一个会话结束的时刻可以立即接下一个。返回所需的最少房间数。空输入返回 0。',
    'sessions', `    changes = {}
    for start, end in sessions:
        changes[start] = changes.get(start, 0) + 1
        changes[end] = changes.get(end, 0) - 1
    active = peak = 0
    for time in sorted(changes):
        active += changes[time]
        peak = max(peak, active)
    return peak`,
    '同一时刻开始与结束的事件先合计净变化，再更新当前占用。扫描后得到的最大同时占用是房间数下界；每次开会优先复用空闲房间即可达到这个下界。时间 O(n log n)，空间 O(n)。', 'meeting-rooms-ii',
    [[[[[1,5],[2,4],[4,8]]],2],[[[]],0],[[[[0,1],[1,2]]],1],[[[[2,3],[2,3],[2,3]]],3],[[[[-2,7],[1,3],[2,4],[3,6]]],3],[[[[7,8]]],1]]),

  exercise('cache-trace', 'LRU 缓存访问记录', '缓存设计', '中等', '按访问顺序模拟容量有限的最近最少使用缓存。',
    'capacity 是非负整数。依次执行 ops 中的操作：["put", key, value] 写入整数并将 key 更新为最近使用，["get", key] 返回该键的值并更新其使用顺序，未命中返回 None。key 为字符串。超出容量时删除最久未被使用的键。返回所有 get 的结果。',
    'capacity, ops', `    from collections import OrderedDict
    cache = OrderedDict()
    reads = []
    for op in ops:
        key = op[1]
        if op[0] == "put":
            cache[key] = op[2]
            cache.move_to_end(key)
            if len(cache) > capacity:
                cache.popitem(last=False)
        elif key in cache:
            cache.move_to_end(key)
            reads.append(cache[key])
        else:
            reads.append(None)
    return reads`,
    '让有序字典的头部表示最久未使用的键，尾部表示最近使用的键。读取命中和覆盖写入都把已有键移到尾部。每次操作平均 O(1)，除返回值外空间 O(capacity)。追问可以尝试用哈希表加双向链表实现同样接口。', 'lru-cache',
    [[[2,[['put','a',1],['put','b',2],['get','a'],['put','c',3],['get','b'],['get','c']]],[1,null,3]],[[0,[['put','a',4],['get','a']]],[null]],[[1,[]],[]],[[2,[['put','a',1],['put','b',2],['put','a',4],['put','c',3],['get','a'],['get','b']]],[4,null]],[[1,[['get','x'],['put','x',0],['get','x']]],[null,0]]])
];
