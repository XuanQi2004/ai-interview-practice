'use strict';
const {q} = require('../catalog-kit.cjs');
const pack = [];
function add(slug, params, statement, body, explanation, tests, options) {
  const solution = options?.classOnly ? body.trim() : 'def solve(' + params + '):\n' + body.trimEnd();
  pack.push(q('lc-' + slug, params, statement, solution, explanation, tests, options));
}
const sortedList = {driver: 'def run_case(args):\n    return sorted(solve(*args))'};
function linked(expectedOrder) {
  return {driver: `def run_case(args):
    head = list_from(args[0])
    nodes = []
    current = head
    while current is not None:
        nodes.append(current)
        current = current.next
    ${expectedOrder}
    result = solve(head, *args[1:])
    values = []
    for node in ordered:
        if result is not node:
            raise ValueError('请按题目指定的顺序连接原链表节点')
        values.append(result.val)
        result = result.next
    if result is not None:
        raise ValueError('结果链表尾部应为 None')
    return values`};
}
const treeInput = {driver: 'def run_case(args):\n    return solve(tree_from(args[0]), *args[1:])'};
const inPlace = {driver: 'def run_case(args):\n    solve(args[0])\n    return args[0]'};

add('find-the-index-of-the-first-occurrence-in-a-string','haystack, needle','给定两个字符串，返回 needle 作为连续子串首次出现在 haystack 时的零基下标。找不到返回 -1；空模式返回 0。',`    if not needle:
        return 0
    prefix = [0] * len(needle)
    j = 0
    for i in range(1, len(needle)):
        while j and needle[i] != needle[j]:
            j = prefix[j-1]
        if needle[i] == needle[j]:
            j += 1
        prefix[i] = j
    j = 0
    for i, ch in enumerate(haystack):
        while j and needle[j] != ch:
            j = prefix[j-1]
        if needle[j] == ch:
            j += 1
        if j == len(needle):
            return i-j+1
    return -1`,'KMP 的前缀表保存匹配失败后仍能保留的前缀长度，扫描文本时复用这些匹配。时间 O(n+m)，空间 O(m)。',[[['aaab','aab'],1],[['abc','d'],-1],[['abab','ab'],0],[['',''],0]]);
add('text-justification','words, maxWidth','输入非空单词列表，每个词长度为 1 到 maxWidth。每行尽量多放连续单词，词间至少一个空格，行宽固定为 maxWidth。普通多词行把剩余空格平均分到各个词间隙，余数优先加到左侧。末行和单词独占行按左对齐，右侧用空格补足。返回字符串列表。',`    lines = []
    i = 0
    while i < len(words):
        j, letters = i, 0
        while j < len(words) and letters + len(words[j]) + j-i <= maxWidth:
            letters += len(words[j])
            j += 1
        if j == len(words) or j-i == 1:
            line = ' '.join(words[i:j]).ljust(maxWidth)
        else:
            width, extra = divmod(maxWidth-letters, j-i-1)
            line = ''.join(words[k] + ' ' * (width + (k-i < extra)) for k in range(i,j-1)) + words[j-1]
        lines.append(line)
        i = j
    return lines`,'先选出当前行能容纳的最长前缀，再按间隙数分配空格。时间与输出字符数成正比，额外临时空间 O(maxWidth)。',[[[['ab','c','d','xyz'],7],['ab  c d','xyz    ']],[[['a','bb','cc'],2],['a ','bb','cc']],[[['hi'],4],['hi  ']]]);
add('valid-palindrome','s','输入 ASCII 字符串。保留英文字母和数字，将字母视作小写，判断所得序列从前往后和从后往前是否相同。空序列返回 True。',`    left, right = 0, len(s)-1
    while left < right:
        if not s[left].isalnum():
            left += 1
        elif not s[right].isalnum():
            right -= 1
        elif s[left].lower() != s[right].lower():
            return False
        else:
            left += 1
            right -= 1
    return True`,'两端跳过分隔符并比较有效字符。时间 O(n)，空间 O(1)。',[[['A,1!a'],true],[['0P'],false],[[' ! '],true]]);
add('two-sum-ii-input-array-is-sorted','numbers, target','numbers 已按非递减顺序排列，恰有一对不同位置的数之和等于 target。返回这两个位置的一基下标，小下标在前。使用常数额外空间。',`    lo, hi = 0, len(numbers)-1
    while lo < hi:
        total = numbers[lo] + numbers[hi]
        if total == target:
            return [lo+1, hi+1]
        if total < target:
            lo += 1
        else:
            hi -= 1`,'和偏小时增大左端，偏大时减小右端，每次可以排除一个位置。时间 O(n)，空间 O(1)。',[[[[-5,-2,0,4],-1],[1,4]],[[[3,3],6],[1,2]],[[[1,4,6,10],10],[2,3]]]);
add('minimum-size-subarray-sum','target, nums','给定正整数 target 和正整数数组 nums。求和至少为 target 的最短非空连续子数组长度。没有这样的区间返回 0。',`    left = total = 0
    best = len(nums)+1
    for right, value in enumerate(nums):
        total += value
        while total >= target:
            best = min(best, right-left+1)
            total -= nums[left]
            left += 1
    return 0 if best > len(nums) else best`,'元素为正，右移左端只会减少区间和。固定右端后尽量缩短窗口即可。时间 O(n)，空间 O(1)。',[[[7,[2,3,1,2,4,3]],2],[[9,[1,2]],0],[[4,[4]],1]]);
add('substring-with-concatenation-of-all-words','s, words','words 非空，所有词都有相同的正长度，可以重复。找到 s 中恰由所有给定词按某种次序首尾相接组成的子串，返回全部起始下标，顺序任选。',`    from collections import Counter
    need = Counter(words)
    width = len(words[0])
    answer = []
    for offset in range(width):
        left = offset
        have = Counter()
        for i in range(offset, len(s)-width+1, width):
            word = s[i:i+width]
            if word not in need:
                have.clear()
                left = i+width
                continue
            have[word] += 1
            while have[word] > need[word]:
                have[s[left:left+width]] -= 1
                left += width
            if i+width-left == len(words)*width:
                answer.append(left)
    return answer`,'按起点对词长的余数分组，把每个完整词作为窗口元素，出现过多时收缩。词长 w、文本长度 n 时，切片与哈希的期望时间 O(nw+输入词总长度)，计数表存不同词。',[[['aaaaaa',['aa','aa']],[0,1,2]],[['abxaba',['a','b']],[0,3,4]],[['foofoo',['foo','bar']],[]]],sortedList);
const blankSudoku = () => Array.from({length:9},()=>Array(9).fill('.'));
const sudoku = entries => { const b=blankSudoku(); for(const [r,c,v] of entries) b[r][c]=v; return b; };
add('valid-sudoku','board','输入 9×9 棋盘，空格以 "." 表示，其他格为字符 "1" 到 "9"。判断每行、每列和每个 3×3 宫中的已填数字是否各自唯一。',`    seen = set()
    for r, row in enumerate(board):
        for c, value in enumerate(row):
            if value == '.':
                continue
            for key in (('r',r,value), ('c',c,value), ('b',r//3,c//3,value)):
                if key in seen:
                    return False
                seen.add(key)
    return True`,'为行、列与宫设置独立的标记域。固定 9×9 棋盘的时间与空间均为常数。',[[[sudoku([[0,0,'2'],[0,3,'3'],[3,1,'2']])],true],[[sudoku([[0,0,'4'],[1,1,'4']])],false],[[sudoku([[0,0,'8'],[8,0,'8']])],false]]);
add('game-of-life','board','board 是由 0（死）和 1（活）组成的非空矩形棋盘。一个格的邻居为周围八格中的有效位置。活细胞有 2 或 3 个活邻居时存活，死细胞恰有 3 个活邻居时复活，其余格下一代为 0。原地把 board 改为同时更新一代后的棋盘；判题读取变更后的 board。',`    m, n = len(board), len(board[0])
    for i in range(m):
        for j in range(n):
            total = sum(board[r][c] & 1 for r in range(max(0,i-1),min(m,i+2))
                        for c in range(max(0,j-1),min(n,j+2)) if (r,c)!=(i,j))
            if total == 3 or (board[i][j] & 1 and total == 2):
                board[i][j] |= 2
    for row in board:
        for j in range(n):
            row[j] >>= 1`,'用最低位读取旧状态，第二位记录新状态，第二遍整体右移。时间 O(mn)，额外空间 O(1)。',[[[[[0,1,0],[0,1,0],[0,1,0]]],[[0,0,0],[1,1,1],[0,0,0]]],[[[[1]]],[[0]]],[[[[1,1],[1,1]]],[[1,1],[1,1]]]],inPlace);
add('ransom-note','ransomNote, magazine','两串均由小写英文字母组成。magazine 中每个字符最多取用一次，判断能否拼出 ransomNote，允许重新排列。',`    from collections import Counter
    return not (Counter(ransomNote)-Counter(magazine))`,'统计各字母的需求与供应，检查所有需求均可满足。时间 O(n+m)，固定字母表空间 O(1)。',[[['aba','aabc'],true],[['aa','ba'],false],[['','x'],true]]);
add('isomorphic-strings','s, t','判断等长字符串 s、t 是否能通过逐字符的一一映射互换。s 中相同字符须映到 t 中同一字符，两个不同字符应映到不同字符。',`    forward, reverse = {}, {}
    for a, b in zip(s,t):
        if forward.setdefault(a,b) != b or reverse.setdefault(b,a) != a:
            return False
    return len(s) == len(t)`,'维护正反向映射以保证双射。时间 O(n)，空间 O(k)，k 为不同字符数。',[[['add','egg'],true],[['ab','aa'],false],[['aa','ab'],false]]);
add('word-pattern','pattern, s','pattern 由小写字母组成；s 中各小写英文单词以一个空格分隔。判断 pattern 的字符与这些单词是否按顺序一一对应，同一字符对应同一个词，不同字符对应不同词。',`    words = s.split()
    if len(pattern) != len(words):
        return False
    forward, reverse = {}, {}
    for ch, word in zip(pattern,words):
        if forward.setdefault(ch,word) != word or reverse.setdefault(word,ch) != ch:
            return False
    return True`,'先匹配长度，再逐项维护字符到词、词到字符两个方向。时间和空间均为 O(输入字符总数)。',[[['abba','one two two one'],true],[['ab','cat cat'],false],[['aaa','red red'],false]]);
add('valid-anagram','s, t','给定两个小写英文字符串，判断重排 s 的全部字符后能否得到 t。每个字符的出现次数均须保留。',`    from collections import Counter
    return Counter(s) == Counter(t)`,'比较每种字母的计数。时间 O(n+m)，固定字母表空间 O(1)。',[[['abcab','bbaca'],true],[['ab','aa'],false],[['a','aa'],false]]);
add('happy-number','n','从正整数 n 开始，反复把当前数换成其各十进制位的平方和。到达 1 返回 True，进入其他循环返回 False。',`    def step(x):
        total = 0
        while x:
            x, digit = divmod(x, 10)
            total += digit * digit
        return total
    slow, fast = n, step(n)
    while fast != 1 and slow != fast:
        slow = step(slow)
        fast = step(step(fast))
    return fast == 1`,'快慢指针以不同速度迭代即可检测循环，空间 O(1)。第一次求位平方和耗时 O(log n)，后续数值迅速减小。',[[[19],true],[[2],false],[[1],true]]);
add('contains-duplicate-ii','nums, k','给定整数数组和非负整数 k。判断是否存在两个不同下标，其元素相同，且下标距离至多为 k。',`    recent = {}
    for i, value in enumerate(nums):
        if value in recent and i-recent[value] <= k:
            return True
        recent[value] = i
    return False`,'同一值最近出现的位置最容易满足距离限制。时间 O(n)，空间 O(n)。',[[[[1,2,1],2],true],[[[1,2,1],1],false],[[[3,3],0],false]]);
add('summary-ranges','nums','输入严格递增的整数数组。把连续整数压缩成极大的区间，单元素写成 "a"，其他区间写成 "a->b"。按原序返回字符串数组。',`    out = []
    i = 0
    while i < len(nums):
        j = i
        while j+1 < len(nums) and nums[j+1] == nums[j]+1:
            j += 1
        out.append(str(nums[i]) if i == j else f"{nums[i]}->{nums[j]}")
        i = j+1
    return out`,'保持当前连续段的起止下标，遇到断点便输出。时间 O(n+输出长度)，额外空间 O(1)，输出除外。',[[[[-2,-1,0,3,5,6]],['-2->0','3','5->6']],[[[]],[]],[[[7]],['7']]]);
add('insert-interval','intervals, newInterval','intervals 是按左端点排序且两两互不相交的闭区间。加入一个新闭区间，合并所有重叠部分，保留原排序后返回。共用端点算重叠。',`    out = []
    lo, hi = newInterval
    i = 0
    while i < len(intervals) and intervals[i][1] < lo:
        out.append(intervals[i])
        i += 1
    while i < len(intervals) and intervals[i][0] <= hi:
        a, b = intervals[i]
        lo, hi = min(lo,a), max(hi,b)
        i += 1
    return out + [[lo,hi]] + intervals[i:]`,'依次收集左侧区间、并入与新段相交的区间、保留右侧后缀。时间和结果空间 O(n)。',[[[[[1,2],[4,7],[9,10]],[2,9]],[[1,10]]],[[[],[3,4]],[[3,4]]],[[[[1,4]],[5,5]],[[1,4],[5,5]]]]);
add('simplify-path','path','将 Unix 绝对路径化为标准形式。连续斜杠合并，"." 表示当前目录，".." 回到上级，根目录的上级仍为根。其他非空段均为普通目录名。除根目录外，结果末尾省略斜杠。',`    parts = []
    for name in path.split('/'):
        if name == '..':
            if parts:
                parts.pop()
        elif name and name != '.':
            parts.append(name)
    return '/' + '/'.join(parts)`,'栈保存从根到当前目录的有效路径段。时间和空间 O(n)。',[[['/a//b/.././c/'],'/a/c'],[['/../../'],'/'],[['/.../x..'],'/.../x..']]);
add('evaluate-reverse-polish-notation','tokens','tokens 表示合法的逆波兰式，各项为整数文本或 +、-、*、/。每个运算符取之前最近的两个结果，先出现的数为左操作数。整数除法向零截断，除数非零。返回最终整数。',`    stack = []
    for token in tokens:
        if token not in ('+', '-', '*', '/'):
            stack.append(int(token))
            continue
        b, a = stack.pop(), stack.pop()
        if token == '+':
            value = a+b
        elif token == '-':
            value = a-b
        elif token == '*':
            value = a*b
        else:
            value = abs(a)//abs(b) * (-1 if (a<0) != (b<0) else 1)
        stack.append(value)
    return stack[0]`,'后缀表达式的运算数按栈的逆序取出。时间 O(n)，空间 O(n)。',[[[['3','-7','2','/','+']],0],[[['8','3','-','2','*']],10],[[['-4']],-4]]);
add('basic-calculator','s','计算合法表达式 s，支持非负十进制整数、空格、加减号和嵌套圆括号。减号也可表示取负，例如 "-(3+5)"。返回最终整数。',`    total, sign, number = 0, 1, 0
    stack = []
    for ch in s:
        if ch.isdigit():
            number = number*10 + int(ch)
        elif ch in '+-':
            total += sign * number
            number = 0
            sign = 1 if ch == '+' else -1
        elif ch == '(':
            stack.append((total, sign))
            total, sign, number = 0, 1, 0
        elif ch == ')':
            total += sign * number
            outer, direction = stack.pop()
            total, sign, number = outer + direction*total, 1, 0
    return total + sign*number`,'每层维护已结算值和下一项的符号。进入括号时保存外层状态，离开时把整层结果作为一个数。时间 O(n)，空间 O(嵌套深度)。',[[['- (3 - (2 + 4)) + 12'],15],[['1-(-2)'],3],[['42'],42]]);

add('reverse-linked-list-ii','head, left, right','head 是单链表头，left 和 right 为从 1 开始的位置且 1 ≤ left ≤ right ≤ 链表长度。原地反转这段节点并返回新头。界面用整数数组表示链表。',`    dummy = ListNode(0,head)
    before = dummy
    for _ in range(left-1):
        before = before.next
    tail = before.next
    for _ in range(right-left):
        moved = tail.next
        tail.next = moved.next
        moved.next = before.next
        before.next = moved
    return dummy.next`,'定位反转段前驱，反复将段尾指针之后的节点移到段首。时间 O(n)，空间 O(1)。',[[[[1,2,3,4,5],2,4],[1,4,3,2,5]],[[[3,8],1,2],[8,3]],[[[2],1,1],[2]]],linked(`start, end = args[1]-1, args[2]
    ordered = nodes[:start] + nodes[start:end][::-1] + nodes[end:]`));
add('remove-duplicates-from-sorted-list-ii','head','单链表按非递减顺序排列。删除所有出现多次的值所对应的全部节点，保留只出现一次的节点并返回头指针。输入输出以数组展示，空链表为 []。',`    dummy = ListNode(0,head)
    keep = dummy
    while head:
        end = head
        while end.next and end.next.val == head.val:
            end = end.next
        if end is head:
            keep = head
        else:
            keep.next = end.next
        head = end.next
    return dummy.next`,'一次扫描找到每段等值节点，整段重复时用前驱跳过。时间 O(n)，空间 O(1)。',[[[[1,1,2,3,3,4]],[2,4]],[[[1,1]],[]],[[[]],[]],[[[2,3]],[2,3]]],linked(`from collections import Counter
    counts = Counter(args[0])
    ordered = [node for node in nodes if counts[node.val] == 1]`));
add('rotate-list','head, k','给定单链表和非负整数 k，将尾节点移到最前面的操作重复 k 次，返回旋转后的头节点。用数组展示链表，可为空。',`    if not head:
        return head
    tail, n = head, 1
    while tail.next:
        n += 1
        tail = tail.next
    shift = k % n
    if not shift:
        return head
    end = head
    for _ in range(n-shift-1):
        end = end.next
    first = end.next
    end.next = None
    tail.next = head
    return first`,'旋转 n 位等于原序，只需按余数定位切分点并重连首尾。时间 O(n)，空间 O(1)。',[[[[1,2,3,4],6],[3,4,1,2]],[[[],5],[]],[[[7,8],0],[7,8]]],linked(`shift = args[1] % len(nodes) if nodes else 0
    ordered = nodes[-shift:] + nodes[:-shift]`));
add('partition-list','head, x','将单链表中小于 x 的节点放在前面，大于等于 x 的节点放在后面。每组保持原来的先后顺序，返回新头。用数组展示输入和输出的链表。',`    small, large = ListNode(), ListNode()
    a, b = small, large
    while head:
        following = head.next
        head.next = None
        if head.val < x:
            a.next = head
            a = head
        else:
            b.next = head
            b = head
        head = following
    a.next = large.next
    return small.next`,'将节点按原顺序追加到两个链尾，最后连接两段。时间 O(n)，空间 O(1)。',[[[[3,1,2,4,1],3],[1,2,1,3,4]],[[[],0],[]],[[[3,3,2],3],[2,3,3]]],linked(`ordered = sorted(nodes, key=lambda node: node.val >= args[1])`));
add('same-tree','p, q','输入两棵可能为空的二叉树根节点。仅当对应位置的结构和值均相同时返回 True。界面以层序数组展示，null 表示缺少子节点。',`    stack = [(p,q)]
    while stack:
        a, b = stack.pop()
        if a is None or b is None:
            if a is not b:
                return False
        else:
            if a.val != b.val:
                return False
            stack.extend([(a.left,b.left),(a.right,b.right)])
    return True`,'成对遍历对应节点，逐个核对空节点与数值。时间 O(n)，栈空间 O(h)。',[[[[1,2],[1,null,2]],false],[[[1,2,2],[1,2,2]],true],[[[],[]],true],[[[3],[2]],false]],{driver:'def run_case(args):\n    return solve(tree_from(args[0]), tree_from(args[1]))'});
add('construct-binary-tree-from-inorder-and-postorder-traversal','inorder, postorder','给定同一棵树的中序和后序遍历数组，节点值互异。构造并返回根节点，空遍历返回 None。判题比较层序表示。',`    if not postorder:
        return None
    root = TreeNode(postorder[-1])
    stack = [root]
    i = len(inorder)-1
    for value in reversed(postorder[:-1]):
        child = TreeNode(value)
        if stack[-1].val != inorder[i]:
            stack[-1].right = child
        else:
            while stack and stack[-1].val == inorder[i]:
                parent = stack.pop()
                i -= 1
            parent.left = child
        stack.append(child)
    return root`,'逆后序按根、右、左建立节点，用逆中序决定何时结束右子树转向左侧。每节点进出栈各一次，时间 O(n)，辅助空间 O(n)。',[[[[2,1,3],[2,3,1]],[1,2,3]],[[[1,2,3],[3,2,1]],[1,null,2,null,3]],[[[],[]],[]]],{driver:'def run_case(args):\n    return tree_values(solve(*args))'});
const nextNode = `class Node:
    def __init__(self, val=0, left=None, right=None, next=None):
        self.val, self.left, self.right, self.next = val, left, right, next
`;
add('populating-next-right-pointers-in-each-node-ii','root','给定任意二叉树，每个 Node 有 val、left、right、next，初始 next 均为 None。原地令每个节点的 next 指向同层右侧相邻节点，同层末尾指向 None，返回根节点。输入用层序数组，判题展示各层的 next 链。尝试仅用常量额外空间。',`    level = root
    while level:
        start = tail = Node()
        current = level
        while current:
            for child in (current.left,current.right):
                if child:
                    tail.next = child
                    tail = child
            current = current.next
        level = start.next
    return root`,'沿已经建立的 next 链走过当前层，依次把孩子串成下一层。时间 O(n)，额外空间 O(1)。',[[[[1,2,3,4,null,null,5]],[[1],[2,3],[4,5]]],[[[1,null,2,3]],[[1],[2],[3]]],[[[]],[]]],{prelude:nextNode,driver:`def run_case(args):
    from collections import deque
    vals = iter(args[0])
    top = next(vals, None)
    root = Node(top) if top is not None else None
    todo = deque([root]) if root else deque()
    levels = []
    while todo:
        level = []
        for _ in range(len(todo)):
            node = todo.popleft()
            level.append(node)
            for side in ('left','right'):
                v = next(vals,None)
                if v is not None:
                    child = Node(v)
                    setattr(node,side,child)
                    todo.append(child)
        levels.append(level)
    children = {node: (node.left, node.right) for level in levels for node in level}
    if solve(root) is not root:
        raise ValueError('请返回原树根节点')
    for level in levels:
        for i, node in enumerate(level):
            left, right = children[node]
            if node.left is not left or node.right is not right:
                raise ValueError('填写 next 时应保留原树中的左右子节点')
            wanted = level[i+1] if i+1 < len(level) else None
            if node.next is not wanted:
                raise ValueError(f'值为 {node.val} 的节点 next 指向错误')
    return [[node.val for node in level] for level in levels]`});
add('path-sum','root, targetSum','判断二叉树是否存在从根到叶子的路径，使节点值之和等于 targetSum。叶子指两个孩子都为空的节点；空树返回 False。输入以层序数组展示。',`    stack = [(root,targetSum)] if root else []
    while stack:
        node, rest = stack.pop()
        rest -= node.val
        if not node.left and not node.right and rest == 0:
            return True
        for child in (node.left,node.right):
            if child:
                stack.append((child,rest))
    return False`,'沿路径传递剩余目标，只在叶子处判断。时间 O(n)，空间 O(h)。',[[[[1,2,3],3],true],[[[1,2],1],false],[[[],0],false],[[[-2,null,-3],-5],true]],treeInput);
add('sum-root-to-leaf-numbers','root','每个树节点存一个 0 到 9 的数字。每条根到叶路径按顺序组成一个十进制数，返回所有路径数之和。空树返回 0，界面用层序数组展示树。',`    stack = [(root,0)] if root else []
    total = 0
    while stack:
        node, prefix = stack.pop()
        number = prefix*10 + node.val
        if not node.left and not node.right:
            total += number
        for child in (node.left,node.right):
            if child:
                stack.append((child,number))
    return total`,'遍历时用前缀数乘 10 再加节点值，抵达叶子时累计。时间 O(n)，空间 O(h)。',[[[[1,2,3]],25],[[[0,2,4]],6],[[[]],0]],treeInput);
add('binary-search-tree-iterator','root','实现 BSTIterator(root)，next() 返回中序遍历的下一个值，hasNext() 返回是否还有值。对 next 的调用保证有效。界面用层序数组和操作名列表表示一次迭代，判题依次收集方法返回值。目标为 O(h) 空间和均摊 O(1) 的 next。',`class BSTIterator:
    def __init__(self, root):
        self.stack = []
        self._push(root)

    def _push(self, node):
        while node:
            self.stack.append(node)
            node = node.left

    def next(self):
        node = self.stack.pop()
        self._push(node.right)
        return node.val

    def hasNext(self):
        return bool(self.stack)`,'栈顶保留尚未访问的最小节点，弹出后压入其右子树的左侧路径。每个节点进栈和出栈一次。',[[[[4,2,8,1,3],['next','next','hasNext','next','next','next','hasNext']],[1,2,true,3,4,8,false]],[[[],['hasNext']],[false]],[[[9],['hasNext','next','hasNext']],[true,9,false]]],{classOnly:true,signature:'BSTIterator(root) · next() · hasNext()',starter:'class BSTIterator:\n    def __init__(self, root):\n        pass\n\n    def next(self):\n        pass\n\n    def hasNext(self):\n        pass\n',driver:'def run_case(args):\n    it = BSTIterator(tree_from(args[0]))\n    return [getattr(it, op)() for op in args[1]]'});
add('count-complete-tree-nodes','root','完全二叉树除了最深一层外各层填满，最深层的节点从左向右排列。给定这样的根节点，返回节点总数，尝试少于 O(n) 的时间。空树按 0 计。',`    def left_depth(node):
        depth = 0
        while node:
            depth += 1
            node = node.left
        return depth
    count = 0
    while root:
        a, b = left_depth(root.left), left_depth(root.right)
        if a == b:
            count += 1 << a
            root = root.right
        else:
            count += 1 << b
            root = root.left
    return count`,'比较左右子树沿左链的深度，定位满子树并一次计入其节点与根，只沿另一侧继续。时间 O(log² n)，空间 O(1)。',[[[[1,2,3,4,5,6]],6],[[[]],0],[[[1,2,3,4]],4]],treeInput);
add('average-of-levels-in-binary-tree','root','返回二叉树每一层节点值的算术平均数，按从根到叶的层序排列。输入以层序数组展示，空树返回 []。',`    from collections import deque
    queue = deque([root]) if root else deque()
    ans = []
    while queue:
        width = len(queue)
        total = 0
        for _ in range(width):
            node = queue.popleft()
            total += node.val
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        ans.append(total/width)
    return ans`,'逐层汇总和及节点数。时间 O(n)，队列空间 O(最大层宽)。',[[[[1,2,5,4]], [1,3.5,4]],[[[-3]],[-3]],[[[]],[]]],treeInput);
add('binary-tree-zigzag-level-order-traversal','root','返回二叉树逐层节点值。根层从左到右，下一层从右到左，此后方向交替。空树返回 []，输入以层序数组展示。',`    level = [root] if root else []
    answer = []
    while level:
        values = [node.val for node in level]
        answer.append(values[::-1] if len(answer)%2 else values)
        level = [child for node in level for child in (node.left,node.right) if child]
    return answer`,'收集每层的自然顺序，在奇数层反转输出。时间 O(n)，辅助空间 O(最大层宽)。',[[[[1,2,3,4,null,5,6]],[[1],[3,2],[4,5,6]]],[[[4]],[[4]]],[[[]],[]]],treeInput);
add('minimum-absolute-difference-in-bst','root','给定至少含两个节点的二叉搜索树，返回任意两个不同节点值之间的最小绝对差。界面采用层序数组表示树。',`    stack = []
    previous, best = None, float('inf')
    while stack or root:
        while root:
            stack.append(root)
            root = root.left
        root = stack.pop()
        if previous is not None:
            best = min(best,root.val-previous)
        previous = root.val
        root = root.right
    return best`,'二叉搜索树的中序序列有序，最优值一定出现在相邻元素间。时间 O(n)，空间 O(h)。',[[[[4,2,9,1,3]],1],[[[0,null,8]],8],[[[10,3,20,null,9]],1]],treeInput);
add('surrounded-regions','board','board 是由 "X" 和 "O" 组成的非空矩形字符棋盘。沿上下左右相邻可连成区域。将所有与边界互不连通的 O 变为 X，原地修改棋盘。判题读取修改后的 board。',`    from collections import deque
    m, n = len(board), len(board[0])
    queue = deque()
    def keep(i,j):
        if 0 <= i < m and 0 <= j < n and board[i][j] == 'O':
            board[i][j] = '#'
            queue.append((i,j))
    for i in range(m):
        keep(i,0)
        keep(i,n-1)
    for j in range(n):
        keep(0,j)
        keep(m-1,j)
    while queue:
        i,j = queue.popleft()
        for a,b in ((i-1,j),(i+1,j),(i,j-1),(i,j+1)):
            keep(a,b)
    for row in board:
        for j, val in enumerate(row):
            row[j] = 'O' if val == '#' else 'X'`,'从边界 O 出发标记应保留区域，最后一次扫描翻转内部区域。时间和最坏队列空间 O(mn)。',[
[[['XXXX','XOOX','XXOX','XOXX'].map(s=>[...s])],['XXXX','XXXX','XXXX','XOXX'].map(s=>[...s])],
[[[['O']]], [['O']]],[[['OXO','XOX','OXO'].map(s=>[...s])],['OXO','XXX','OXO'].map(s=>[...s])]],inPlace);

add('clone-graph','node','给定连通无向图中的一个节点，每个 Node 有整数 val 和 neighbors 列表。返回整个图的深拷贝，所有节点都应是新对象，邻接关系相同。界面用按节点编号 1…n 排列的邻接表；空图传入 None。允许任意邻居顺序。',`    from collections import deque
    if node is None:
        return None
    copies = {node: Node(node.val)}
    queue = deque([node])
    while queue:
        current = queue.popleft()
        for other in current.neighbors:
            if other not in copies:
                copies[other] = Node(other.val)
                queue.append(other)
            copies[current].neighbors.append(copies[other])
    return copies[node]`,'字典将每个原节点映射到唯一副本，遍历每条边时连接对应副本。时间和包含结果的空间均为 O(V+E)。',[[[[[2,3],[1,3],[1,2]]],[[2,3],[1,3],[1,2]]],[[[[]]],[[]]],[[[]],[]]],{prelude:`class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = [] if neighbors is None else neighbors`,driver:`def run_case(args):
    adj = args[0]
    original = [Node(i+1) for i in range(len(adj))]
    for node, neighbors in zip(original,adj):
        node.neighbors = [original[v-1] for v in neighbors]
    original_set = set(original)
    original_lists = {id(node.neighbors) for node in original}
    root = solve(original[0] if original else None)
    if not original and root is not None:
        raise ValueError('空图应返回 None')
    if root is None:
        return []
    if root.val != 1:
        raise ValueError('返回图起点应与原起点对应')
    seen = set()
    by_value = {}
    stack = [root]
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        if node in original_set or node.val in by_value or id(node.neighbors) in original_lists:
            raise ValueError('请为每个原节点创建唯一的新节点')
        seen.add(node)
        by_value[node.val] = sorted(x.val for x in node.neighbors)
        stack.extend(node.neighbors)
    if set(by_value) != set(range(1, len(adj)+1)):
        raise ValueError('深拷贝应包含与原图一一对应的节点')
    return [by_value[i] for i in range(1,len(adj)+1)]`});
add('course-schedule-ii','numCourses, prerequisites','课程编号 0…numCourses−1。每对 [a,b] 表示修 a 之前须修 b。返回包含所有课程的一种合法顺序，存在有向环则返回 []。判题接受任意有效拓扑序。',`    from collections import deque
    adj = [[] for _ in range(numCourses)]
    degree = [0]*numCourses
    for a,b in prerequisites:
        adj[b].append(a)
        degree[a] += 1
    ready = deque(i for i in range(numCourses) if not degree[i])
    order = []
    while ready:
        b = ready.popleft()
        order.append(b)
        for a in adj[b]:
            degree[a] -= 1
            if degree[a] == 0:
                ready.append(a)
    return order if len(order) == numCourses else []`,'以入度为零的节点构造拓扑序，未能取完说明存在环。时间和空间 O(V+E)。',[[[4,[[1,0],[2,0],[3,1],[3,2]]],[0,1,2,3]],[[2,[[1,0],[0,1]]],[]],[[3,[]],[0,1,2]]],{driver:`def run_case(args):
    return solve(*args)

def accepts(args, actual, expected):
    n, edges = args
    if not expected:
        return isinstance(actual, (list, tuple)) and len(actual) == 0
    if not isinstance(actual,(list,tuple)) or any(type(x) is not int for x in actual) or sorted(actual) != list(range(n)):
        return False
    pos = {v:i for i,v in enumerate(actual)}
    return all(pos[b] < pos[a] for a,b in edges)`});
add('snakes-and-ladders','board','输入 n×n 棋盘（n≥2）。编号从左下角 1 开始，逐行向上且左右方向交替，终点 n²。每步可前进 1 到 6 格；若落点存有正数，立即跳到该编号，本步仅跳一次。值 −1 表示普通格。起点与终点无跳转。求到终点的最少步数，不可达返回 −1。',`    from collections import deque
    n = len(board)
    def landing(label):
        row, col = divmod(label-1,n)
        j = n-1-col if row%2 else col
        target = board[n-1-row][j]
        return label if target == -1 else target
    queue = deque([(1,0)])
    seen = {1}
    while queue:
        cell,d = queue.popleft()
        if cell == n*n:
            return d
        for step in range(cell+1,min(cell+6,n*n)+1):
            nxt = landing(step)
            if nxt not in seen:
                seen.add(nxt)
                queue.append((nxt,d+1))
    return -1`,'按蛇形编号将骰子落点转成坐标，只读取一次跳转目的地。BFS 求无权图最短路，时间和空间 O(n²)。',[[[[[-1,-1],[-1,-1]]],1],[[[[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]]],2],[[[[-1,-1,-1],[-1,-1,-1],[-1,9,-1]]],1],[[[[1,-1,-1],[1,1,1],[-1,1,1]]],-1]]);
add('minimum-genetic-mutation','startGene, endGene, bank','基因串含 8 个字符，各字符来自 A、C、G、T。每步改动一个字符，改动后的串必须出现在 bank。返回从 startGene 到 endGene 的最少步数；无法到达返回 -1，相同起终点返回 0。',`    from collections import deque
    allowed = set(bank)
    allowed.discard(startGene)
    queue = deque([(startGene,0)])
    while queue:
        gene, steps = queue.popleft()
        if gene == endGene:
            return steps
        for i in range(len(gene)):
            for base in 'ACGT':
                nxt = gene[:i]+base+gene[i+1:]
                if nxt in allowed:
                    allowed.remove(nxt)
                    queue.append((nxt,steps+1))
    return -1`,'逐层枚举一次突变可达且尚未访问的串。基因长度固定时，采用哈希集合的期望时间、空间均为 O(库大小)。',[[['AAAAAAAA','CAAAAAAT',['CAAAAAAA','CAAAAAAT']],2],[['AAAAAAAA','CCCCCCCC',[]],-1],[['ACGTACGT','ACGTACGT',[]],0]]);
add('word-ladder','beginWord, endWord, wordList','给定等长小写单词和词典。每步替换一个字母，替换后的单词须在词典内。求从 beginWord 到不同的 endWord 的最短序列包含多少个单词，首尾都计入；不可达返回 0。',`    from collections import deque
    available = set(wordList)
    if endWord not in available:
        return 0
    available.discard(beginWord)
    queue = deque([(beginWord,1)])
    while queue:
        word, length = queue.popleft()
        if word == endWord:
            return length
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                new = word[:i] + c + word[i+1:]
                if new in available:
                    available.remove(new)
                    queue.append((new,length+1))
    return 0`,'用广度优先搜索逐层替换字母。词长 L、词数 N 时，切片与哈希计入后期望时间 O(26NL²)，存储字符串占 O(NL)。',[[['hit','cog',['hot','dot','dog','lot','log','cog']],5],[['a','c',['a','b','c']],2],[['ab','ba',['ba']],0]]);
add('design-add-and-search-words-data-structure','operations','实现 WordDictionary()、addWord(word) 和 search(pattern)。加入小写单词，查询模式中的点 "." 可匹配任意一个字母；需匹配整个词。界面给出操作数组，每项为 [方法名, 参数]，构造后按序调用；addWord 的返回值展示为 null。',`class WordDictionary:
    def __init__(self):
        self.root = {}

    def addWord(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c,{})
        node['#'] = True

    def search(self, pattern):
        nodes = [self.root]
        for c in pattern:
            if c == '.':
                nodes = [child for node in nodes for k,child in node.items() if k != '#']
            else:
                nodes = [node[c] for node in nodes if c in node]
        return any('#' in node for node in nodes)`,'字典树的边对应一个字母，遇到点时展开所有孩子。插入时间 O(L)，查询时间取决于匹配到的前缀数，最坏扫描整棵树。',[[[[['addWord','cat'],['addWord','car'],['search','ca.'],['search','c.'],['search','cow']]],[null,null,true,false,false]],[[[['search','.'],['addWord','a'],['search','.']]],[false,null,true]],[[[['addWord','ab'],['search','..'],['search','ab']]],[null,true,true]]],{classOnly:true,starter:'class WordDictionary:\n    def __init__(self):\n        pass\n\n    def addWord(self, word):\n        pass\n\n    def search(self, pattern):\n        pass\n',signature:'WordDictionary() · addWord(word) · search(pattern)',driver:'def run_case(args):\n    obj = WordDictionary()\n    return [getattr(obj,name)(word) for name,word in args[0]]'});
add('word-search-ii','board, words','board 为非空小写字母矩形网格，words 为互异的非空小写单词。在网格上每步上下左右移动，同一单词的一条路径内每个格最多用一次。返回所有可拼出的词，每词一次，顺序任选。',`    root = {}
    for word in words:
        node = root
        for c in word:
            node = node.setdefault(c,{})
        node['#'] = word
    m, n = len(board), len(board[0])
    answer = []
    def visit(i,j,parent):
        c = board[i][j]
        if c not in parent:
            return
        node = parent[c]
        if '#' in node:
            answer.append(node.pop('#'))
        board[i][j] = '!'
        for a,b in ((i-1,j),(i+1,j),(i,j-1),(i,j+1)):
            if 0 <= a < m and 0 <= b < n:
                visit(a,b,node)
        board[i][j] = c
        if not node:
            del parent[c]
    for i in range(m):
        for j in range(n):
            visit(i,j,root)
    return answer`,'用字典树共享待查前缀，从每个格子回溯并剪去已找完的分支。最长词长 L 时，搜索上界 O(mn·4^L)，字典树空间与词总长度成正比。',[[[[['a','b'],['c','d']],['ab','acdb','aba','ad']],['ab','acdb']],[[[['a','a']],['a','aa','aaa']],['a','aa']],[[[['x']],['a']],[]]],sortedList);
add('combinations','n, k','从 1…n 中挑出 k 个互不相同的数，返回全部组合，每个组合恰好一次。1 ≤ k ≤ n；组合内与组合间顺序任选。',`    result = []
    picked = []
    def visit(start):
        remaining = k-len(picked)
        if remaining == 0:
            result.append(picked.copy())
            return
        for v in range(start,n-remaining+2):
            picked.append(v)
            visit(v+1)
            picked.pop()
    visit(1)
    return result`,'按递增顺序选择，并给后面的选择留足候选数。生成输出需 O(k·C(n,k)) 时间，除输出外使用 O(k) 空间。',[[[4,2],[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]],[[3,3],[[1,2,3]]],[[2,1],[[1],[2]]]],{driver:'def run_case(args):\n    return sorted(sorted(item) for item in solve(*args))'});
add('n-queens-ii','n','在 n×n 棋盘上放 n 个皇后，使任意两个皇后位于不同的行、列和对角线。统计摆法总数，旋转或镜像后位置不同算不同摆法。输入 1 ≤ n ≤ 9。',`    full = (1 << n)-1
    def count(cols, down, up):
        if cols == full:
            return 1
        choices = full & ~(cols | down | up)
        result = 0
        while choices:
            bit = choices & -choices
            choices -= bit
            result += count(cols|bit, ((down|bit)<<1)&full, (up|bit)>>1)
        return result
    return count(0,0,0)`,'每行只选一个位置，以位掩码维护列和下一行受攻击的对角线。时间上界 O(n!)，递归深度 O(n)。',[[[1],1],[[3],0],[[4],2],[[5],10]]);
const quadNode = `class Node:
    def __init__(self, val=False, isLeaf=False, topLeft=None, topRight=None, bottomLeft=None, bottomRight=None):
        self.val, self.isLeaf = val, isLeaf
        self.topLeft, self.topRight = topLeft, topRight
        self.bottomLeft, self.bottomRight = bottomLeft, bottomRight`;
add('construct-quad-tree','grid','输入 n×n 的 0/1 网格，n 是 2 的幂。用四叉树表示整个网格：区域同值时返回 isLeaf=True、val 为该值且四个子节点均为 None 的叶子，否则创建内部节点并依左上、右上、左下、右下递归划分。内部节点 val 可任取布尔值。返回 Node 根。判题以叶子值 0/1、内节点四项列表展示。',`    def build(r,c,w):
        if w == 1:
            return Node(bool(grid[r][c]),True)
        h = w//2
        children = [build(r,c,h),build(r,c+h,h),build(r+h,c,h),build(r+h,c+h,h)]
        if all(x.isLeaf and x.val == children[0].val for x in children):
            return children[0]
        return Node(False,False,*children)
    return build(0,0,len(grid))`,'自底向上合并四个相同叶子。每个子区域计算一次，时间 O(n²)，递归深度 O(log n)，结果节点至多 O(n²)。',[[[[[1,1],[1,1]]],1],[[[[0,1],[1,0]]],[0,1,1,0]],[[[[0,0,1,1],[0,0,1,1],[0,1,0,0],[1,0,0,0]]],[0,1,[0,1,1,0],0]]],{prelude:quadNode,driver:`def run_case(args):
    def encode(node, width):
        if node is None:
            raise ValueError('每个非叶节点应有四个子节点')
        children = (node.topLeft, node.topRight, node.bottomLeft, node.bottomRight)
        if node.isLeaf:
            if any(child is not None for child in children) or node.val not in (0, 1):
                raise ValueError('叶子应存储 0 或 1，且四个子节点均为 None')
            return int(node.val)
        if width <= 1:
            raise ValueError('单格区域应由叶子表示')
        return [encode(child, width // 2) for child in children]
    return encode(solve(*args), len(args[0]))`});
add('maximum-sum-circular-subarray','nums','非空整数数组首尾相连。选取一段非空连续元素，每个位置至多用一次，求最大元素和。',`    best = high = low = worst = total = nums[0]
    for i in range(1,len(nums)):
        x = nums[i]
        high, low = max(x,high+x), min(x,low+x)
        best, worst, total = max(best,high), min(worst,low), total+x
    return best if best < 0 else max(best,total-worst)`,'最优段要么是线性最大子段，要么是删去线性最小子段后的两端。全负时取最大单元素。时间 O(n)，动态规划状态 O(1)。',[[[[5,-4,5]],10],[[[-3,-1,-8]],-1],[[[0]],0]]);
add('ipo','k, w, profits, capital','初始资本为 w。项目 i 需要当前资本至少为 capital[i]，做完立刻增加非负利润 profits[i]，资本门槛不会被扣除。最多选 k 个不同项目，返回可得到的最大最终资本。',`    import heapq
    projects = sorted(zip(capital,profits))
    options = []
    i = 0
    for _ in range(min(k,len(projects))):
        while i < len(projects) and projects[i][0] <= w:
            heapq.heappush(options,-projects[i][1])
            i += 1
        if not options:
            break
        w -= heapq.heappop(options)
    return w`,'按资本要求扫描项目，用堆取当前可行的最大利润，保证下一步的可行集合最大。时间 O(n log n)，空间 O(n)。',[[[2,0,[1,2,3],[0,1,1]],4],[[4,1,[8],[2]],1],[[1,3,[4,5],[2,3]],8]]);
add('find-k-pairs-with-smallest-sums','nums1, nums2, k','两个非递减整数数组中各选一个元素组成有序数对。返回总和最小的 k 个数对；不同下标可产生相同数对。1 ≤ k ≤ 两个数组长度之积。同和数对可以任取，顺序任选。',`    import heapq
    heap = [(a+nums2[0],i,0) for i,a in enumerate(nums1[:k])]
    heapq.heapify(heap)
    result = []
    while len(result) < k:
        _,i,j = heapq.heappop(heap)
        result.append([nums1[i],nums2[j]])
        if j+1 < len(nums2):
            heapq.heappush(heap,(nums1[i]+nums2[j+1],i,j+1))
    return result`,'固定第一数组下标后得到单调序列，用堆归并前 min(k,m) 个序列。时间 O(k log(min(k,m)+1))，堆空间 O(min(k,m))。',[[[[1,2],[2,3],2],[[1,2],[1,3]]],[[[1,1],[1,2],3],[[1,1],[1,1],[1,2]]],[[[-1],[2],1],[[-1,2]]]],{driver:`def run_case(args):
    return solve(*args)

def accepts(args, actual, expected):
    from collections import Counter
    a,b,k = args
    if not isinstance(actual,(list,tuple)) or len(actual) != k or any(not isinstance(p,(list,tuple)) or len(p)!=2 or any(type(x) is not int for x in p) for p in actual):
        return False
    first, second = Counter(a), Counter(b)
    pairs = Counter(map(tuple,actual))
    return all(n <= first[x]*second[y] for (x,y),n in pairs.items()) and sorted(map(sum,actual)) == sorted(map(sum,expected))`});

add('add-binary','a, b','a、b 是非空二进制数字串，除数字零外均以 1 开头。返回它们的和，采用同样的二进制字符串格式。练习逐位处理任意长度的输入。',`    i, j, carry = len(a)-1, len(b)-1, 0
    digits = []
    while i >= 0 or j >= 0 or carry:
        if i >= 0:
            carry += int(a[i])
            i -= 1
        if j >= 0:
            carry += int(b[j])
            j -= 1
        carry, bit = divmod(carry,2)
        digits.append(str(bit))
    return ''.join(reversed(digits))`,'从最低位起加，保留进位。时间与较长输入长度成正比，输出与临时列表同阶。',[[['111','1'],'1000'],[['0','0'],'0'],[['101','11'],'1000']]);
add('reverse-bits','n','将非负整数 n 看作恰好 32 位的无符号二进制数，把 32 个位的位置全部反转，返回反转后的无符号十进制整数。输入中的前导零也占位。',`    out = 0
    for _ in range(32):
        out = (out << 1) | (n & 1)
        n >>= 1
    return out`,'每次取最低位接到结果末端，固定循环 32 次。时间和空间均为 O(1)。',[[[1],2147483648],[[0],0],[[2147483648],1],[[4294967295],4294967295]]);
add('number-of-1-bits','n','输入 32 位无符号整数 n，返回其二进制表示中为 1 的位数。',`    count = 0
    while n:
        n &= n-1
        count += 1
    return count`,'n 与 n−1 按位与会清除 n 最低的一个 1。时间 O(置位数+1)，空间 O(1)。',[[[0],0],[[11],3],[[2147483649],2],[[4294967295],32]]);
add('single-number-ii','nums','输入非空的 32 位有符号整数数组，恰有一个数出现一次，其他各数均出现三次。找出只出现一次的数。要求线性时间与常数额外空间。',`    value = 0
    for bit in range(32):
        if sum((x >> bit) & 1 for x in nums) % 3:
            value |= 1 << bit
    return value - (1 << 32) if value & (1 << 31) else value`,'对每位统计 1 的个数并对 3 取余，最后从补码还原符号。时间 O(32n)，空间 O(1)。',[[[[2,5,2,2]],5],[[[-2,-2,-9,-2]],-9],[[[0]],0]]);
add('bitwise-and-of-numbers-range','left, right','给定 0 ≤ left ≤ right ≤ 2³¹−1。将闭区间 [left,right] 内的全部整数按位与，返回结果。',`    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift`,'端点的公共高位前缀在整个区间内恒定。首次不同的位置及其低位在区间中均出现过 0。时间 O(位数)，空间 O(1)。',[[[5,7],4],[[0,2147483647],0],[[9,9],9]]);
add('palindrome-number','x','判断有符号整数 x 的十进制写法是否从两端读一致。负数返回 False。尝试使用整数运算完成判断。',`    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    reversed_half = 0
    while x > reversed_half:
        x, digit = divmod(x,10)
        reversed_half = reversed_half*10 + digit
    return x == reversed_half or x == reversed_half//10`,'反转后一半数字，奇数位数时去掉中间位再比较。时间 O(位数)，空间 O(1)。',[[[1221],true],[[12321],true],[[10],false],[[-121],false],[[0],true]]);
add('plus-one','digits','digits 从高到低存放一个非负十进制整数的各位，除 0 本身外无前导零。将该数加一并返回结果的各位数组，输入可超过系统整型范围。',`    for i in range(len(digits)-1,-1,-1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1]+digits`,'从右向左处理连续的 9，在首个可直接加一的位置结束。时间 O(n)，算术状态 O(1)。',[[[[9,9]],[1,0,0]],[[[1,2,9]],[1,3,0]],[[[0]],[1]]]);
add('factorial-trailing-zeroes','n','对非负整数 n，返回 n! 的十进制表示末尾连续零的个数。0! 定义为 1，尝试直接统计质因子。',`    total = 0
    while n:
        n //= 5
        total += n
    return total`,'每个 10 消耗一个 2 和一个 5，5 的数量更少。逐次整除 5，累计 5、25、125 等倍数贡献。时间 O(log₅(n+1))，空间 O(1)。',[[[0],0],[[10],2],[[25],6],[[125],31]]);
add('sqrtx','x','输入非负整数 x，返回其平方根向下取整后的非负整数。用整数比较实现。',`    lo,hi = 0,x+1
    while lo+1 < hi:
        mid = (lo+hi)//2
        if mid*mid <= x:
            lo = mid
        else:
            hi = mid
    return lo`,'维护 lo² ≤ x < hi²，二分至两端相邻。时间 O(log(x+1))，空间 O(1)。',[[[0],0],[[8],2],[[16],4],[[2147395599],46339]]);
add('powx-n','x, n','给定浮点数 x 和 32 位有符号整数 n，计算 x 的 n 次幂。n 为负时 x 非零；n 为零时返回 1。浮点结果按误差比较。',`    if n < 0:
        x, n = 1/x, -n
    value = 1.0
    while n:
        if n & 1:
            value *= x
        x *= x
        n >>= 1
    return value`,'指数的每个二进制位对应一个连续平方得到的因子，仅乘入置位处的因子。时间 O(log(|n|+1))，空间 O(1)。',[[[2,-3],0.125],[[-3,3],-27],[[0,0],1],[[1.5,2],2.25]]);
add('max-points-on-a-line','points','给定互异的整数二维点 [x,y] 列表，至少含一个点。返回同一条直线上最多可包含的点数，竖直线也在内。',`    from math import gcd
    best = 1
    for i,(x,y) in enumerate(points):
        counts = {}
        for j in range(i+1,len(points)):
            a,b = points[j]
            dx,dy = a-x,b-y
            divisor = gcd(dx,dy)
            dx,dy = dx//divisor,dy//divisor
            if dx < 0 or (dx == 0 and dy < 0):
                dx,dy = -dx,-dy
            key = dx,dy
            counts[key] = counts.get(key,0)+1
            best = max(best,counts[key]+1)
    return best`,'枚举直线上的最早输入点，把其余点的方向向量约成同号规范形式，避免浮点斜率误差。按机器整数运算计 O(n²) 时间、O(n) 空间。',[[[[[0,0],[-1,-1],[2,2],[3,1]]],3],[[[[2,1],[2,-1],[2,8],[3,8]]],3],[[[[1,1]]],1]]);
add('triangle','triangle','triangle 的第 i 行含 i+1 个整数（i 从 0 开始）。从顶点开始，每层可选下一行相同列或右侧相邻列。求到最后一行的最小路径和，至少有一行。',`    dp = triangle[-1].copy()
    for row in reversed(triangle[:-1]):
        for j,x in enumerate(row):
            dp[j] = x + min(dp[j],dp[j+1])
    return dp[0]`,'自底向上保存每个位置到末行的最优值，从左向右覆盖同一个数组。共 N 个数时耗时 O(N)，空间 O(行数)。',[[[[[1],[2,3],[8,-1,4]]],2],[[[[-7]]],-7],[[[[3],[1,1]]],4]]);
add('unique-paths-ii','obstacleGrid','非空矩形网格中 0 可通行，1 是障碍。每步只可向右或向下，从左上角到右下角共有几条不同路径？起点或终点为障碍时返回 0。',`    dp = [0]*len(obstacleGrid[0])
    dp[0] = 1
    for row in obstacleGrid:
        for j,blocked in enumerate(row):
            if blocked:
                dp[j] = 0
            elif j:
                dp[j] += dp[j-1]
    return dp[-1]`,'一维数组保存来自上方的路径数，再加上当前行左方的数量；障碍处清零。时间 O(mn)，空间 O(n)。',[[[[[0,0,0],[0,1,0],[0,0,0]]],2],[[[[1]]],0],[[[[0],[1],[0]]],0],[[[[0]]],1]]);
add('interleaving-string','s1, s2, s3','判断能否交替取用 s1、s2 中的字符组成 s3。每个原串内的相对顺序必须保留，两个原串的全部字符都要用到。允许连续多步取自同一个原串。',`    if len(s1)+len(s2) != len(s3):
        return False
    dp = [False]*(len(s2)+1)
    dp[0] = True
    for i in range(len(s1)+1):
        for j in range(len(s2)+1):
            if i+j:
                last = s3[i+j-1]
                dp[j] = bool((i and dp[j] and s1[i-1]==last) or (j and dp[j-1] and s2[j-1]==last))
    return dp[-1]`,'状态表示两个前缀能否组成目标前缀，最后一个字符来自任一匹配的前驱。时间 O((m+1)(n+1))，空间 O(n)。',[[['ab','cd','acbd'],true],[['ab','cd','adbc'],false],[['','',''],true],[['a','a','a'],false]]);
add('best-time-to-buy-and-sell-stock-iii','prices','给定按日排列的非负股价，至多完成两笔买入后卖出的交易，同一时刻最多持有一股。返回可得到的最大总利润，可以选择零笔交易。',`    buy1 = buy2 = float('-inf')
    sell1 = sell2 = 0
    for p in prices:
        buy1 = max(buy1,-p)
        sell1 = max(sell1,buy1+p)
        buy2 = max(buy2,sell1-p)
        sell2 = max(sell2,buy2+p)
    return sell2`,'四个状态依次记录第一次持股、第一次卖出、第二次持股和第二次卖出的最优净收益。时间 O(n)，空间 O(1)。',[[[[1,5,2,8]],10],[[[7,5,2]],0],[[[3,3,5,0,0,3,1,4]],6]]);
add('best-time-to-buy-and-sell-stock-iv','k, prices','给定非负整数 k 和每日非负股价 prices，依次买卖同一只股票，至多完成 k 次买入后卖出的交易，同时最多持有一股。返回最大利润。',`    if k >= len(prices)//2:
        return sum(max(0,prices[i]-prices[i-1]) for i in range(1,len(prices)))
    buy = [float('-inf')]*(k+1)
    sell = [0]*(k+1)
    for price in prices:
        for t in range(1,k+1):
            buy[t] = max(buy[t],sell[t-1]-price)
            sell[t] = max(sell[t],buy[t]+price)
    return sell[k]`,'按交易次数保存持股和空仓两种最优收益，时间 O(nk)、空间 O(k)。次数足够时直接累计所有日间上涨，线性时间完成。',[[[1,[2,6,1,7]],6],[[2,[2,6,1,7]],10],[[0,[1,8]],0],[[9,[3,1,3,5,2]],4]]);
add('maximal-square','matrix','输入非空矩形字符矩阵，元素为 "0" 或 "1"。求所有元素均为 "1" 的最大轴对齐正方形的面积；全零时返回 0。',`    dp = [0]*(len(matrix[0])+1)
    best = 0
    for row in matrix:
        diagonal = 0
        for j,ch in enumerate(row,1):
            up = dp[j]
            dp[j] = 1+min(up,dp[j-1],diagonal) if ch == '1' else 0
            best = max(best,dp[j])
            diagonal = up
    return best*best`,'以当前位置作右下角，正方形边长取上、左、左上三个值中最小值加一。保留旧值作为下格的左上角。时间 O(mn)，空间 O(n)。',[[[['111','111','101'].map(s=>[...s])],4],[[[['0']]],0],[[['111','111','111'].map(s=>[...s])],9]]);
module.exports = pack;
