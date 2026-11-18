const { q } = require('../catalog-kit.cjs');

const treeInput = { driver: `def run_case(args):
    return solve(tree_from(args[0]), *args[1:])` };
const sortedResults = { driver: `def run_case(args):
    return sorted(solve(*args))` };
const sortedGroups = { driver: `def run_case(args):
    return sorted(sorted(group) for group in solve(*args))` };
const inPlace = { driver: `def run_case(args):
    solve(*args)
    return args[0]` };

function objectInterface(className, methods) {
  return {
    starter: `class ${className}:\n    def __init__(self):\n        pass\n\n` +
      methods.map(([name, params]) => `    def ${name}(self${params ? ', ' + params : ''}):\n        pass`).join('\n\n'),
    signature: className,
    driver: `def run_case(args):
    obj = ${className}()
    return [getattr(obj, name)(*values) for name, values in args[0]]`,
  };
}

module.exports = [
  q('lc-validate-binary-search-tree', 'root',
    '给定整数二叉树的根节点，判断每个节点的左子树是否全部严格小于该节点、右子树是否全部严格大于该节点。空树满足条件，重复键违反条件。输入示例以层序表示，函数收到 TreeNode 或 None。',
    `def solve(root):
    stack = [(root, float('-inf'), float('inf'))]
    while stack:
        node, low, high = stack.pop()
        if node is None:
            continue
        if not low < node.val < high:
            return False
        stack.extend([(node.left, low, node.val), (node.right, node.val, high)])
    return True`,
    '把祖先约束作为开区间传给子树。每个节点入栈一次，时间 O(n)，辅助空间 O(h)，h 为树高。',
    [[[[4,2,6,1,3,5,7]],true],[[[5,2,8,null,null,4,9]],false],[[[3,3]],false],[[[]],true]],treeInput),
  q('lc-kth-smallest-element-in-a-bst', 'root, k',
    '给定键互异的二叉搜索树与从 1 开始的排名 k，返回第 k 小的键。输入保证 1 ≤ k ≤ 节点数。函数收到树的根节点与整数。',
    `def solve(root, k):
    stack = []
    while root or stack:
        while root:
            stack.append(root)
            root = root.left
        root = stack.pop()
        k -= 1
        if k == 0:
            return root.val
        root = root.right`,
    '中序遍历依次遇到从小到大的键，第 k 次出栈时返回。时间 O(h+k)，空间 O(h)。',
    [[[[6,3,9,1,4],1],1],[[[6,3,9,1,4],4],6],[[[-1],1],-1]],treeInput),
  q('lc-flatten-binary-tree-to-linked-list','root',
    '在原树上调整指针，使所有左指针为空，沿右指针依次访问原树先序遍历的各节点。函数接收 TreeNode 或 None，结果从原根读取。页面以右链上的节点值显示结果。',
    `def solve(root):
    while root:
        if root.left:
            tail = root.left
            while tail.right:
                tail = tail.right
            tail.right = root.right
            root.right = root.left
            root.left = None
        root = root.right`,
    '先序顺序是根、左、右。把右子树接到左子树最右端，再把左子树移到右侧。被查找的右边总共只遍历线性次，时间 O(n)，空间 O(1)。',
    [[[[7,3,9,2,5,8]],[7,3,2,5,9,8]],[[[1,1,null,1]],[1,1,1]],[[[]],[]]],{
      driver:`def run_case(args):
    root = tree_from(args[0])
    order = []
    stack = [root] if root else []
    while stack:
        node = stack.pop()
        order.append(node)
        if node.right: stack.append(node.right)
        if node.left: stack.append(node.left)
    solve(root)
    values = []
    for expected_node in order:
        if root is not expected_node or root.left is not None:
            raise ValueError("右链应按先序连接原有节点，且左指针为空")
        values.append(root.val)
        root = root.right
    if root is not None:
        raise ValueError("右链尾部应指向 None")
    return values`}),
  q('lc-construct-binary-tree-from-preorder-and-inorder-traversal','preorder, inorder',
    '给出同一棵二叉树的先序和中序序列，各节点值互异，重建树并返回 TreeNode 根节点。两个序列长度相同且遍历合法。空序列返回 None。页面按层序展示结果。',
    `def solve(preorder, inorder):
    if not preorder:
        return None
    root = TreeNode(preorder[0])
    stack = [root]
    j = 0
    for value in preorder[1:]:
        parent = stack[-1]
        node = TreeNode(value)
        if parent.val != inorder[j]:
            parent.left = node
        else:
            while stack and stack[-1].val == inorder[j]:
                parent = stack.pop()
                j += 1
            parent.right = node
        stack.append(node)
    return root`,
    '按先序创建节点。若栈顶还未出现在当前中序位置，则新节点属于其左侧；否则按中序弹出已经完成的祖先，将新节点接为最后弹出节点的右孩子。时间 O(n)，空间 O(h)。',
    [[[[5,2,1,4,8],[1,2,4,5,8]],[5,2,8,1,4]],[[[1,2,3],[1,2,3]],[1,null,2,null,3]],[[[],[]],[]]],{driver:`def run_case(args):
    return tree_values(solve(*args))`}),
  q('lc-binary-tree-maximum-path-sum','root',
    '在非空整数二叉树上选一条至少含一个节点的简单路径。相邻节点须有父子边，每个节点至多经过一次。路径可起止于任意节点，返回节点值之和的最大值。',
    `def solve(root):
    best = root.val
    gain = {}
    stack = [(root, False)]
    while stack:
        node, ready = stack.pop()
        if node is None:
            continue
        if ready:
            left = max(0, gain.get(id(node.left), 0))
            right = max(0, gain.get(id(node.right), 0))
            best = max(best, node.val + left + right)
            gain[id(node)] = node.val + max(left, right)
        else:
            stack.extend([(node, True), (node.right, False), (node.left, False)])
    return best`,
    '后序计算每个节点向父节点提供的最佳单支和。以该节点为路径最高点时可同时取正贡献的左右两支。时间和空间均为 O(n)。',
    [[[[2,-3,4,null,null,6,1]],12],[[[-4,-2,-9]],-2],[[[-8]],-8],[[[-10,7,2,8,9]],24]],treeInput),
  q('lc-number-of-islands','grid',
    '二维字符网格中，字符 "1" 是陆地，"0" 是水。共享上、下、左或右边的陆地属于同一座岛。返回岛屿数，空网格返回 0。允许在输入上标记访问状态。',
    `def solve(grid):
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    count = 0
    for i in range(rows):
        for j in range(cols):
            if grid[i][j] != '1':
                continue
            count += 1
            stack = [(i, j)]
            grid[i][j] = '0'
            while stack:
                r, c = stack.pop()
                for a, b in ((r-1,c), (r+1,c), (r,c-1), (r,c+1)):
                    if 0 <= a < rows and 0 <= b < cols and grid[a][b] == '1':
                        grid[a][b] = '0'
                        stack.append((a, b))
    return count`,
    '扫描到未访问的陆地就开始一次深度优先搜索，把整个连通分量标为水。每格最多压栈一次，时间与最坏辅助空间均为 O(行数 × 列数)。',
    [[[[['1','0','1'],['1','1','0']]],2],[[[['0'],['0']]],0],[[[['1','1'],['1','1']]],1],[[[]],0]]),
  q('lc-course-schedule','numCourses, prerequisites',
    '课程编号从 0 到 numCourses−1。每条 [a,b] 表示选 a 之前必须修完 b。判断是否存在修完全部课程的顺序，独立课程也计入总数。',
    `from collections import deque

def solve(numCourses, prerequisites):
    after = [[] for _ in range(numCourses)]
    pending = [0] * numCourses
    for a, b in prerequisites:
        after[b].append(a)
        pending[a] += 1
    ready = deque(i for i, count in enumerate(pending) if count == 0)
    taken = 0
    while ready:
        course = ready.popleft()
        taken += 1
        for nxt in after[course]:
            pending[nxt] -= 1
            if pending[nxt] == 0:
                ready.append(nxt)
    return taken == numCourses`,
    '入度记录每门课尚未完成的先修课数，依次取出入度为零的课程。最终计数覆盖所有课程当且仅当图无环。时间和空间 O(V+E)。',
    [[[4,[[1,0],[2,0],[3,1],[3,2]]],true],[[3,[[0,1],[1,0]]],false],[[1,[[0,0]]],false],[[2,[]],true]]),
  q('lc-permutations','nums',
    '给定互异的整数列表，返回所有使用每个元素恰好一次的排列。各排列可按任意顺序提交。',
    `def solve(nums):
    result = []
    def visit(i):
        if i == len(nums):
            result.append(nums.copy())
            return
        for j in range(i, len(nums)):
            nums[i], nums[j] = nums[j], nums[i]
            visit(i + 1)
            nums[i], nums[j] = nums[j], nums[i]
    visit(0)
    return result`,
    '用交换确定当前位，递归后还原。共有 n! 个排列，复制输出需要 O(n·n!) 时间，额外栈空间 O(n)。',
    [[[[3]],[[3]]],[[[2,-1]],[[-1,2],[2,-1]]],[[[3,1,2]],[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]]],sortedResults),
  q('lc-subsets','nums',
    '返回互异整数列表的全部子集，每个元素在一个子集中最多出现一次，含空集与全集。子集内部及子集之间均可采用任意顺序。',
    `def solve(nums):
    answer = [[]]
    for value in nums:
        answer += [group + [value] for group in answer]
    return answer`,
    '处理每个新值时，已有每个子集分别对应取与不取两种选择。输出 2ⁿ 个子集，时间及输出空间 O(n·2ⁿ)。',
    [[[[1]],[[],[1]]],[[[-2,3]],[[],[-2],[-2,3],[3]]],[[[2,1,3]],[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]]],sortedGroups),
  q('lc-combination-sum','candidates, target',
    '候选列表含互异的正整数，同一数可重复选。返回所有总和恰为正整数 target 的数值组合，每种组合只出现一次。组合及其中的元素均可任意排序。',
    `def solve(candidates, target):
    values = sorted(candidates)
    result, path = [], []
    def search(start, left):
        if left == 0:
            result.append(path.copy())
            return
        for i in range(start, len(values)):
            if values[i] > left:
                break
            path.append(values[i])
            search(i, left - values[i])
            path.pop()
    search(0, target)
    return result`,
    '按非降顺序构造组合，同一位置可再次选择。候选值超过剩余目标时结束循环。若访问 S 个搜索节点，时间 O(S·m+输出规模)，m 为候选数；递归深度至多 target/min(candidates)。',
    [[[[2,3,5],8],[[2,2,2,2],[2,3,3],[3,5]]],[[[4,6],5],[]],[[[7],14],[[7,7]]]],sortedGroups),
  q('lc-generate-parentheses','n',
    '用 n 对圆括号生成全部合法括号串。合法串的每个前缀中右括号数至多为左括号数，且两者总数相等。返回字符串列表，顺序任意；n 是正整数。',
    `def solve(n):
    answer = []
    def extend(text, opens, closes):
        if closes == n:
            answer.append(text)
            return
        if opens < n:
            extend(text + '(', opens + 1, closes)
        if closes < opens:
            extend(text + ')', opens, closes + 1)
    extend('', 0, 0)
    return answer`,
    '回溯维护已用左右括号数，只扩展合法前缀。每个结果长 2n，搜索路径数量随卡特兰数增长；字符串拼接实现的时间上界 O(n²·Cₙ)，活动字符串空间 O(n²)。',
    [[[1],['()']],[[2],['(())','()()']],[[3],['((()))','(()())','(())()','()(())','()()()']]],sortedResults),
  q('lc-word-search','board, word',
    '在矩形字符网格中查找非空字符串 word。从任意格开始，每步移动到上下左右相邻的格，路径上的字符依次拼成 word，每个格在一次路径中最多使用一次。返回布尔值。',
    `def solve(board, word):
    if not board or not board[0]:
        return False
    rows, cols = len(board), len(board[0])
    def visit(i, j, k):
        if not (0 <= i < rows and 0 <= j < cols) or board[i][j] != word[k]:
            return False
        if k + 1 == len(word):
            return True
        saved, board[i][j] = board[i][j], None
        ok = any(visit(a, b, k+1) for a, b in ((i-1,j), (i+1,j), (i,j-1), (i,j+1)))
        board[i][j] = saved
        return ok
    return any(visit(i,j,0) for i in range(rows) for j in range(cols))`,
    '从每个起点搜索匹配前缀，用临时标记避免重复使用格子并在回溯时恢复。目标长度 L，时间上界 O(行数·列数·4ᴸ)，空间 O(L)。',
    [[[[['A','B'],['D','C']],'ABCD'],true],[[[['A','B'],['D','C']],'ABA'],false],[[[['A','B'],['D','C']],'AC'],false],[[[['Q']],'Q'],true]]),
  q('lc-palindrome-partitioning','s',
    '把非空字符串完整切成若干非空回文子串，返回所有切法。每种切法的片段按原字符串位置排列；不同切法的返回次序任意。',
    `def solve(s):
    n = len(s)
    pal = [[False] * n for _ in range(n)]
    for i in range(n-1, -1, -1):
        for j in range(i, n):
            pal[i][j] = s[i] == s[j] and (j-i < 2 or pal[i+1][j-1])
    answer, path = [], []
    def visit(i):
        if i == n:
            answer.append(path.copy())
            return
        for j in range(i, n):
            if pal[i][j]:
                path.append(s[i:j+1])
                visit(j+1)
                path.pop()
    visit(0)
    return answer`,
    '用区间动态规划预计算回文性，再枚举每段结束位置。时间上界 O(n²·2ⁿ)，回文表和当前路径占 O(n²) 辅助空间。',
    [[['aba'],[['a','b','a'],['aba']]],[['aa'],[['a','a'],['aa']]],[['z'],[['z']]]],sortedResults),
  q('lc-n-queens','n',
    '在 n×n 棋盘上放置 n 个互相无法攻击的皇后。返回全部棋盘，每个棋盘由 n 行字符串表示，Q 表示皇后，. 表示空格。同一棋盘出现一次，棋盘之间顺序任意。n ≥ 1。',
    `def solve(n):
    boards, positions = [], []
    columns, down, up = set(), set(), set()
    def place(r):
        if r == n:
            boards.append(['.'*c + 'Q' + '.'*(n-1-c) for c in positions])
            return
        for c in range(n):
            if c in columns or r-c in down or r+c in up:
                continue
            positions.append(c)
            columns.add(c); down.add(r-c); up.add(r+c)
            place(r+1)
            positions.pop()
            columns.remove(c); down.remove(r-c); up.remove(r+c)
    place(0)
    return boards`,
    '逐行选择列，用列号及两种对角线编号记录冲突。每个搜索节点尝试 n 列，搜索时间上界 O(n·n!+输出规模)，辅助空间 O(n)。',
    [[[1],[['Q']]],[[2],[]],[[3],[]],[[4],[['..Q.','Q...','...Q','.Q..'],['.Q..','...Q','Q...','..Q.']]]],sortedResults),
  q('lc-search-insert-position','nums, target',
    'nums 中的整数严格递增。返回 target 所在的下标；当 target 尚未出现，返回保持升序的插入位置，索引从 0 开始。要求对数时间。',
    `def solve(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    '用半开区间定位第一个大于等于目标的位置，边界可以是数组长度。时间 O(log n)，空间 O(1)。',
    [[[[2,5,8],2],0],[[[2,5,8],6],2],[[[2,5,8],9],3],[[[2,5,8],1],0]]),
  q('lc-search-a-2d-matrix','matrix, target',
    '矩形矩阵中各行升序，下一行的首值大于上一行的末值。判断整数 target 是否出现在矩阵中，要求 O(log(行数·列数)) 时间。',
    `def solve(matrix, target):
    if not matrix or not matrix[0]:
        return False
    cols = len(matrix[0])
    lo, hi = 0, len(matrix) * cols
    while lo < hi:
        mid = (lo + hi) // 2
        value = matrix[mid // cols][mid % cols]
        if value == target:
            return True
        if value < target:
            lo = mid + 1
        else:
            hi = mid
    return False`,
    '把行优先下标映射到行号与列号，直接对整体升序序列二分。时间 O(log(mn))，空间 O(1)。',
    [[[[[1,4],[8,9]],8],true],[[[[1,4],[8,9]],6],false],[[[[-2]],-2],true],[[[[1],[3]],5],false]]),
  q('lc-find-first-and-last-position-of-element-in-sorted-array','nums, target',
    '在非降序整数列表中返回目标最左与最右的下标 [left,right]。当列表中没有目标时返回 [-1,-1]。要求 O(log n) 时间。',
    `from bisect import bisect_left, bisect_right

def solve(nums, target):
    left = bisect_left(nums, target)
    if left == len(nums) or nums[left] != target:
        return [-1, -1]
    return [left, bisect_right(nums, target) - 1]`,
    '分别求第一个 ≥ target 和第一个 > target 的位置。右侧半开边界减一得到最右下标。时间 O(log n)，空间 O(1)。',
    [[[[1,2,2,2,6],2],[1,3]],[[[],0],[-1,-1]],[[[5,5],5],[0,1]],[[[1,4],2],[-1,-1]]]),
  q('lc-search-in-rotated-sorted-array','nums, target',
    '互异整数的升序数组经过一次循环移位，也可能保持原顺序。返回目标值在当前数组中的下标，目标缺失时返回 −1。要求 O(log n) 时间。',
    `def solve(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        elif nums[mid] < target <= nums[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    '二分的两侧至少有一侧保持升序。用端点判断目标是否落在该半段，每轮舍去一半。时间 O(log n)，空间 O(1)。',
    [[[[8,9,2,3,4],2],2],[[[8,9,2,3,4],7],-1],[[[3],3],0],[[[2,1],1],1]]),
  q('lc-find-minimum-in-rotated-sorted-array','nums',
    '非空列表由严格升序整数列表循环移位得到，返回其中最小值。允许旋转整圈，要求 O(log n) 时间。',
    `def solve(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]`,
    '中点大于右端时最小值在其右方；否则包含中点的左半段保留最小值。时间 O(log n)，空间 O(1)。',
    [[[[4,5,9,1,3]],1],[[[2,4,8]],2],[[[0]],0],[[[5,1]],1]]),
  q('lc-median-of-two-sorted-arrays','nums1, nums2',
    '两个非降序整数数组的总长度至少为 1，任一数组可为空。返回全部元素合并排序后的中位数。元素数为偶数时取中间两项平均值，要求对数时间。',
    `def solve(nums1, nums2):
    a, b = sorted((nums1, nums2), key=len)
    m, n = len(a), len(b)
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = (m + n + 1) // 2 - i
        al = a[i-1] if i else float('-inf')
        ar = a[i] if i < m else float('inf')
        bl = b[j-1] if j else float('-inf')
        br = b[j] if j < n else float('inf')
        if al > br:
            hi = i - 1
        elif bl > ar:
            lo = i + 1
        elif (m+n) % 2:
            return max(al, bl)
        else:
            return (max(al, bl) + min(ar, br)) / 2`,
    '在短数组中二分分割点，使两数组左半部分总长固定且其最大值不超过右边最小值。时间 O(log(min(m,n)+1))，空间 O(1)。',
    [[[[],[2,4]],3],[[[1,9],[2,3,4]],3],[[[-4,-2],[-3,-1]],-2.5],[[[2],[2]],2]]),
  q('lc-valid-parentheses','s',
    '字符串只含 ()[]{} 六种符号。判断所有括号是否按类型和嵌套顺序正确配对，空串也视为合法。',
    `def solve(s):
    openings = []
    mate = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in mate:
            if not openings or openings.pop() != mate[ch]:
                return False
        else:
            openings.append(ch)
    return not openings`,
    '栈保存尚未闭合的左括号，遇到右括号时匹配最近的左括号。时间 O(n)，空间 O(n)。',
    [[['{[()]}()'],true],[['([)]'],false],[[')'],false],[['(()'],false]]),
  q('lc-min-stack','',
    '实现 MinStack。push(val) 压入整数、pop() 移除栈顶，两者返回 None；top() 返回栈顶，getMin() 返回当前最小值。所有操作都需 O(1) 时间，读取和弹出仅在非空栈调用。每个用例给出按顺序执行的 [方法名,参数列表]。',
    `class MinStack:
    def __init__(self):
        self.items = []

    def push(self, val):
        minimum = min(val, self.items[-1][1]) if self.items else val
        self.items.append((val, minimum))

    def pop(self):
        self.items.pop()

    def top(self):
        return self.items[-1][0]

    def getMin(self):
        return self.items[-1][1]`,
    '每个栈帧携带截至本层的最小值，移除栈顶后上一层的最小值自动恢复。单次时间 O(1)，空间 O(n)。',
    [[[[['push',[4]],['push',[-1]],['getMin',[]],['pop',[]],['getMin',[]]]],[null,null,-1,null,4]],
     [[[['push',[2]],['push',[2]],['pop',[]],['top',[]],['getMin',[]]]],[null,null,null,2,2]],
     [[[['push',[-8]],['push',[9]],['top',[]],['getMin',[]]]],[null,null,9,-8]]],
    objectInterface('MinStack',[['push','val'],['pop',''],['top',''],['getMin','']])),
  q('lc-largest-rectangle-in-histogram','heights',
    '柱状图每根柱宽为 1，高度为非负整数。矩形底边位于横轴，只能覆盖一段连续柱子，矩形高度至多为该段最矮柱高。求最大面积。',
    `def solve(heights):
    stack = []
    best = 0
    for right in range(len(heights) + 1):
        height = heights[right] if right < len(heights) else 0
        start = right
        while stack and stack[-1][1] > height:
            start, old = stack.pop()
            best = max(best, old * (right-start))
        if not stack or stack[-1][1] < height:
            stack.append((start, height))
    return best`,
    '递增栈保留各高度能向左延伸的最早位置。遇到更矮柱时结算被弹出的高度，在末端加入零高度结算剩余柱。时间 O(n)，空间 O(n)。',
    [[[[2,4,3,2]],8],[[[0,3,0]],3],[[[4,4,4]],12],[[[1,2,3,4]],6]]),
  q('lc-top-k-frequent-elements','nums, k',
    '统计整数数组中各值出现的次数，返回出现次数排在前 k 位的不同整数，输出次序任意。k 在有效范围内，输入保证前 k 个元素组成的集合唯一。',
    `from collections import Counter

def solve(nums, k):
    buckets = [[] for _ in range(len(nums)+1)]
    for value, count in Counter(nums).items():
        buckets[count].append(value)
    result = []
    for bucket in reversed(buckets):
        result.extend(bucket)
        if len(result) >= k:
            return result[:k]`,
    '先计数，再按频率分桶并从高到低读取。时间和辅助空间均为 O(n)。',
    [[[[9,5,9,2,5,9],2],[5,9]],[[[-3],1],[-3]],[[[2,1,2,1],2],[1,2]]],sortedResults),
  q('lc-find-median-from-data-stream','',
    '实现 MedianFinder。addNum(num) 向数据流添加一个整数并返回 None；findMedian() 返回已加入数字的中位数，偶数长度取中间两项的平均值。在至少插入一个数后查询。输入是按时间排序的 [方法名,参数列表]。',
    `import heapq

class MedianFinder:
    def __init__(self):
        self.small = []
        self.large = []

    def addNum(self, num):
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2`,
    '小值侧使用最大堆，大值侧使用最小堆。保持两边等长或小值侧多一个元素，由堆顶得到中位数。插入 O(log n)，查询 O(1)，空间 O(n)。',
    [[[[['addNum',[5]],['findMedian',[]],['addNum',[2]],['findMedian',[]],['addNum',[4]],['findMedian',[]]]],[null,5,null,3.5,null,4]],
     [[[['addNum',[-5]],['addNum',[-4]],['findMedian',[]]]],[null,null,-4.5]],
     [[[['addNum',[2]],['addNum',[2]],['findMedian',[]]]],[null,null,2]]],
    objectInterface('MedianFinder',[['addNum','num'],['findMedian','']])),
  q('lc-best-time-to-buy-and-sell-stock','prices',
    '数组记录各日股价。最多进行一次先买后卖的交易，买卖日期不同，每次持有一股。返回最大利润，跳过交易的利润为 0。',
    `def solve(prices):
    lowest, profit = float('inf'), 0
    for price in prices:
        profit = max(profit, price-lowest)
        lowest = min(lowest, price)
    return profit`,
    '对每个卖出日记录此前最低买入价，扫描时更新利润。时间 O(n)，空间 O(1)。',
    [[[[8,2,6,1,4]],4],[[[6,4,1]],0],[[[5]],0],[[[2,2,8]],6]]),
  q('lc-jump-game','nums',
    '从非空非负整数数组的下标 0 出发，下标 i 处可向右跳任意不超过 nums[i] 的步数。判断能否抵达最后一个下标。',
    `def solve(nums):
    reach = 0
    for i, steps in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + steps)
    return True`,
    '已可达位置构成连续前缀。从左到右扩展其最远边界；扫描到边界外说明中间出现无法跨越的间隔。时间 O(n)，空间 O(1)。',
    [[[[2,0,2,0,1]],true],[[[1,0,3]],false],[[[0]],true],[[[0,0]],false]]),
  q('lc-jump-game-ii','nums',
    '从非空非负整数数组的首位开始，下标 i 处可向右跳 1 至 nums[i] 步。输入保证可以抵达末位。返回抵达末位的最少跳跃次数，只有一个元素时为 0。',
    `def solve(nums):
    jumps = edge = reach = 0
    for i in range(len(nums)-1):
        reach = max(reach, i + nums[i])
        if i == edge:
            jumps += 1
            edge = reach
    return jumps`,
    '相同跳数可达的连续区间对应广度优先搜索的一层。扫完当前层就记录一次跳跃并扩展到下一层边界。时间 O(n)，空间 O(1)。',
    [[[[2,3,1,1,4]],2],[[[0]],0],[[[1,1,1,1]],3],[[[4,0,0,0]],1]]),
  q('lc-partition-labels','s',
    '将小写英文字母串切成尽量多的连续非空片段，使任一字母的全部出现位置只属于同一个片段。按从左至右的顺序返回各段长度。',
    `def solve(s):
    last = {ch: i for i, ch in enumerate(s)}
    result, start, end = [], 0, 0
    for i, ch in enumerate(s):
        end = max(end, last[ch])
        if i == end:
            result.append(end-start+1)
            start = i+1
    return result`,
    '每遇到一个字符，就把当前段需要覆盖的最右端扩展到它最后出现的位置。在首次到达边界时切分，得到最多片段。时间 O(n)，字母表固定时空间 O(1)。',
    [[['abaccdeed'],[3,2,4]],[['aaaa'],[4]],[['abcd'],[1,1,1,1]],[['abacb'],[5]]]),
  q('lc-climbing-stairs','n',
    '从第 0 阶出发，每步向上走 1 或 2 阶。输入正整数 n，返回恰好到达第 n 阶的不同步长序列数，步长顺序影响计数。',
    `def solve(n):
    prev, curr = 1, 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr
    return curr`,
    '按照最后一步长 1 或 2 将方案分成两类，只保存相邻两阶的结果。时间 O(n)，空间 O(1)。',
    [[[1],1],[[2],2],[[5],8],[[10],89]]),
  q('lc-pascals-triangle','numRows',
    '生成杨辉三角的前 numRows 行，从 [1] 开始。每行两端为 1，内部每个数等于上一行相邻两个数之和。返回行列表，numRows 为正整数。',
    `def solve(numRows):
    rows = []
    for i in range(numRows):
        row = [1] * (i+1)
        for j in range(1,i):
            row[j] = rows[-1][j-1] + rows[-1][j]
        rows.append(row)
    return rows`,
    '按定义逐行构造，时间和输出空间均为 O(numRows²)。',
    [[[1],[[1]]],[[3],[[1],[1,1],[1,2,1]]],[[5],[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]]]),
  q('lc-perfect-squares','n',
    '将正整数 n 表示为若干正整数平方的和，同一平方可重复使用。返回所需平方数的最少个数。',
    `from math import isqrt

def solve(n):
    best = [0] + [n+1]*n
    for value in range(1,n+1):
        best[value] = 1 + min(best[value-i*i] for i in range(1,isqrt(value)+1))
    return best[n]`,
    '枚举最后一个平方数，余数的最少项数已经计算过。时间 O(n√n)，空间 O(n)。',
    [[[12],3],[[13],2],[[49],1],[[7],4]]),
  q('lc-coin-change','coins, amount',
    '每种正整数面额的硬币均可无限次使用。求凑成非负整数 amount 所需的最少硬币数。金额为 0 返回 0，无法凑出返回 −1。',
    `def solve(coins, amount):
    best = [0] + [amount+1] * amount
    for coin in coins:
        for value in range(coin, amount+1):
            best[value] = min(best[value], 1 + best[value-coin])
    return -1 if best[amount] > amount else best[amount]`,
    '按面额递推各金额所需的最少硬币数，金额正向遍历允许同种硬币重复使用。时间 O(面额数·amount)，空间 O(amount)。',
    [[[[1,3,4],6],2],[[[4,6],7],-1],[[[5],0],0],[[[7],21],3]]),
  q('lc-word-break','s, wordDict',
    '判断字符串 s 是否能完整切成词表中的一个或多个单词。同一单词可使用多次，词表只含非空词，s 为非空字符串。',
    `def solve(s, wordDict):
    words = set(wordDict)
    lengths = sorted({len(word) for word in words})
    good = [True] + [False] * len(s)
    for end in range(1,len(s)+1):
        for length in lengths:
            start = end-length
            if start < 0:
                break
            if good[start] and s[start:end] in words:
                good[end] = True
                break
    return good[-1]`,
    '以每个前缀结尾为状态，枚举末词长度，检查前缀可切分且末词在词表。词长最大为 L，有 d 种长度；考虑切片和哈希，查询时间 O(n·d·L)，另需构建词表的时间。空间 O(n+词表规模)。',
    [[['aaab',['a','aa','b']],true],[['abcx',['ab','bc','c']],false],[['cars',['car','ca','rs']],true],[['p',['q']],false]]),
  q('lc-longest-increasing-subsequence','nums',
    '从整数数组中按原下标顺序选若干元素，要求选中值严格递增。返回可得的最大长度；选中元素可以相隔。',
    `from bisect import bisect_left

def solve(nums):
    tails = []
    for value in nums:
        pos = bisect_left(tails, value)
        if pos == len(tails):
            tails.append(value)
        else:
            tails[pos] = value
    return len(tails)`,
    'tails[k] 保存长度 k+1 的递增子序列当前最小末值。二分替换首个大于等于新值的位置，相等值保持原长度。时间 O(n log n)，空间 O(n)。',
    [[[[3,1,2,2,5,4]],3],[[[2,2,2]],1],[[[5,4,3]],1],[[[-3,-1,0,1]],4]]),
  q('lc-maximum-product-subarray','nums',
    '选择非空整数列表中的一段连续非空区间，返回区间内各数乘积的最大值。输入可能同时含正数、负数和 0。',
    `def solve(nums):
    high = low = best = nums[0]
    for i in range(1, len(nums)):
        value = nums[i]
        high, low = max(value, high*value, low*value), min(value, high*value, low*value)
        best = max(best, high)
    return best`,
    '负因子会交换最大值与最小值的作用，因此同时保留以上一项结尾的两个极值。时间 O(n)，辅助空间 O(1)。',
    [[[[2,-3,-4,0]],24],[[[-5]],-5],[[[-2,0,-1]],0],[[[-2,-3,-4]],12]]),
  q('lc-partition-equal-subset-sum','nums',
    '给定非空正整数列表，把所有元素分配到两组，每个下标恰好分配一次。判断两组元素的和能否相等。',
    `def solve(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    possible = [True] + [False]*target
    for value in nums:
        for s in range(target, value-1, -1):
            possible[s] |= possible[s-value]
    return possible[target]`,
    '总和为偶数时求能否取出和为一半的子集。倒序遍历容量，使每个数至多选一次。目标和为 T，时间 O(nT)，空间 O(T)。',
    [[[[2,2,3,5]],false],[[[1,3,4,8]],true],[[[1,2,4]],false],[[[4,4]],true]]),
  q('lc-longest-valid-parentheses','s',
    '给定只由左右圆括号组成的字符串，返回最长合法连续括号子串的长度。空串或没有合法配对时返回 0。',
    `def solve(s):
    stack = [-1]
    best = 0
    for i, ch in enumerate(s):
        if ch == '(':
            stack.append(i)
        else:
            stack.pop()
            if stack:
                best = max(best, i-stack[-1])
            else:
                stack.append(i)
    return best`,
    '栈底保存最近的失配边界，其上保存尚未匹配的左括号位置。匹配成功时，当前位置与新栈顶之差为合法后缀长度。时间 O(n)，空间 O(n)。',
    [[[')()(()())('],8],[['(()'],2],[[''],0],[[')))((('],0]]),
  q('lc-minimum-path-sum','grid',
    '矩形网格非空，各格存放非负成本。从左上走到右下，每步只能右移或下移一格，路径成本包含起点与终点。返回最小成本。',
    `def solve(grid):
    dp = [float('inf')] * len(grid[0])
    dp[0] = 0
    for row in grid:
        for j, cost in enumerate(row):
            dp[j] = cost + min(dp[j], dp[j-1] if j else float('inf'))
    return dp[-1]`,
    '逐行更新最小成本，更新前的 dp[j] 来自上方，更新后的 dp[j−1] 来自左方。时间 O(行数·列数)，空间 O(列数)。',
    [[[[[2,9,1],[1,1,3]]],7],[[[[5]]],5],[[[[0,2,4]]],6],[[[[1],[2],[1]]],4]]),
  q('lc-longest-palindromic-substring','s',
    '返回非空字符串中一个长度最大的连续回文子串。并列时可返回任意一个。评测检查返回值的回文性、连续性和最优长度。',
    `def solve(s):
    begin, length = 0, 1
    for center in range(len(s)):
        for right in (center, center+1):
            left = center
            while left >= 0 and right < len(s) and s[left] == s[right]:
                if right-left+1 > length:
                    begin, length = left, right-left+1
                left -= 1
                right += 1
    return s[begin:begin+length]`,
    '分别枚举奇数和偶数长度的中心，向两侧扩展并记录最长区间。时间 O(n²)，辅助空间 O(1)。',
    [[['abacdc'],'aba'],[['abbc'],'bb'],[['x'],'x'],[['aacabdkacaa'],'aca']],{
      driver:`def run_case(args):
    return solve(*args)

def accepts(args, actual, expected):
    return (isinstance(actual, str) and actual in args[0] and actual == actual[::-1]
            and len(actual) == len(expected))`}),
  q('lc-majority-element','nums',
    '非空整数数组中保证有一个值出现次数严格超过数组长度的一半，返回此值。尝试用一次扫描和常数额外空间完成。',
    `def solve(nums):
    candidate, votes = None, 0
    for value in nums:
        if votes == 0:
            candidate = value
        votes += 1 if value == candidate else -1
    return candidate`,
    '每对不同值相互抵消。多数值的个数大于其余值总数，最终候选必为多数值。时间 O(n)，空间 O(1)。',
    [[[[2,1,1,2,2]],2],[[[-1]],-1],[[[3,2,3]],3]]),
  q('lc-sort-colors','nums',
    '数组元素只可能是 0、1、2。通过修改同一个数组，把所有 0 移到最前、1 放中间、2 放最后。函数返回 None，评测读取修改后的输入。要求常数辅助空间并尝试一次扫描。',
    `def solve(nums):
    lo = i = 0
    hi = len(nums)-1
    while i <= hi:
        if nums[i] == 0:
            nums[lo], nums[i] = nums[i], nums[lo]
            lo += 1
            i += 1
        elif nums[i] == 2:
            nums[hi], nums[i] = nums[i], nums[hi]
            hi -= 1
        else:
            i += 1`,
    '三个指针划分已归位的 0、1、尚未扫描的区间与已归位的 2。尾部换来的值需要继续分类。时间 O(n)，空间 O(1)。',
    [[[[2,0,2,1,0]],[0,0,1,2,2]],[[[2,2,0]],[0,2,2]],[[[1]],[1]],[[[1,1,0]],[0,1,1]]],inPlace),
  q('lc-next-permutation','nums',
    '在原数组内把非空整数序列改为按字典序紧随其后的排列。若当前序列已最大，改为最小排列。元素可重复，使用 O(1) 额外空间，结果从传入的数组读取。',
    `def solve(nums):
    i = len(nums)-2
    while i >= 0 and nums[i] >= nums[i+1]:
        i -= 1
    if i >= 0:
        j = len(nums)-1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    left, right = i+1, len(nums)-1
    while left < right:
        nums[left], nums[right] = nums[right], nums[left]
        left += 1
        right -= 1`,
    '定位最右上升位置，换入后缀中最小且严格更大的数，反转降序后缀以取得最小的剩余排列。时间 O(n)，空间 O(1)。',
    [[[[1,3,2]],[2,1,3]],[[[3,2,1]],[1,2,3]],[[[1,5,1]],[5,1,1]],[[[2]],[2]]],inPlace),
  q('lc-find-the-duplicate-number','nums',
    '长度 n+1 的数组中的值均位于 1 至 n，其中恰有一个值出现多次，其余值至多出现一次。返回重复值，保持输入数组内容并使用 O(1) 额外空间。',
    `def solve(nums):
    slow = fast = 0
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = 0
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow`,
    '把值视为下一个数组下标。从 0 出发进入的环，其入口有来自路径和环的两个前驱，因此是唯一重复值。用快慢指针定位入口，时间 O(n)，空间 O(1)。',
    [[[[3,1,3,4,2]],3],[[[2,2,2,2]],2],[[[1,1]],1],[[[4,1,2,3,4]],4]],{
    driver:`def run_case(args):
    original = args[0].copy()
    answer = solve(args[0])
    if args[0] != original:
        raise ValueError("请保留输入数组的内容")
    return answer`}),
  q('lc-merge-sorted-array','nums1, m, nums2, n',
    'nums1 的前 m 项与 nums2 的 n 项分别非降序；nums1 尾部另有 n 个占位格。将两段数据合并为非降序并写回原 nums1，结果从 nums1 读取。m 或 n 可以为 0。',
    `def solve(nums1, m, nums2, n):
    i, j, k = m-1, n-1, m+n-1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[k] = nums1[i]
            i -= 1
        else:
            nums1[k] = nums2[j]
            j -= 1
        k -= 1`,
    '从两段的末尾取较大值写到最终位置，写入端始终位于尚未读取的数据之后。时间 O(m+n)，空间 O(1)。',
    [[[[1,4,0,0],2,[2,5],2],[1,2,4,5]],[[[0,0],0,[-2,3],2],[-2,3]],[[[1,1],2,[],0],[1,1]],[[[0,0],1,[0],1],[0,0]]],inPlace),
  q('lc-remove-element','nums, val',
    '在原列表中移除等于 val 的元素。返回剩余数目 k，将剩余元素放在前 k 项；顺序任意，尾部内容任意。评测显示 [k, 排序后的前 k 项]。',
    `def solve(nums, val):
    write = 0
    for value in nums:
        if value != val:
            nums[write] = value
            write += 1
    return write`,
    '读指针扫描，写指针只在保留元素时前进，写入位置始终不超过已读位置。时间 O(n)，空间 O(1)。',
    [[[[3,2,3,1,2],3],[3,[1,2,2]]],[[[4,4],4],[0,[]]],[[[],1],[0,[]]],[[[7,6],1],[2,[6,7]]]],{
    driver:`def run_case(args):
    values, val = args
    k = solve(values, val)
    if type(k) is not int or not 0 <= k <= len(values):
        raise ValueError("请返回有效的前缀长度")
    return [k, sorted(values[:k])]`}),
  q('lc-remove-duplicates-from-sorted-array','nums',
    '将非降序整数数组去重，原地把不同元素按升序写入前 k 格并返回 k。数组尾部内容任意，测试显示 [k,前 k 项]。',
    `def solve(nums):
    write = 0
    for value in nums:
        if write == 0 or value != nums[write-1]:
            nums[write] = value
            write += 1
    return write`,
    '相同值在有序数组中相邻。仅当新值与上一个已写入的值不同才写入，时间 O(n)，空间 O(1)。',
    [[[[1,1,2,2,3]],[3,[1,2,3]]],[[[0,0,0]],[1,[0]]],[[[-2,0,2]],[3,[-2,0,2]]]],prefixResult()),
  q('lc-remove-duplicates-from-sorted-array-ii','nums',
    '在非降序整数数组中，每个取值最多保留两次，保持原有排序。将结果写入同一数组前 k 格并返回 k，测试显示 [k,前 k 项]。',
    `def solve(nums):
    write = 0
    for value in nums:
        if write < 2 or value != nums[write-2]:
            nums[write] = value
            write += 1
    return write`,
    '已有至少两项时，比对倒数第二个已写值：若相同，当前值已保留两次。时间 O(n)，空间 O(1)。',
    [[[[1,1,1,2,2,3]],[5,[1,1,2,2,3]]],[[[-1,-1,-1,-1]],[2,[-1,-1]]],[[[4]],[1,[4]]]],prefixResult()),
  q('lc-best-time-to-buy-and-sell-stock-ii','prices',
    '每天给出一股股票的价格，可进行任意次买卖，同一时刻至多持有一股。允许同一天先卖再买，交易无手续费。求期末持股为零时的最大利润。',
    `def solve(prices):
    return sum(max(0, prices[i]-prices[i-1]) for i in range(1,len(prices)))`,
    '任一持股区间的利润是相邻价格差之和。累加全部正差即可获得每段上涨带来的收益。时间 O(n)，额外空间 O(1)。',
    [[[[5,1,4,2,8]],9],[[[7,6,4]],0],[[[2,2,5]],3],[[[9]],0]]),
  q('lc-h-index','citations',
    '给定每篇论文的非负引用数，求最大的整数 h，使至少 h 篇论文各自拥有至少 h 次引用。',
    `def solve(citations):
    n = len(citations)
    counts = [0]*(n+1)
    for value in citations:
        counts[min(n,value)] += 1
    papers = 0
    for h in range(n,-1,-1):
        papers += counts[h]
        if papers >= h:
            return h`,
    'h 最大为论文数 n，因此所有 ≥n 的引用数归入同一桶。从大到小累加，首次满足论文数 ≥ 当前阈值处得到最大 h。时间 O(n)，空间 O(n)。',
    [[[[4,6,0,1,3]],3],[[[0,0]],0],[[[100,100]],2],[[[1]],1]]),
  q('lc-insert-delete-getrandom-o1','',
    '实现 RandomizedSet。insert(val) 加入新值并返回是否成功，remove(val) 删除已有值并返回是否成功，getRandom() 在当前非空集合中等概率选择一个元素。各操作平均 O(1)。用例给出按顺序调用的 [方法名,参数列表]，getRandom 的测试输出表示返回值是否属于当时集合；等概率性通过实现分析。',
    `import random

class RandomizedSet:
    def __init__(self):
        self.values = []
        self.index = {}

    def insert(self, val):
        if val in self.index:
            return False
        self.index[val] = len(self.values)
        self.values.append(val)
        return True

    def remove(self, val):
        if val not in self.index:
            return False
        i = self.index[val]
        last = self.values[-1]
        self.values[i] = last
        self.index[last] = i
        self.values.pop()
        del self.index[val]
        return True

    def getRandom(self):
        return random.choice(self.values)`,
    '数组支持等概率下标抽样，字典记录每个值的下标。删除时用尾元素填补空位并同步索引。各操作平均 O(1)，空间 O(n)。',
    [[[[['insert',[4]],['insert',[4]],['getRandom',[]],['remove',[4]],['remove',[4]]]],[true,false,true,true,false]],
     [[[['insert',[2]],['insert',[8]],['getRandom',[]],['remove',[2]],['getRandom',[]]]],[true,true,true,true,true]],
     [[[['remove',[5]],['insert',[5]],['remove',[5]],['insert',[-2]],['getRandom',[]]]],[false,true,true,true,true]]],{
      ...objectInterface('RandomizedSet',[['insert','val'],['remove','val'],['getRandom','']]),
      driver:`def run_case(args):
    obj, active, result = RandomizedSet(), set(), []
    for name, values in args[0]:
        value = getattr(obj, name)(*values)
        if name == 'getRandom':
            result.append(type(value) is int and value in active)
        else:
            result.append(value)
            if name == 'insert':
                active.add(values[0])
            else:
                active.discard(values[0])
    return result`}),
  q('lc-gas-station','gas, cost',
    'n 个加油站首尾相连，从站 i 出发前可获取 gas[i] 单位油，前往下一站需要 cost[i]。从空油箱出发，油箱容量无限；求能完成一圈的起点下标，无法完成时返回 −1。两个数组等长且非空，有解时输入保证起点唯一。',
    `def solve(gas, cost):
    total = tank = start = 0
    for i, (fuel, charge) in enumerate(zip(gas, cost)):
        delta = fuel-charge
        total += delta
        tank += delta
        if tank < 0:
            start = i+1
            tank = 0
    return start if total >= 0 else -1`,
    '总净油量决定全程是否可行。当前段首次出现负余额时，该段中的起点均无法跨过当前位置，下一站作为新候选。时间 O(n)，空间 O(1)。',
    [[[[1,2,5],[3,3,2]],2],[[[2,1],[3,2]],-1],[[[2],[2]],0],[[[4,0,0],[1,1,1]],0]]),
  q('lc-candy','ratings',
    '一排孩子每人至少获得 1 颗糖。对每对相邻孩子，评分较高者必须得到更多糖，相同评分允许得到不同数目。给出非空评分数组，求最少总糖数。',
    `def solve(ratings):
    sweets = [1]*len(ratings)
    for i in range(1,len(ratings)):
        if ratings[i] > ratings[i-1]:
            sweets[i] = sweets[i-1]+1
    for i in range(len(ratings)-2,-1,-1):
        if ratings[i] > ratings[i+1]:
            sweets[i] = max(sweets[i], sweets[i+1]+1)
    return sum(sweets)`,
    '从左到右满足左邻约束，再从右到左取同时满足右邻的最小值。时间 O(n)，空间 O(n)。',
    [[[[1,0,2]],5],[[[2,2,1]],4],[[[1,2,3,2,1]],9],[[[5]],1]]),
  q('lc-roman-to-integer','s',
    '将合法的标准罗马数字转换为整数，范围 1 至 3999。I、V、X、L、C、D、M 的值依次为 1、5、10、50、100、500、1000，减法写法为 IV、IX、XL、XC、CD、CM。',
    `def solve(s):
    values = dict(zip('IVXLCDM', (1,5,10,50,100,500,1000)))
    total = 0
    for i, ch in enumerate(s):
        v = values[ch]
        total += -v if i+1 < len(s) and v < values[s[i+1]] else v
    return total`,
    '标准形式中较小符号若紧邻更大符号的左侧，其贡献取负，其余取正。时间 O(n)，空间 O(1)。',
    [[['XLIV'],44],[['MMCDIX'],2409],[['VIII'],8],[['CMXCIX'],999]]),
  q('lc-integer-to-roman','num',
    '将 1 至 3999 的整数转成标准罗马数字。符号 I、V、X、L、C、D、M 分别代表 1、5、10、50、100、500、1000。每个数位的 4 和 9 使用减法组合 IV、IX、XL、XC、CD、CM。',
    `def solve(num):
    forms = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),
             (50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]
    pieces = []
    for value, text in forms:
        count, num = divmod(num, value)
        pieces.append(text*count)
    return ''.join(pieces)`,
    '将六种减法组合同基本符号一起按值降序处理，连续取最大的可用形式。固定取值范围内时间及空间均有常数上界。',
    [[[49],'XLIX'],[[944],'CMXLIV'],[[2026],'MMXXVI'],[[3999],'MMMCMXCIX']]),
  q('lc-length-of-last-word','s',
    '字符串由英文字母与普通空格组成，至少包含一个单词。单词指一段连续的字母；返回最后一个单词的长度，注意末尾可能带多个空格。',
    `def solve(s):
    i = len(s)-1
    while i >= 0 and s[i] == ' ':
        i -= 1
    end = i
    while i >= 0 and s[i] != ' ':
        i -= 1
    return end-i`,
    '从末尾跳过空格，再统计连续字母个数。最坏时间 O(n)，空间 O(1)。',
    [[['  data  flow   '],4],[['unit'],4],[[' A   '],1],[['big label'],5]]),
  q('lc-longest-common-prefix','strs',
    '给定一个非空字符串列表，返回所有字符串共同拥有的最长前缀。单个字符串可以为空；公共前缀长度为 0 时返回空串。',
    `def solve(strs):
    first = min(strs, key=len)
    for i, ch in enumerate(first):
        if any(s[i] != ch for s in strs):
            return first[:i]
    return first`,
    '以最短串为候选逐列比较，首次分歧以前的部分就是公共前缀。n 个字符串最短长度为 L，时间 O(n(L+1))，额外工作空间 O(1)。',
    [[[['trace','track','train']],'tra'],[[['map','cap']],''],[[['','a']],''],[[['solo']],'solo']]),
  q('lc-zigzag-conversion','s, numRows',
    '将字符串字符按顺序写到 numRows 行。从第一行向下，到最后一行后向上，回到第一行再向下。最后从第一行到最后一行，顺次拼接各行写入的字符。返回拼接结果，numRows 是正整数。',
    `def solve(s, numRows):
    if numRows == 1 or numRows >= len(s):
        return s
    rows = [[] for _ in range(numRows)]
    row, step = 0, 1
    for ch in s:
        rows[row].append(ch)
        if row == 0:
            step = 1
        elif row == numRows-1:
            step = -1
        row += step
    return ''.join(''.join(chars) for chars in rows)`,
    '记录当前行与行号增量，在首尾行改变方向。所有字符写入和读取各一次，时间及空间 O(n)。',
    [[['ABCDEF',3],'AEBDFC'],[['ABCD',2],'ACBD'],[['abc',1],'abc'],[['hi',5],'hi']]),
];

function prefixResult() {
  return { driver: `def run_case(args):
    values = args[0]
    k = solve(values)
    if type(k) is not int or not 0 <= k <= len(values):
        raise ValueError("请返回有效的前缀长度")
    return [k, values[:k]]` };
}
