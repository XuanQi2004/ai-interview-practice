const { q } = require('../catalog-kit.cjs')

// 等价题复用解法与用例。参数顺序、返回对象或有效输入有差异的题目单独实现。
function alias(id, slug, statement, examples) {
  const entry = { id, alias: 'lc-' + slug }
  if (statement) {
    entry.summary = entry.statement = statement
    entry.cases = examples.map(([args, expected]) => ({ args, expected }))
  }
  return entry
}
const rootArg = 'def run_case(args):\n    return solve(tree_from(args[0]), *args[1:])'
const listResult = 'def run_case(args):\n    return list_values(solve(list_from(args[0]), *args[1:]))'
const sortedOutput = 'def run_case(args):\n    return sorted(solve(*args))'

module.exports = [
  alias('75e878df47f24fdc9dc3e400ec6058ca', 'reverse-linked-list'),
  alias('b58434e200a648c589ca2063f1faf58c', 'reverse-linked-list-ii'),
  alias('b49c3dc907814e9bbfa8437c251b028e', 'reverse-nodes-in-k-group',
    '以 k 个节点为一组原地反转单链表，返回新的头节点。k 为正整数，末尾不足 k 个节点时保持顺序；空链表返回 None。请通过调整 next 指针实现，每个节点保留原值。',
    [[[[7,3,5,2,1],2],[3,7,2,5,1]], [[[4,8],5],[4,8]], [[[],1],[]]]),
  alias('d8b6b4358f774294a89de2a6ac4d9337', 'merge-two-sorted-lists'),
  alias('65cfde9e5b9b4cf2b6bafa5f3ef33fa6', 'merge-k-sorted-lists'),
  alias('650474f313294468a4ded3ce0f7898b9', 'linked-list-cycle'),
  alias('f95dcdafbde44b22a6d741baf71653f6', 'remove-nth-node-from-end-of-list'),
  alias('f23604257af94d939848729b1a5cda08', 'sort-list'),
  alias('3fed228444e740c8be66232ce8b87c2f', 'palindrome-linked-list'),
  alias('02bf49ea45cd486daa031614f9bd6fc3', 'odd-even-linked-list'),
  alias('71cef9f8b5564579bf7ed93fbe0b2024', 'remove-duplicates-from-sorted-list-ii'),
  alias('fcf87540c4f347bcb4cf720b5b350c76', 'find-peak-element'),
  alias('0bf071c135e64ee2a027783b80bf781d', 'binary-tree-inorder-traversal'),
  alias('04a5560e43e24e9db4595865dc9c63a3', 'binary-tree-level-order-traversal'),
  alias('91b69814117f4e8097390d107d2efbe0', 'binary-tree-zigzag-level-order-traversal'),
  alias('8a2b2bf6c19b4f23a9bdb9b233eefa73', 'maximum-depth-of-binary-tree'),
  alias('508378c0823c423baa723ce448cbfd0c', 'path-sum'),
  alias('ff05d44dfdb04e1d83bdbdab320efbcb', 'symmetric-tree'),
  alias('a9d0ecbacef9410ca97463e4a5c83be7', 'invert-binary-tree'),
  alias('a69242b39baf45dea217815c7dedb52b', 'validate-binary-search-tree'),
  alias('8a19cbe657394eeaac2f6ea9b0f6fcf6', 'construct-binary-tree-from-preorder-and-inorder-traversal'),
  alias('37548e94a270412c8b9fb85643c8ccc2', 'valid-parentheses'),
  alias('e8a1b01a2df14cb2b228b30ee6a92163', 'majority-element'),
  alias('50ec6a5b0e4e45348544348278cdcee5', 'first-missing-positive'),
  alias('0c9664d1554e466aa107d899418e814e', 'number-of-islands'),
  alias('c76408782512486d91eea181107293b6', 'n-queens-ii'),
  alias('c9addb265cdf4cdd92c092c655d164ca', 'generate-parentheses'),
  alias('8c82a5b80378478f9484d87d1c5f12a4', 'climbing-stairs'),
  alias('6fe0302a058a4e4a834ee44af88435c7', 'min-cost-climbing-stairs'),
  alias('166eaff8439d4cd898e3ba933fbc6358', 'unique-paths'),
  alias('7d21b6be4c6b429bb92d219341c4f8bb', 'minimum-path-sum'),
  alias('3911a20b3f8743058214ceaa099eeb45', 'coin-change'),
  alias('5164f38b67f846fb8699e9352695cd2f', 'longest-increasing-subsequence'),
  alias('459bd355da1549fa8a49e350bf3df484', 'maximum-subarray'),
  alias('6a1483b5be1547b1acd7940f867be0da', 'edit-distance'),
  alias('45fd68024a4c4e97a8d6c45fc61dc6ad', 'longest-valid-parentheses'),
  alias('c5fbf7325fbd4c0ea3d0c3ea6bc6cc79', 'house-robber'),
  alias('64b4262d4e6d4f6181cd45446a5821ec', 'best-time-to-buy-and-sell-stock'),
  alias('9e5e3c2603064829b0a0bbfca10594e9', 'best-time-to-buy-and-sell-stock-ii'),
  alias('4892d3ff304a4880b7a89ba01f48daf9', 'best-time-to-buy-and-sell-stock-iii'),
  q('28eb3175488f4434a4a6207f6f484f47', 'strs', '给出一个字符串数组，返回每个字符串都具有的最长公共前缀。数组为空或各串没有相同首字符时返回空串。',
`def solve(strs):
    if not strs:
        return ""
    shortest = min(strs, key=len)
    for i, c in enumerate(shortest):
        if any(word[i] != c for word in strs):
            return shortest[:i]
    return shortest`, '以最短串为候选，逐列检查字符是否全相同。时间 O(n·k)，其中 n 是串数、k 是最短串长度，额外空间 O(1)。',
  [[[['spin','spice','spire']],'spi'], [[[]],''], [[['x','y']],''], [[['lab']],'lab']]),
  alias('c466d480d20c4c7c9d322d12ca7955ac', 'minimum-window-substring'),
  alias('3d8d6a8e516e4633a2244d2934e5aa47', 'container-with-most-water',
    '数组第 i 项是在位置 i 的竖线高度。选两条竖线组成容器，容量为间距乘以较短线的高度，返回最大容量。竖线少于两条时返回 0。',
    [[[[2,1,5,3]],6], [[[7]],0], [[[]],0], [[[4,1,4]],8]]),
  alias('31c1aed01b394f0b8b7734de0324e00f', 'trapping-rain-water'),
  alias('76039109dd0b47e994c08d8319faa352', 'candy'),
  q('7edf70f2d29c4b599693dc3aaeea1d31', 'matrix', '按顺时针螺旋次序读取矩形矩阵：从左上角向右出发，每圈结束后继续向内一圈。返回访问值数组，空矩阵返回空数组。',
`def solve(matrix):
    if not matrix or not matrix[0]:
        return []
    top, bottom = 0, len(matrix)-1
    left, right = 0, len(matrix[0])-1
    result = []
    while top <= bottom and left <= right:
        result.extend(matrix[top][j] for j in range(left, right+1))
        top += 1
        result.extend(matrix[i][right] for i in range(top, bottom+1))
        right -= 1
        if top <= bottom:
            result.extend(matrix[bottom][j] for j in range(right, left-1, -1))
            bottom -= 1
        if left <= right:
            result.extend(matrix[i][left] for i in range(bottom, top-1, -1))
            left += 1
    return result`, '维护上下左右四条边界，每读完一条边就收缩该边界。时间 O(mn)，除结果外空间 O(1)。',
  [[[[[1,2,3],[4,5,6]]],[1,2,3,6,5,4]], [[[]],[]], [[[[3],[6],[9]]],[3,6,9]]]),

  q('253d2c59ec3e4bc68da16833f79a38e4', 'head', '输入由两组节点值描述：第一组是入环前的节点，第二组组成环。函数接收组装好的链表头，返回环的入口节点；无环时返回 None。判题比较节点身份，再展示入口值。',
`def solve(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            first = head
            while first is not slow:
                first, slow = first.next, slow.next
            return first
    return None`, '快慢指针相遇后，从头和相遇点同步前进，首次重合处为入口。时间 O(n)，额外空间 O(1)。',
  [[[[1, 4], [4, 8]], 4], [[[], [7]], 7], [[[5], []], null], [[[], []], null]],
  {driver: `def run_case(args):
    prefix, loop = args
    nodes = [ListNode(x) for x in prefix + loop]
    for left, right in zip(nodes, nodes[1:]):
        left.next = right
    entry = nodes[len(prefix)] if loop else None
    if nodes:
        nodes[-1].next = entry
    answer = solve(nodes[0] if nodes else None)
    if answer is not entry:
        raise ValueError("请返回输入链表中的实际入口节点")
    return answer.val if answer else None`}),

  q('886370fe658f41b498d40fb34ae76ff9', 'head, k', '链表尾节点算作倒数第 1 个。给出头节点和 k，返回倒数第 k 个节点；k 为 0 或超过节点总数时返回 None。样例用从返回节点到末尾的值序列展示结果。',
`def solve(head, k):
    if k < 1:
        return None
    lead = head
    for _ in range(k):
        if lead is None:
            return None
        lead = lead.next
    while lead:
        head, lead = head.next, lead.next
    return head`, '两个指针相距 k 步；前者到达链表末端时，后者指向答案。时间 O(n)，空间 O(1)。',
  [[[[8, 4, 1], 2], [4, 1]], [[[7], 2], []], [[[3, 2], 2], [3, 2]], [[[4], 0], []]], {driver:listResult}),

  q('6ab1d9a29e88450685099d45c9e31e46', 'head_a, head_b', '测试数据给出 A 的独有前缀、B 的独有前缀及共享后缀。函数接收两个无环链表的头节点，返回两链表首次指向的同一节点；无交点返回 None。判题检查节点身份，并输出共享后缀。',
`def solve(head_a, head_b):
    a, b = head_a, head_b
    while a is not b:
        a = head_b if a is None else a.next
        b = head_a if b is None else b.next
    return a`, '两个指针分别走 A 接 B、B 接 A，经过相同长度后在交点或末端相遇。时间 O(m+n)，空间 O(1)。',
  [[[[2], [2, 6], [2, 9]], [2, 9]], [[[1], [1], []], []], [[[], [], [4]], [4]]], {driver:`def run_case(args):
    left, right, common = args
    shared = list_from(common)
    def prepend(values):
        head = shared
        for value in reversed(values):
            head = ListNode(value, head)
        return head
    node = solve(prepend(left), prepend(right))
    if node is not shared:
        raise ValueError("请返回两个链表共享的实际节点")
    return list_values(node)`}),

  q('c56f6c70fb3f4849bc56e33ff2a50b6b', 'head1, head2', '两个非空链表分别记录两个非负整数，每个节点存一个十进制数字，最高位在头节点。返回同样以最高位开头的和链表。',
`def solve(head1, head2):
    def digits(node):
        stack = []
        while node:
            stack.append(node.val)
            node = node.next
        return stack
    a, b = digits(head1), digits(head2)
    carry, head = 0, None
    while a or b or carry:
        total = carry + (a.pop() if a else 0) + (b.pop() if b else 0)
        carry, digit = divmod(total, 10)
        head = ListNode(digit, head)
    return head`, '用两个栈从个位起相加，向结果链表头部插入每一位。时间和空间均为 O(m+n)。',
  [[[[8, 9, 9], [1, 1]], [9, 1, 0]], [[[0], [0]], [0]], [[[9, 9], [1]], [1, 0, 0]]],
  {driver:'def run_case(args):\n    return list_values(solve(list_from(args[0]), list_from(args[1])))'}),

  q('c087914fae584da886a0091e877f2c79', 'head', '输入已按非降序排列的单链表，将每组相同值保留一个节点，返回处理后的头节点。',
`def solve(head):
    node = head
    while node and node.next:
        if node.val == node.next.val:
            node.next = node.next.next
        else:
            node = node.next
    return head`, '同一值只会出现在连续的一段，依次跳过与当前值相同的后继。时间 O(n)，额外空间 O(1)。',
  [[[[2, 2, 2, 5, 6, 6]], [2, 5, 6]], [[[]], []], [[[1, 4]], [1, 4]]], {driver:listResult}),

  q('d3df40bd23594118b57554129cadf47b', 'nums, target', '在元素各异的升序整数数组中用二分查找 target。找到时返回从 0 开始的下标，缺失时返回 -1。',
`def solve(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo if lo < len(nums) and nums[lo] == target else -1`, '维护左闭右开的候选范围，收缩到第一个大于等于目标的位置。时间 O(log n)，空间 O(1)。',
  [[[[-8, 3, 10], -8], 0], [[[], 3], -1], [[[2, 4], 3], -1], [[[1, 6, 9], 9], 2]]),

  q('abc3fe2ce8e146608e868a70efebf62e', 'target, matrix', '第一个参数是目标整数，第二个参数是各行各列均递增的矩形整数数组。判断目标是否出现，返回布尔值。',
`def solve(target, matrix):
    if not matrix or not matrix[0]:
        return False
    row, col = 0, len(matrix[0]) - 1
    while row < len(matrix) and col >= 0:
        value = matrix[row][col]
        if value == target:
            return True
        if value < target:
            row += 1
        else:
            col -= 1
    return False`, '从右上角比较，每次去掉一行或一列。时间 O(m+n)，空间 O(1)。',
  [[[4, [[1, 4], [3, 7]]], true], [[2, [[1, 4], [3, 7]]], false], [[1, [[]]], false]]),

  q('96bd6684e04a44eb80e6a68efc0ec6c5', 'nums', '给出元素各异的整数数组。统计满足 i < j 且 nums[i] > nums[j] 的下标对数，并返回对 1,000,000,007 取模的结果。',
`def solve(nums):
    buf = [0] * len(nums)
    def count(lo, hi):
        if hi - lo < 2:
            return 0
        mid = (lo + hi) // 2
        total = count(lo, mid) + count(mid, hi)
        i, j = lo, mid
        for out in range(lo, hi):
            if j == hi or (i < mid and nums[i] <= nums[j]):
                buf[out] = nums[i]
                i += 1
            else:
                buf[out] = nums[j]
                j += 1
                total += mid - i
        nums[lo:hi] = buf[lo:hi]
        return total
    return count(0, len(nums)) % 1000000007`, '归并两个有序区间时，每次取右侧较小值便新增左侧剩余元素数个逆序对。时间 O(n log n)，空间 O(n)。',
  [[[[4, 2, 5, 1]], 4], [[[3, 7, 9]], 0], [[[5, 4, 3, 2, 1]], 10]]),

  q('9f3231a991af4f55b95579b44b7a01ba', 'nums', '一个非空、非降序整数数组经循环移位后得到 nums。数组允许重复值，返回最小值。',
`def solve(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        elif nums[mid] < nums[hi]:
            hi = mid
        else:
            hi -= 1
    return nums[lo]`, '与右端比较确定最小值范围；值相等时删去一个右端元素。通常时间 O(log n)，最坏 O(n)，空间 O(1)。',
  [[[[2, 2, 2, 0, 1, 2]], 0], [[[8, 8]], 8], [[[-3, 1]], -3]]),

  q('2b317e02f14247a49ffdbdba315459e7', 'a, b', '比较由十进制数字段和点组成的两个版本号。从左到右比较各段整数值，缺失段视为 0。依 a 小于、等于或大于 b 返回 -1、0 或 1。',
`from itertools import zip_longest

def solve(a, b):
    for left, right in zip_longest(a.split("."), b.split("."), fillvalue="0"):
        x, y = int(left), int(right)
        if x != y:
            return (x > y) - (x < y)
    return 0`, '逐段比较，忽略前导零并补齐缺失段。时间和空间均为 O(n+m)。',
  [[['2.001.0', '2.1'], 0], [['1.9', '1.10'], -1], [['0.0.1', '0'], 1]]),

  q('5e2135f4d2b14eb8a5b06fab4c938635', 'root', '返回二叉树的前序遍历值序列，访问顺序为根、左子树、右子树。样例以层序数组表示树，null 为空节点。',
`def solve(root):
    stack = [root] if root else []
    result = []
    while stack:
        node = stack.pop()
        result.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return result`, '栈中先放右孩子，再放左孩子。时间 O(n)，辅助空间 O(h)，h 为树高。',
  [[[[1, 2, 3, null, 4]], [1, 2, 4, 3]], [[[]], []], [[[5]], [5]]], {driver:rootArg}),

  q('1291064f4d5d4bdeaefbf0dd47d78541', 'root', '返回二叉树的后序遍历值序列，访问顺序为左子树、右子树、根。空树返回空列表。',
`def solve(root):
    stack = [(root, False)] if root else []
    out = []
    while stack:
        node, expanded = stack.pop()
        if expanded:
            out.append(node.val)
            continue
        stack.append((node, True))
        if node.right:
            stack.append((node.right, False))
        if node.left:
            stack.append((node.left, False))
    return out`, '给栈帧附上展开标记，两个子树处理完再记录根。时间 O(n)，额外空间 O(h)。',
  [[[[2, 3, 4, 5]], [5, 3, 4, 2]], [[[]], []], [[[1, null, 2]], [2, 1]]], {driver:rootArg}),

  q('947f6eb80d944a84850b0538bf0ec3a5', 'root', '把二叉搜索树原地改成按值递增的双向链表并返回最小节点。沿用原节点的 left 指向前驱，right 指向后继，首尾外侧指针为 None。判题同时检查节点身份和两个方向的链接。',
`def solve(root):
    head, node, previous = root, root, None
    while node:
        if node.left:
            child = node.left
            node.left = child.right
            child.right = node
            if previous:
                previous.right = child
            else:
                head = child
            node = child
        else:
            node.left = previous
            previous, node = node, node.right
    return head`, '沿右侧链前进。遇到左孩子时将其右旋至当前位置；当前节点已无左孩子时，将其接到已完成的有序前缀。每次旋转都把一个新节点移上右侧链，时间 O(n)，额外空间 O(1)。',
  [[[[4, 2, 8, 1, 3]], [1, 2, 3, 4, 8]], [[[]], []], [[[1, null, 2]], [1, 2]]], {driver:`def run_case(args):
    root = tree_from(args[0])
    pending = [root] if root else []
    original = set()
    while pending:
        node = pending.pop()
        original.add(id(node))
        pending.extend(child for child in (node.left, node.right) if child)
    node, prev, out = solve(root), None, []
    while node:
        if id(node) not in original or node.left is not prev:
            raise ValueError("请复用输入节点并正确连接前驱")
        original.remove(id(node))
        out.append(node.val)
        prev, node = node, node.right
    if original:
        raise ValueError("双向链表缺少输入节点")
    return out`}),

  q('7298353c24cc42e3bd5f0e0bd3d1d759', 'left, right', '合并两棵二叉树：同一位置有两个节点时，结果节点取两者值之和；仅有一侧含节点时保留其子树。返回合并后的根节点。',
`def solve(left, right):
    if not left or not right:
        return left or right
    stack = [(left, right)]
    while stack:
        a, b = stack.pop()
        a.val += b.val
        for side in ("left", "right"):
            x, y = getattr(a, side), getattr(b, side)
            if x and y:
                stack.append((x, y))
            elif y:
                setattr(a, side, y)
    return left`, '迭代处理重叠节点，并连接各自独有的分支。设共同位置数为 k，时间 O(k+1)，栈最多 O(h)。',
  [[[[1, 4], [2, null, 8]], [3, 4, 8]], [[[], [5]], [5]], [[[], []], []]], {driver:'def run_case(args):\n    return tree_values(solve(tree_from(args[0]), tree_from(args[1])))'}),

  q('8daa4dff9e36409abba2adbe413d6fae', 'root', '判断二叉树是否完全。除末层外每层都满，末层节点从左开始连续排列。空树返回 True。',
`from collections import deque

def solve(root):
    queue, gap = deque([root]), False
    while queue:
        node = queue.popleft()
        if node is None:
            gap = True
        elif gap:
            return False
        else:
            queue.extend((node.left, node.right))
    return True`, '层序遍历把空孩子也入队，出现空位后再次遇到节点即有缺口。时间 O(n)，空间 O(n)。',
  [[[[1, 2, 3, 4, 5, 6]], true], [[[1, 2, 3, 4, null, 6]], false], [[[]], true]], {driver:rootArg}),

  q('8b3b95850edb4115918ecebdf1b4d222', 'root', '当每个节点左右子树的高度差都至多为 1 时，二叉树平衡。判断给定树是否平衡，空树算平衡。',
`def solve(root):
    heights = {None: 0}
    stack = [(root, False)] if root else []
    while stack:
        node, done = stack.pop()
        if done:
            left, right = heights[node.left], heights[node.right]
            if abs(left - right) > 1:
                return False
            heights[node] = 1 + max(left, right)
        else:
            stack.append((node, True))
            stack.extend((c, False) for c in (node.left, node.right) if c)
    return True`, '后序计算子树高度，并检查每个节点的高度差。时间 O(n)，辅助空间 O(n)。',
  [[[[1, 2, 3, 4]], true], [[[1, 2, null, 3]], false], [[[]], true]], {driver:rootArg}),

  q('d9820119321945f588ed6a26f0a6991f', 'root, p, q', '在键值各异的二叉搜索树中，给出两个已存在的节点值 p、q，返回最近公共祖先的值。每个节点也是自己的祖先。',
`def solve(root, p, q):
    low, high = sorted((p, q))
    while root:
        if root.val < low:
            root = root.right
        elif root.val > high:
            root = root.left
        else:
            return root.val`, '两目标在同侧时继续下行；首次分居根两侧或命中根时得到最近公共祖先。时间 O(h)，空间 O(1)。',
  [[[[8, 3, 11, 1, 5], 1, 5], 3], [[[8, 3, 11, 1, 5], 5, 3], 3], [[[8, 3, 11], 11, 3], 8]], {driver:rootArg}),

  q('e0cc33a83afe4530bcec46eba3325116', 'root, p, q', '给出普通二叉树根节点和两个已存在的节点值。全树节点值唯一，返回最近公共祖先的整数值，节点可作为自己的祖先。',
`def solve(root, p, q):
    parent = {root.val: None}
    stack = [root]
    while p not in parent or q not in parent:
        node = stack.pop()
        for child in (node.left, node.right):
            if child:
                parent[child.val] = node.val
                stack.append(child)
    ancestors = set()
    while p is not None:
        ancestors.add(p)
        p = parent[p]
    while q not in ancestors:
        q = parent[q]
    return q`, '记录父节点，从第一个目标向上收集祖先，再从第二个目标寻找首次交点。时间和空间均为 O(n)。',
  [[[[0, 3, 1, 2], 2, 1], 0], [[[0, 3, 1, 2], 2, 3], 3], [[[0, 2, 1, 3, 4], 3, 4], 2]], {driver:rootArg}),

  q('cf7e25aa97c04cc1a68c8f040e71fb84', '', '实现 Codec 的 serialize(root) 与 deserialize(text)。前者须产生字符串，后者从该字符串恢复相同形状和节点值的二叉树。编码格式自选。每次解码使用新的 Codec 实例。',
`class Codec:
    def serialize(self, root):
        stack, data = [root], []
        while stack:
            node = stack.pop()
            if node is None:
                data.append("#")
            else:
                data.append(str(node.val))
                stack.extend((node.right, node.left))
        return ",".join(data)

    def deserialize(self, text):
        tokens = iter(text.split(","))
        def node(token):
            return None if token == "#" else TreeNode(int(token))
        root = node(next(tokens))
        pending = [(root, side) for side in ("right", "left")] if root else []
        for token in tokens:
            parent, side = pending.pop()
            child = node(token)
            setattr(parent, side, child)
            if child:
                pending.extend((child, s) for s in ("right", "left"))
        return root`, '用先序记录节点和空指针；解码时维护待填充的孩子位置。时间和空间均为 O(n)。',
  [[[[7, null, -3, 2]], [7, null, -3, 2]], [[[]], []], [[[4, 4, 4]], [4, 4, 4]]],
  {signature:'Codec.serialize(root) / Codec.deserialize(text)', starter:'class Codec:\n    def serialize(self, root):\n        pass\n\n    def deserialize(self, text):\n        pass\n',
   driver:'def run_case(args):\n    text = Codec().serialize(tree_from(args[0]))\n    if not isinstance(text, str):\n        raise TypeError("序列化结果应为字符串")\n    return tree_values(Codec().deserialize(text))'}),

  q('c9480213597e45f4807880c763ddd5f0', 'preorder, inorder', '给出同一棵二叉树的前序和中序遍历，节点值各异。返回从右侧观察树时每层可见的一个节点值，按层深递增排列。',
`def solve(preorder, inorder):
    index = {v: i for i, v in enumerate(inorder)}
    view, stack = [], [(0, 0, len(inorder), 0)]
    while stack:
        start, lo, hi, depth = stack.pop()
        if lo == hi:
            continue
        root = preorder[start]
        if depth == len(view):
            view.append(root)
        mid = index[root]
        stack.append((start + 1, lo, mid, depth + 1))
        stack.append((start + 1 + mid - lo, mid + 1, hi, depth + 1))
    return view`, '用中序位置划分区间，先访问右子树，每个深度第一次出现的节点就在右视图中。时间和空间均为 O(n)。',
  [[[[4, 2, 1, 3, 6], [1, 2, 3, 4, 6]], [4, 6, 3]], [[[], []], []], [[[2, 1], [1, 2]], [2, 1]]]),

  q('54275ddae22f475981afa2244dd448c6', '', '用两个栈实现队列方法 push(x) 与 pop()，pop 返回队头。测试序列 PSH整数 表示入队，POP 表示出队并记录返回值，所有出队操作均合法。',
`class Queue:
    def __init__(self):
        self.inbox = []
        self.outbox = []

    def push(self, x):
        self.inbox.append(x)

    def pop(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox.pop()`, '仅在输出栈为空时搬移输入栈，每个元素至多搬移一次。单次操作均摊 O(1)，空间 O(n)。',
  [[[['PSH4', 'PSH9', 'POP', 'PSH7', 'POP', 'POP']], [4, 9, 7]], [[['PSH-2', 'POP']], [-2]], [[[]], []]],
  {signature:'Queue.push(x) / Queue.pop()', starter:'class Queue:\n    def __init__(self):\n        pass\n\n    def push(self, x):\n        pass\n\n    def pop(self):\n        pass\n',
   driver:`def run_case(args):
    queue, result = Queue(), []
    for op in args[0]:
        if op == "POP":
            result.append(queue.pop())
        else:
            queue.push(int(op[3:]))
    return result`}),

  q('4c776177d2c04c2494f2555c9fcc1e49', '', '实现 MinStack 的 push(x)、pop()、top() 和 min()。PSH整数、POP、TOP、MIN 分别执行对应方法，仅记录 TOP 与 MIN 的返回值。查询和弹出时栈均非空。',
`class MinStack:
    def __init__(self):
        self.stack = []

    def push(self, x):
        minimum = min(x, self.min()) if self.stack else x
        self.stack.append((x, minimum))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def min(self):
        return self.stack[-1][1]`, '每个栈位置同时保存其元素和截至该位置的最小值。四种操作均为 O(1)，空间 O(n)。',
  [[[['PSH4','PSH1','PSH1','MIN','POP','MIN','POP','MIN','TOP']], [1,1,4,4]], [[['PSH-3','PSH2','TOP','MIN']], [2,-3]]],
  {signature:'MinStack.push(x) / pop() / top() / min()', starter:'class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, x):\n        pass\n\n    def pop(self):\n        pass\n\n    def top(self):\n        pass\n\n    def min(self):\n        pass\n',
   driver:`def run_case(args):
    stack, result = MinStack(), []
    for op in args[0]:
        if op.startswith("PSH"):
            stack.push(int(op[3:]))
        elif op == "POP":
            stack.pop()
        else:
            result.append(stack.top() if op == "TOP" else stack.min())
    return result`}),

  q('1624bc35a45c42c0bc17d17fa0cba788', 'nums, size', '整数数组上有一个长度为 size 的连续窗口。窗口每次右移一个位置，按移动顺序返回各窗口最大值。size 为 0 或超过数组长度时返回空列表。',
`from collections import deque

def solve(nums, size):
    if size <= 0 or size > len(nums):
        return []
    queue, result = deque(), []
    for i, x in enumerate(nums):
        if queue and queue[0] <= i - size:
            queue.popleft()
        while queue and nums[queue[-1]] <= x:
            queue.pop()
        queue.append(i)
        if i >= size - 1:
            result.append(nums[queue[0]])
    return result`, '用递减双端队列保存仍可能成为最大值的下标。时间 O(n)，额外空间 O(size)。',
  [[[[4, 2, 6, 6, 1], 2], [4, 6, 6, 6]], [[[2, 3], 0], []], [[[1], 2], []], [[[8], 1], [8]]]),

  q('6a296eb82cf844ca8539b57c23e6e9bf', 'nums, k', '返回整数数组中最小的 k 个元素；保留重复次数，允许任意输出顺序。k 在 0 到数组长度之间。',
`import heapq

def solve(nums, k):
    if k == 0:
        return []
    heap = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, -x)
        elif x < -heap[0]:
            heapq.heapreplace(heap, -x)
    return [-v for v in heap]`, '用大小为 k 的最大堆保存目前最小的 k 项。时间 O(n log(k+1))，空间 O(k)。',
  [[[[5,1,5,2,1],3],[1,1,2]], [[[2],0],[]], [[[-2,8],2],[-2,8]]], {driver:sortedOutput}),

  q('e016ad9b7f0b45048c58a9f27ba618bf', 'nums, n, k', '参数依次为整数数组、数组长度 n、从 1 开始的排名 k。返回降序排列后的第 k 个值，重复元素各占一个位置，1 ≤ k ≤ n。练习用快速选择完成。',
`from random import randrange

def solve(nums, n, k):
    target, left, right = k - 1, 0, n - 1
    while left <= right:
        pivot = nums[randrange(left, right + 1)]
        high, i, low = left, left, right
        while i <= low:
            if nums[i] > pivot:
                nums[i], nums[high] = nums[high], nums[i]
                high += 1
                i += 1
            elif nums[i] < pivot:
                nums[i], nums[low] = nums[low], nums[i]
                low -= 1
            else:
                i += 1
        if target < high:
            right = high - 1
        elif target > low:
            left = low + 1
        else:
            return pivot`, '随机选枢轴，将元素分为大于、等于、小于枢轴三段，只继续处理包含目标的区间。期望时间 O(n)，最坏 O(n²)，额外空间 O(1)。',
  [[[[3,8,8,2],4,2],8], [[[-4,-2,-8],3,3],-8], [[[1],1,1],1]]),

  q('9be0172896bd43948f8a32fb954e1be1', '', '实现 MedianStream 的 Insert(x) 和 GetMedian()。每次插入一个整数后求当前中位数。偶数个元素取排序后中间两项的均值，本地用数值数组展示每次查询结果。',
`import heapq

class MedianStream:
    def __init__(self):
        self.left, self.right = [], []

    def Insert(self, x):
        heapq.heappush(self.left, -x)
        heapq.heappush(self.right, -heapq.heappop(self.left))
        if len(self.right) > len(self.left):
            heapq.heappush(self.left, -heapq.heappop(self.right))

    def GetMedian(self):
        if len(self.left) > len(self.right):
            return -self.left[0]
        return (self.right[0] - self.left[0]) / 2`, '最大堆保存较小的一半，最小堆保存较大的一半；堆大小相差至多一。插入 O(log n)，查询 O(1)，空间 O(n)。',
  [[[[7,2,4,1]], [7,4.5,4,3]], [[[-5,-5,0]], [-5,-5,-5]], [[[8]],[8]]],
  {signature:'MedianStream.Insert(x) / GetMedian()', starter:'class MedianStream:\n    def Insert(self, x):\n        pass\n\n    def GetMedian(self):\n        pass\n',
   driver:'def run_case(args):\n    stream, out = MedianStream(), []\n    for x in args[0]:\n        stream.Insert(x)\n        out.append(stream.GetMedian())\n    return out'}),

  q('c215ba61c8b1443b996351df929dc4d4', 'text', '计算只含十进制整数、加号、减号、乘号和圆括号的合法表达式。乘法优先于加减法，同级运算从左到右；括号指定局部运算顺序。实现表达式解析与求值。',
`def solve(text):
    numbers, ops = [], []
    priority = {"+": 1, "-": 1, "*": 2, "neg": 3, "pos": 3}
    def apply():
        op = ops.pop()
        b = numbers.pop()
        if op in ("neg", "pos"):
            numbers.append(-b if op == "neg" else b)
        else:
            a = numbers.pop()
            numbers.append(a + b if op == "+" else a - b if op == "-" else a * b)
    i, expecting = 0, True
    while i < len(text):
        char = text[i]
        if char.isspace():
            i += 1
            continue
        if char.isdigit():
            start = i
            while i < len(text) and text[i].isdigit():
                i += 1
            numbers.append(int(text[start:i]))
            expecting = False
            continue
        if char == "(":
            ops.append(char)
            expecting = True
        elif char == ")":
            while ops[-1] != "(":
                apply()
            ops.pop()
            expecting = False
        elif expecting and char in "+-":
            ops.append("neg" if char == "-" else "pos")
        else:
            while ops and ops[-1] != "(" and priority[ops[-1]] >= priority[char]:
                apply()
            ops.append(char)
            expecting = True
        i += 1
    while ops:
        apply()
    return numbers[0]`, '分别保存数字和运算符，根据优先级归约。遇到右括号时完成括号内部计算。时间和空间均为 O(n)。',
  [[['7+3*(2-6)'],-5], [['18-3-4'],11], [['(2+4)*(8-5)'],18], [['-3*2+10'],4]]),

  q('20ef0972485e41019e39543e8e895b7f', 'numbers, target', '给出整数数组和目标和，返回一对不同元素的位置 [i,j]，满足 i < j 且两数之和为 target。位置从 1 开始，保证存在解，可返回任意合法下标对。',
`def solve(numbers, target):
    seen = {}
    for j, x in enumerate(numbers, 1):
        if target - x in seen:
            return [seen[target - x], j]
        seen[x] = j`, '按位置扫描，用哈希表查找之前出现过的补数。时间 O(n)，空间 O(n)。',
  [[[[6,1,5,2],7],[1,2]], [[[4,4],8],[1,2]], [[[-3,0,4,8],5],[1,4]]],
  {driver:`def run_case(args):
    return solve(*args)

def accepts(args, actual, expected):
    nums, target = args
    if not isinstance(actual, (list, tuple)) or len(actual) != 2:
        return False
    i, j = actual
    return type(i) is int and type(j) is int and 1 <= i < j <= len(nums) and nums[i-1]+nums[j-1] == target`}),

  q('389fc1c3d3be4479a154f63f495abff8', 'nums', '数组中恰有两个整数各出现一次，其他整数各出现两次。按从小到大的顺序返回这两个整数。',
`def solve(nums):
    combined = 0
    for x in nums:
        combined ^= x
    bit = combined & -combined
    left = right = 0
    for x in nums:
        if x & bit:
            left ^= x
        else:
            right ^= x
    return sorted((left, right))`, '两单例的异或值至少有一位为 1。按该位分组，各组内的成对元素通过异或抵消。时间 O(n)，空间 O(1)。',
  [[[[8,2,8,4]],[2,4]], [[[5,1,3,5,9,3]],[1,9]], [[[4,2]],[2,4]]]),

  q('345e2ed5f81d4017bbb8cc6055b0b711', 'nums', '返回三个不同位置的元素构成的全部零和三元组。每个三元组内部按非降序排列，每种值组合只出现一次。不同三元组的输出顺序任意。',
`def solve(nums):
    nums.sort()
    triples = []
    for i, value in enumerate(nums):
        if i and value == nums[i-1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = value + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                a, b = nums[left], nums[right]
                triples.append([value, a, b])
                while left < right and nums[left] == a:
                    left += 1
                while left < right and nums[right] == b:
                    right -= 1
    return triples`, '排序后固定首项，双指针寻找互补项并跳过相同值。时间 O(n²)，Python 排序所需额外空间 O(n)。',
  [[[[-3,1,2,2,0,0,0]],[[-3,1,2],[0,0,0]]], [[[1,1,1]],[]], [[[-4,2,2]],[[-4,2,2]]]], {driver:sortedOutput}),

  q('4bcf3081067a4d028f95acee3ddcd2b1', 'nums', '给出互异整数数组。按输入下标的字典序枚举全部排列，即每个位置先尝试原数组里靠前且尚未使用的元素。',
`def solve(nums):
    result, path = [], []
    used = [False] * len(nums)
    def visit():
        if len(path) == len(nums):
            result.append(path.copy())
            return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True
                path.append(x)
                visit()
                path.pop()
                used[i] = False
    visit()
    return result`, '回溯依照原数组次序选择下一个元素，在叶节点复制路径。时间 O(n·n!)，额外空间 O(n)，另计输出。',
  [[[[8,3]],[[8,3],[3,8]]], [[[1,2,4]],[[1,2,4],[1,4,2],[2,1,4],[2,4,1],[4,1,2],[4,2,1]]], [[[2]],[[2]]]]),

  q('a43a2b986ef34843ac4fdd9159b69863', 'nums', '整数数组可含重复项，按数值的字典序从小到大返回所有互不相同的排列。',
`from collections import Counter

def solve(nums):
    count, path, result = Counter(nums), [], []
    keys = sorted(count)
    def visit():
        if len(path) == len(nums):
            result.append(path.copy())
            return
        for value in keys:
            if count[value]:
                count[value] -= 1
                path.append(value)
                visit()
                path.pop()
                count[value] += 1
    visit()
    return result`, '按值维护剩余次数，升序尝试仍可选择的元素。枚举时间至多 O(n·n!)，除结果外空间 O(n)。',
  [[[[2,1,2]],[[1,2,2],[2,1,2],[2,2,1]]], [[[3,3]],[[3,3]]], [[[7]],[[7]]]]),

  q('fe6b651b66ae47d7acce78ffdd9a96c7', 'text', '枚举由输入字符串全部字符组成的互异排列，输出顺序任意。大写、小写字母分别计数；空字符串的排列为含一个空字符串的列表。',
`from collections import Counter

def solve(text):
    counts, prefix, out = Counter(text), [], []
    def visit():
        if len(prefix) == len(text):
            out.append("".join(prefix))
            return
        for ch in counts:
            if counts[ch]:
                counts[ch] -= 1
                prefix.append(ch)
                visit()
                prefix.pop()
                counts[ch] += 1
    visit()
    return out`, '按字符剩余次数回溯，同层每种字符只选一次。时间至多 O(n·n!)，除结果外空间 O(n)。',
  [[['bAb'],['Abb','bAb','bbA']], [[''],['']], [['xxx'],['xxx']]], {driver:sortedOutput}),

  q('7a71a88cdf294ce6bdf54c899be967a2', 'matrix', '在矩形非负整数矩阵中，从任意格开始，每步向上、下、左、右的一个严格更大的邻格移动。返回最长路径包含的格子数。',
`from collections import deque

def solve(matrix):
    if not matrix or not matrix[0]:
        return 0
    rows, cols = len(matrix), len(matrix[0])
    def neighbors(r, c):
        for rr, cc in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
            if 0 <= rr < rows and 0 <= cc < cols:
                yield rr, cc
    degree = [[0]*cols for _ in range(rows)]
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            degree[r][c] = sum(matrix[a][b] < matrix[r][c] for a,b in neighbors(r,c))
            if degree[r][c] == 0:
                queue.append((r,c))
    levels = 0
    while queue:
        levels += 1
        for _ in range(len(queue)):
            r,c = queue.popleft()
            for a,b in neighbors(r,c):
                if matrix[a][b] > matrix[r][c]:
                    degree[a][b] -= 1
                    if degree[a][b] == 0:
                        queue.append((a,b))
    return levels`, '从较小值向较大值连边形成有向无环图。按拓扑层次删除入度为零的格子，总层数等于最长路径长度。时间和空间均为 O(mn)。',
  [[[[[1,2,3],[6,5,4]]],6], [[[[7,7],[7,7]]],1], [[[[1],[3],[2]]],2]]),

  q('c6c7742f5ba7442aada113136ddea0c3', 'n', '输入正整数 n，返回斐波那契数列的第 n 项。第 1、2 项均为 1，此后每项等于前两项之和。',
`def solve(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`, '逐轮更新相邻两项。时间 O(n)，额外空间 O(1)。', [[[1],1], [[2],1], [[8],21], [[10],55]]),

  q('6d29638c85bb4ffd80c020fe244baf11', 'a, b', '从两个字符串中分别删除若干字符，保留剩余字符的相对次序。返回一个最长公共子序列字符串；长度为 0 时返回字符串 "-1"。牛客用例的非空最长解唯一，本地评测也接受任一等长合法解。',
`def solve(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n+1) for _ in range(m+1)]
    for i, x in enumerate(a, 1):
        for j, y in enumerate(b, 1):
            dp[i][j] = dp[i-1][j-1]+1 if x == y else max(dp[i-1][j], dp[i][j-1])
    i, j, chars = m, n, []
    while i and j:
        if a[i-1] == b[j-1]:
            chars.append(a[i-1])
            i, j = i-1, j-1
        elif dp[i-1][j] >= dp[i][j-1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(chars)) if chars else "-1"`, '先计算各前缀的最长公共子序列长度，再沿表回溯取出字符。时间和空间均为 O(mn)。',
  [[['abcde','ace'],'ace'], [['ab','cc'],'-1'], [['','abc'],'-1'], [['ab','ba'],'a']],
  {driver:`def run_case(args):
    return solve(*args)

def accepts(args, actual, expected):
    if expected == "-1":
        return actual == "-1"
    if not isinstance(actual, str) or len(actual) != len(expected):
        return False
    for text in args:
        stream = iter(text)
        if not all(ch in stream for ch in actual):
            return False
    return True`}),

  q('f33f5adc55f444baa0e0ca87ad8a6aac', 'a, b', '返回同时连续出现于 a 和 b 中的最长字符串。输入保证最长公共子串存在且唯一。',
`def solve(a, b):
    prev = [0] * (len(b) + 1)
    end, best = 0, 0
    for i, x in enumerate(a, 1):
        for j in range(len(b), 0, -1):
            prev[j] = prev[j-1] + 1 if x == b[j-1] else 0
            if prev[j] > best:
                best, end = prev[j], i
    return a[end-best:end]`, '记录以当前位置结尾的最长相同后缀；逆序更新一维数组保留上一行数据。时间 O(mn)，空间 O(n)。',
  [[['abxyc','txyg'],'xy'], [['mnop','xxmnop'],'mnop'], [['aaa','baab'],'aa']]),

  q('046a55e6cd274cffb88fc32dba695668', 'digits', '数字字符串使用 1 至 26 分别表示字母 a 至 z。统计将整串划分成合法编码的方案数。单独的 0 和带前导零的编码均无效。',
`def solve(digits):
    if not digits:
        return 0
    before, ways = 1, int(digits[0] != "0")
    for i in range(1, len(digits)):
        total = ways if digits[i] != "0" else 0
        if "10" <= digits[i-1:i+1] <= "26":
            total += before
        before, ways = ways, total
    return ways`, '考虑末尾取一位或取两位，将合法前缀的计数相加。时间 O(n)，空间 O(1)。',
  [[['226'],3], [['101'],1], [['30'],0], [['06'],0], [['1111'],5]]),

  q('b4525d1d84934cf280439aeecc36f4af', 'text', '输入仅含大小写字母和数字的字符串，返回最长连续回文子串的长度。比较字符时区分大小写。',
`def solve(text):
    best = 0
    for center in range(len(text)):
        for right in (center, center + 1):
            left = center
            while left >= 0 and right < len(text) and text[left] == text[right]:
                left -= 1
                right += 1
            best = max(best, right - left - 1)
    return best`, '分别从单字符和相邻字符之间展开，覆盖奇数与偶数长度的回文。时间 O(n²)，空间 O(1)。',
  [[['abcca'],2], [['azqza'],5], [['Aa'],1], [['1221x'],4]]),

  q('ce73540d47374dbe85b3125f57727e1e', 'digits', '向十进制数字串中插入三个点，返回全部合法 IPv4 地址。每段包含 1 至 3 位、数值在 0 至 255 之间，只有单独的 0 可以以零开头。允许任意输出顺序。',
`def solve(digits):
    result, parts = [], []
    def visit(i):
        remaining = 4 - len(parts)
        if not (remaining <= len(digits) - i <= 3 * remaining):
            return
        if remaining == 0:
            result.append(".".join(parts))
            return
        for end in range(i+1, min(i+3,len(digits))+1):
            part = digits[i:end]
            if (len(part) > 1 and part[0] == "0") or int(part) > 255:
                break
            parts.append(part)
            visit(end)
            parts.pop()
    visit(0)
    return result`, '回溯决定每段长度，用剩余字符数、前导零和数值范围剪枝。最多尝试 3⁴ 种长度组合，递归深度为 4。',
  [[['010010'], ['0.10.0.10','0.100.1.0']], [['0000'],['0.0.0.0']], [['999999999999'],[]]], {driver:sortedOutput}),

  q('28970c15befb4ff3a264189087b99ad4', 'text, pattern', '判断整个小写字母字符串是否符合模式。点匹配任一单字符，星号使前一个字符或点重复零次或多次。输入模式合法，只含小写字母、点和星号。',
`def solve(text, pattern):
    n = len(pattern)
    prev = [False] * (n + 1)
    prev[0] = True
    for j in range(2, n + 1):
        prev[j] = pattern[j-1] == "*" and prev[j-2]
    for ch in text:
        curr = [False] * (n + 1)
        for j in range(1, n + 1):
            p = pattern[j-1]
            if p == "*":
                curr[j] = curr[j-2] or (pattern[j-2] in (ch, ".") and prev[j])
            else:
                curr[j] = prev[j-1] and p in (ch, ".")
        prev = curr
    return prev[n]`, '以前缀匹配构造动态规划，星号可以跳过其对应项，或消费一个字符并保持当前模式。时间 O(mn)，空间 O(n)。',
  [[['abaa','ab.*'],true], [['','x*y*'],true], [['ab','a'],false], [['a','ab*'],true], [['aaa','a*a*b'],false]]),

  q('a5c127769dd74a63ada7bff37d9c5815', 'nums', '各房间沿圆环排列，nums[i] 是非负金额。相邻房间不可同时选择，首尾也是邻居。求最大可选金额；只有一个房间时可选该房间。',
`def solve(nums):
    if len(nums) < 2:
        return sum(nums)
    def linear(start, end):
        older = newer = 0
        for i in range(start, end):
            older, newer = newer, max(newer, older + nums[i])
        return newer
    return max(linear(0, len(nums)-1), linear(1, len(nums)))`, '分别排除首间和末间，各自按线性不相邻选取求最大和，再取较大值。时间 O(n)，空间 O(1)。',
  [[[[3,1,3]],3], [[[4,2,7,9]],11], [[[8]],8], [[[1,8]],8]]),

  q('c3120c1c1bc44ad986259c0cf0f0b80e', 'text, n', '输入长度为 n 的字符串，仅含英文字母与空格。将单词顺序倒置并交换所有字母的大小写。单词间连续空格整体随顺序翻转，开头的空格移到末尾，末尾的移到开头。',
`def solve(text, n):
    return " ".join(word.swapcase() for word in reversed(text.split(" ")))`, '按单个空格切分并保留空字段，倒序处理各字段的大小写。时间和空间均为 O(n)。',
  [[['Ai  lab',7],'LAB  aI'], [[' A b  ',6],'  B a '], [['AbC',3],'aBc']]),

  q('55fb3c68d08d46119f76ae2df7566880', 'address', '判断字符串是否是本题规定的地址。IPv4 必须有四个点分十进制段，值为 0 至 255，多位段首位为 1 至 9。IPv6 必须有八个冒号分隔的段，每段恰含 1 至 4 个十六进制字符。分别返回 "IPv4"、"IPv6" 或 "Neither"。',
`def solve(address):
    v4 = address.split(".")
    if len(v4) == 4 and all(1 <= len(s) <= 3 and all(c in "0123456789" for c in s)
                             and (len(s) == 1 or s[0] != "0") and int(s) <= 255 for s in v4):
        return "IPv4"
    v6 = address.split(":")
    if len(v6) == 8 and all(1 <= len(s) <= 4 and all(c in "0123456789abcdefABCDEF" for c in s) for s in v6):
        return "IPv6"
    return "Neither"`, '分段检查数量、字符、范围和各类地址的前导零规则。时间和空间均为 O(n)。',
  [[['0.12.254.3'],'IPv4'], [['1.02.3.4'],'Neither'], [['255.0.1.256'],'Neither'], [['A:01:beef:0:0:0:0:9'],'IPv6'], [['A::beef:0:0:0:0:9'],'Neither']]),

  q('11ae12e8c6fe48f883cad618c2e81475', 'a, b', '两个十进制字符串分别表示非负加数，空字符串按 0 处理。计算并返回十进制和字符串。按位完成运算，使算法适用于超过语言整数直接转换长度的输入。',
`def solve(a, b):
    i, j = len(a)-1, len(b)-1
    carry, digits = 0, []
    while i >= 0 or j >= 0 or carry:
        total = carry
        if i >= 0:
            total += ord(a[i]) - ord("0")
            i -= 1
        if j >= 0:
            total += ord(b[j]) - ord("0")
            j -= 1
        carry, digit = divmod(total, 10)
        digits.append(str(digit))
    return "".join(reversed(digits)).lstrip("0") or "0"`, '从个位向高位同步遍历，记录一位进位，最后翻转数字序列。时间及输出空间 O(m+n)。',
  [[['999998','7'],'1000005'], [['0','0'],'0'], [['123456789123456789','1'],'123456789123456790'], [['57',''],'57']]),

  q('89865d4375634fc484f3a24b7fe65665', 'a, m, b, n', '样例给出两个非降序数组。评测器先在 a 的尾部预留 n 个位置，然后传入 a、有效长度 m、b、长度 n。原地将两数组合并到 a；判题读取修改后的 a。',
`def solve(a, m, b, n):
    i, j, out = m-1, n-1, m+n-1
    while j >= 0:
        if i >= 0 and a[i] > b[j]:
            a[out] = a[i]
            i -= 1
        else:
            a[out] = b[j]
            j -= 1
        out -= 1`, '比较两段末尾的有效值，将较大者填入结果尾部。时间 O(m+n)，额外空间 O(1)。',
  [[[[2,7],[1,4,4]], [1,2,4,4,7]], [[[],[3]], [3]], [[[-4,2],[]], [-4,2]]],
  {driver:'def run_case(args):\n    a, b = args\n    m, n = len(a), len(b)\n    a.extend([0] * n)\n    solve(a, m, b, n)\n    return a'}),

  q('e297fdd8e9f543059b0b5f05f3a7f3b2', 'text', '给出一个由小写字母组成的字符串，判断它从前向后与从后向前是否逐字符相同。',
`def solve(text):
    left, right = 0, len(text)-1
    while left < right:
        if text[left] != text[right]:
            return False
        left += 1
        right -= 1
    return True`, '两端指针向中间移动并比较对应字符。时间 O(n)，空间 O(1)。',
  [[['abcba'],true],[['abab'],false],[['z'],true],[['abba'],true]]),

  q('69f4e5b7ad284a478777cb2a17fb5e6a', 'intervals', '输入若干闭区间对象，每个对象有 start、end 两个整数属性。将所有相交或端点相同的区间合并，按起点升序返回 Interval 列表。样例以 [start,end] 展示每个对象。',
`def solve(intervals):
    merged = []
    for current in sorted(intervals, key=lambda x: x.start):
        if merged and current.start <= merged[-1].end:
            merged[-1].end = max(merged[-1].end, current.end)
        else:
            merged.append(current)
    return merged`, '排序后仅需判断新区间能否并入结果中的最后一个区间。时间 O(n log n)，空间 O(n)。',
  [[[[[6,8],[1,3],[3,6],[9,10]]], [[1,8],[9,10]]], [[[]],[]], [[[[1,7],[2,3]]],[[1,7]]]],
  {prelude:'class Interval:\n    def __init__(self, start=0, end=0):\n        self.start, self.end = start, end\n',
   driver:'def run_case(args):\n    nodes = [Interval(a,b) for a,b in args[0]]\n    return [[x.start,x.end] for x in solve(nodes)]'}),

  q('c3a6afee325e472386a1c4eb1ef987f3', 'text', '返回输入字符串按字符顺序反转后的新字符串。输入为空时返回空字符串。',
`def solve(text):
    return text[::-1]`, '按逆序切片得到结果。时间 O(n)，返回字符串占用 O(n) 空间。',
  [[['train'],'niart'],[[''],''],[['a C'],'C a']]),

  q('b56799ebfd684fb394bd315e89324fb4', 'nums', '返回整数数组中最长连续子数组的长度，要求所选子数组的值互不相同。',
`def solve(nums):
    last, left, best = {}, 0, 0
    for right, x in enumerate(nums):
        left = max(left, last.get(x,-1)+1)
        best = max(best, right-left+1)
        last[x] = right
    return best`, '维护每个值最后出现的位置。新值重复时把左边界移到上次位置之后。时间 O(n)，空间 O(n)。',
  [[[[4,2,4,3,7]],4], [[[3,4,4,3]],2], [[[9,9]],1]]),

  q('4edf6e6d01554870a12f218c94e8a299', 'n, intervals', 'n 个活动分别占用时间区间 [start,end)，每个活动从开始到结束占用一名主持人。前一活动结束时可以立即接手下一场。求覆盖全部活动所需的最少主持人数。',
`import heapq

def solve(n, intervals):
    ends = []
    for start, end in sorted(intervals):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)`, '按开始时间处理，用最小堆维护每名主持人最新的结束时间。最早结束者空闲时复用，否则新增一人。时间 O(n log n)，空间 O(n)。',
  [[[3,[[3,5],[0,3],[1,4]]],2], [[2,[[1,4],[4,5]]],1], [[3,[[0,5],[1,4],[2,3]]],3]]),

  q('e19927a8fd5d477794dac67096862042', 'n, m, nums', '把长度 n 的数组循环右移 m 位，参数顺序为 n、m、数组。原地完成旋转并返回结果数组，m 是非负整数。',
`def solve(n, m, nums):
    if n == 0:
        return nums
    k = m % n
    def reverse(a, b):
        while a < b:
            nums[a], nums[b] = nums[b], nums[a]
            a, b = a+1, b-1
    reverse(0,n-1)
    reverse(0,k-1)
    reverse(k,n-1)
    return nums`, '全部反转后，再反转前 k 项和剩余项，恢复两个区段内部次序。时间 O(n)，额外空间 O(1)。',
  [[[4,5,[1,2,3,4]],[4,1,2,3]], [[3,0,[8,4,2]],[8,4,2]], [[1,17,[9]],[9]]]),

  q('2e95333fbdd4451395066957e24909cc', 'matrix, n', '给出 n×n 的整数方阵和阶数 n，把方阵顺时针旋转 90 度并返回旋转后的矩阵。',
`def solve(matrix, n):
    for i in range(n):
        for j in range(i+1,n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
    return matrix`, '先沿主对角线转置，再反转每行。每个位置从 (i,j) 移到 (j,n-1-i)。时间 O(n²)，额外空间 O(1)。',
  [[[[[2,3],[4,5]],2], [[4,2],[5,3]]], [[[[1]],1],[[1]]], [[[[0,1,2],[3,4,5],[6,7,8]],3],[[6,3,0],[7,4,1],[8,5,2]]]]),

  q('5dfded165916435d9defb053c63f1e84', '', '实现 Solution(capacity) 的 get(key)、set(key,value)。查询命中和写入均刷新访问次序，超出正整数容量时淘汰最近最久未访问的键。缺失返回 -1。样例依次给操作名列表、参数列表和容量；展示时 set 写为字符串 "null"，get 的整数结果转为字符串。',
`from collections import OrderedDict

class Solution:
    def __init__(self, capacity):
        self.capacity = capacity
        self.values = OrderedDict()

    def get(self, key):
        if key not in self.values:
            return -1
        self.values.move_to_end(key)
        return self.values[key]

    def set(self, key, value):
        self.values[key] = value
        self.values.move_to_end(key)
        if len(self.values) > self.capacity:
            self.values.popitem(last=False)`, '有序哈希表在尾部维护最新访问项，容量超出时删除首项。每次操作均摊 O(1)，空间 O(capacity)。',
  [[[['set','set','get','set','get','get'],[[1,9],[2,7],[1],[3,4],[2],[1]],2], ['null','null','9','null','-1','9']],
    [[['set','set','get','set','get'],[[2,3],[2,6],[2],[8,1],[2]],1], ['null','null','6','null','-1']]],
  {signature:'Solution(capacity).get(key) / set(key, value)',starter:'class Solution:\n    def __init__(self, capacity):\n        pass\n\n    def get(self, key):\n        pass\n\n    def set(self, key, value):\n        pass\n',
   driver:`def run_case(args):
    ops, values, capacity = args
    cache, result = Solution(capacity), []
    for op, parameters in zip(ops, values):
        if op == "get":
            value = cache.get(*parameters)
            if type(value) != int:
                raise TypeError("get 应返回整数")
            result.append(str(value))
        else:
            cache.set(*parameters)
            result.append("null")
    return result`}),

  q('93aacb4a887b46d897b00823f30bfea1', 'operations, capacity', '执行 LFU 缓存操作。[1,key,value] 新增或更新，[2,key] 查询，未命中返回 -1。每次成功读取或写入使该键的访问次数加一，新键从 1 开始。满容量时淘汰访问次数最少的旧键，同频率时淘汰上次访问最早的键。依次返回全部查询结果。',
`from collections import OrderedDict

def solve(operations, capacity):
    values, freq, buckets = {}, {}, {}
    minimum, answers = 0, []
    def touch(key):
        nonlocal minimum
        f = freq[key]
        del buckets[f][key]
        if not buckets[f]:
            del buckets[f]
            if minimum == f:
                minimum += 1
        freq[key] = f + 1
        buckets.setdefault(f+1, OrderedDict())[key] = None
    for op in operations:
        mode, key = op[:2]
        if mode == 2:
            answers.append(values.get(key, -1))
            if key in values:
                touch(key)
        elif key in values:
            touch(key)
            values[key] = op[2]
        elif capacity:
            if len(values) == capacity:
                victim, _ = buckets[minimum].popitem(last=False)
                if not buckets[minimum]:
                    del buckets[minimum]
                del values[victim], freq[victim]
            values[key], freq[key], minimum = op[2], 1, 1
            buckets.setdefault(1, OrderedDict())[key] = None
    return answers`, '按频率分组，每组以有序哈希表记录同频键的访问次序，用 minimum 直接定位淘汰组。每次操作均摊 O(1)，缓存空间 O(capacity)。',
  [[[[[1,1,5],[1,2,6],[2,1],[1,3,7],[2,2],[2,3]],2],[5,-1,7]],
   [[[[1,1,2],[1,2,5],[1,1,9],[2,2],[1,3,3],[2,1],[2,2]],2],[5,-1,5]],
   [[[[2,8],[1,8,7],[2,8]],1],[-1,7]]]),
]
