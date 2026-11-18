const { q } = require('../catalog-kit.cjs');

const ordered = { driver: `def run_case(args):
    return sorted(solve(*args))` };
const orderedGroups = { driver: `def run_case(args):
    return sorted(sorted(group) for group in solve(*args))` };
const mutateFirst = { driver: `def run_case(args):
    solve(*args)
    return args[0]` };
const stateful = (name, starter) => ({
  signature: name, starter,
  driver: `def run_case(args):
    operations, parameters = args
    instance = ${name}(*parameters[0])
    results = [None]
    for op, values in zip(operations[1:], parameters[1:]):
        results.append(getattr(instance, op)(*values))
    return results`,
});
const treeInput = { driver: `def run_case(args):
    return solve(tree_from(args[0]))` };
const listInput = { driver: `def run_case(args):
    return list_values(solve(list_from(args[0]), *args[1:]))` };
const twoLists = { driver: `def run_case(args):
    return list_values(solve(list_from(args[0]), list_from(args[1])))` };

module.exports = [
q('lc-letter-combinations-of-a-phone-number','digits',
'输入由 2～9 组成的字符串 digits。按电话键盘 2:abc、3:def、4:ghi、5:jkl、6:mno、7:pqrs、8:tuv、9:wxyz，每位选一个字母，返回全部拼写，顺序任意。空串返回空列表。',
`def solve(digits):
    if not digits:
        return []
    keys = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    words = [""]
    for digit in digits:
        words = [prefix + ch for prefix in words for ch in keys[int(digit) - 2]]
    return words`,
'逐位扩展已有前缀。设最终有 P 种拼写、输入长 n，生成字符串耗时 O(nP)，含返回结果的空间为 O(nP)。',
[[[''],[]],[['7'],['p','q','r','s']],[['28'],['at','au','av','bt','bu','bv','ct','cu','cv']]],ordered),
q('lc-combination-sum-iii','k, n',
'从 1 到 9 中选出恰好 k 个不同整数，使它们的和为 n。返回所有组合；同一组选数只出现一次，组合与组内元素的顺序均可任意。',
`def solve(k, n):
    result = []
    def visit(first, left, path):
        if len(path) == k:
            if left == 0:
                result.append(path[:])
            return
        for value in range(first, min(left, 9) + 1):
            path.append(value)
            visit(value + 1, left - value, path)
            path.pop()
    visit(1, n, [])
    return result`,
'递增选数，每次递归只考虑更大的整数；选够 k 个时检查总和。最多访问 2⁹ 个子集，含复制答案的时间 O(k·2⁹)，额外栈空间 O(k)。',
[[[3,8],[[1,2,5],[1,3,4]]],[[2,2],[]],[[9,45],[[1,2,3,4,5,6,7,8,9]]]],orderedGroups),
q('lc-n-th-tribonacci-number','n','定义 T₀=0，T₁=T₂=1。后续每一项是前三项之和。给定 0≤n≤37，返回整数 Tₙ。',
`def solve(n):
    a, b, c = 0, 1, 1
    for _ in range(n):
        a, b, c = b, c, a + b + c
    return a`,
'变量 a、b、c 始终存储连续三项，向前平移 n 次。时间 O(n)，空间 O(1)。',[[[0],0],[[2],1],[[6],13],[[10],149]]),
q('lc-min-cost-climbing-stairs','cost','非负数组 cost 至少有两项。在下标 i 的台阶支付 cost[i] 后可向上走一阶或两阶。起点可选 0 或 1，终点在最后一阶之上，返回抵达终点的最少开销。',
`def solve(cost):
    prev, curr = 0, 0
    for i in range(2, len(cost) + 1):
        prev, curr = curr, min(prev + cost[i - 2], curr + cost[i - 1])
    return curr`,
'到达第 i 阶的最小费用来自前一阶或前两阶，加上出发台阶的费用。时间 O(n)，空间 O(1)。',[[[[1,9]],1],[[[4,3,2,7]],5],[[[0,10,0,10,0]],0]]),
q('lc-house-robber','nums','nums[i] 表示一排房屋第 i 间的非负金额，可选择任意一组互不相邻的房屋。返回可取得的最大金额。',
`def solve(nums):
    two_back = one_back = 0
    for value in nums:
        two_back, one_back = one_back, max(one_back, two_back + value)
    return one_back`,
'面对当前房屋时，比较跳过它的结果与选择它并加上前两间之前的最优值。时间 O(n)，额外空间 O(1)。',[[[[5]],5],[[[5,1,1,5]],10],[[[4,7,1,4,8]],15]]),
q('lc-domino-and-tromino-tiling','n','给定宽 n、高 2 的棋盘，1≤n≤1000。骨牌覆盖相邻的两格，L 形三格板覆盖 2×2 方块中的三格，两种板都能旋转。返回恰好铺满棋盘的方法数模 1000000007。板所覆盖的格子集合不同，即视为不同铺法。',
`def solve(n):
    if n <= 2:
        return n
    a, b, c = 1, 1, 2
    for _ in range(3, n + 1):
        a, b, c = b, c, (2 * c + a) % 1_000_000_007
    return c`,
'设 f(n) 是完整铺法数，g(n) 是末列固定缺一个角的铺法数。按末端形状分类，f(n)=f(n−1)+f(n−2)+2g(n−1)，g(n)=g(n−1)+f(n−2)。消去 g 得 f(n)=2f(n−1)+f(n−3)，初值 f(0..2)=1,1,2。时间 O(n)，空间 O(1)。',[[[1],1],[[2],2],[[4],11],[[7],117],[[40],833773577]]),
q('lc-unique-paths','m, n','在 m 行 n 列的网格中从左上角走到右下角，每步向右或向下移动一格。m 和 n 均为正数，返回不同移动序列的数量。',
`from math import comb

def solve(m, n):
    return comb(m + n - 2, m - 1)`,
'每条路径包含 m−1 步向下与 n−1 步向右，选择向下步的出现位置即唯一确定路径。按乘除法计算组合数需 O(min(m,n)) 次算术运算。',[[[1,5],1],[[3,3],6],[[4,5],35]]),
q('lc-longest-common-subsequence','text1, text2','两个字符串中，保留字符的相对顺序并允许跳过字符，可以得到子序列。返回两者公共子序列的最大长度。',
`def solve(text1, text2):
    if len(text2) > len(text1):
        text1, text2 = text2, text1
    row = [0] * (len(text2) + 1)
    for a in text1:
        diagonal = 0
        for j, b in enumerate(text2, 1):
            previous = row[j]
            if a == b:
                row[j] = diagonal + 1
            else:
                row[j] = max(row[j], row[j - 1])
            diagonal = previous
    return row[-1]`,
'前缀末字符相同时，从左上方接上该字符；不同时，比较分别跳过一个末字符的结果。滚动数组将空间降至 O(min(m,n))，时间 O(mn)。',[[['abc','cab'],2],[['xxx','yyy'],0],[['aabca','abaca'],4]]),
q('lc-best-time-to-buy-and-sell-stock-with-transaction-fee','prices, fee','prices 为逐日股价的非空数组，每次卖出收取非负手续费 fee。可多次交易，同时最多持有一股，买入后才能卖出。返回全部交易的最大净收益。',
`def solve(prices, fee):
    cash, hold = 0, -prices[0]
    for i in range(1, len(prices)):
        price = prices[i]
        cash, hold = max(cash, hold + price - fee), max(hold, cash - price)
    return cash`,
'cash 和 hold 分别记录当日结束时空仓、持仓的最大净收益。每次卖出扣一次手续费。时间 O(n)，额外空间 O(1)。',
[[[[5],3],0],[[[1,5,2,8],2],6],[[[8,6,4,2],0],0]]),
q('lc-edit-distance','word1, word2','把 word1 变成 word2，每次可插入、删除或替换一个字符，三种操作的代价均为 1。字符串可以为空，返回最少操作次数。',
`def solve(word1, word2):
    row = list(range(len(word2) + 1))
    for i, a in enumerate(word1, 1):
        diag, row[0] = row[0], i
        for j, b in enumerate(word2, 1):
            top = row[j]
            row[j] = min(top + 1, row[j - 1] + 1, diag + int(a != b))
            diag = top
    return row[-1]`,
'用两个前缀的最少操作数作状态。上、左、左上三个位置分别对应删除、插入、匹配或替换。时间 O(mn)，空间 O(n)，n 为 word2 的长度。',
[[['','be'],2],[['kit','sit'],1],[['flaw','lawn'],2],[['ab','ba'],2]]),
q('lc-counting-bits','n','给定非负整数 n，返回长度 n+1 的列表，其中第 i 项等于 i 的二进制表示中 1 的数量。',
`def solve(n):
    counts = [0] * (n + 1)
    for i in range(1, n + 1):
        counts[i] = counts[i >> 1] + (i & 1)
    return counts`,
'去掉最低位得到已计算过的较小整数，再加上最低位的值。时间 O(n)，返回数组之外的空间 O(1)。',[[[0],[0]],[[3],[0,1,1,2]],[[8],[0,1,1,2,1,2,2,3,1]]]),
q('lc-single-number','nums','非空整数数组中有一个数出现一次，其余每个数都出现两次。以线性时间和常数额外空间返回单独出现的数。',
`def solve(nums):
    answer = 0
    for value in nums:
        answer ^= value
    return answer`,
'异或满足交换律、结合律，相同数的异或为零。扫描一遍即可抵消所有数对。时间 O(n)，空间 O(1)。',[[[[-7]],-7],[[[0,-2,0,4,4]],-2],[[[1,1,0]],0]]),
q('lc-minimum-flips-to-make-a-or-b-equal-to-c','a, b, c','给定三个非负整数。每次可选择 a 或 b 的一个二进制位翻转。返回让 a 的按位或 b 等于 c 所需的最少翻转次数。',
`def solve(a, b, c):
    wrong = (a | b) ^ c
    both_set = a & b & ~c
    return wrong.bit_count() + both_set.bit_count()`,
'每个错误位至少需翻一次。若目标位为零且两输入此位均为一，则要再翻一次。时间 O(w)，w 为最大位宽，结果仅需常数个大整数。',[[[3,3,1],2],[[0,0,7],3],[[5,2,7],0]]),
q('lc-implement-trie-prefix-tree','',
'实现 Trie 类，insert(word) 插入单词并返回 None，search(word) 判断整词存在，startsWith(prefix) 判断是否存在以该前缀开头的单词。输入均为非空小写字母串；重复插入允许。样例依次列出方法名、方法参数和每次调用结果。',
`class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["#"] = True

    def _find(self, text):
        node = self.root
        for ch in text:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def search(self, word):
        node = self._find(word)
        return node is not None and "#" in node

    def startsWith(self, prefix):
        return self._find(prefix) is not None`,
'每条边对应一个字符，终止标记区分完整单词与已有前缀。各操作期望耗时 O(L)，存储空间与不同前缀数成正比。',
[[[['Trie','insert','startsWith','search','insert','search'],[[],['cat'],['ca'],['ca'],['ca'],['ca']]],[null,null,true,false,null,true]],[[['Trie','search','insert','insert','startsWith'],[[],['x'],['x'],['x'],['y']]],[null,false,null,null,false]]],
stateful('Trie',`class Trie:
    def __init__(self):
        pass

    def insert(self, word):
        raise NotImplementedError

    def search(self, word):
        raise NotImplementedError

    def startsWith(self, prefix):
        raise NotImplementedError`)),
q('lc-search-suggestions-system','products, searchWord','products 是由不同小写字母串组成的商品名称列表。逐字符输入 searchWord，每输入一个字符，列出以当前前缀开头的至多三个商品，按字典序排列。返回各次输入得到的列表。',
`from bisect import bisect_left

def solve(products, searchWord):
    names = sorted(products)
    result = []
    prefix = ""
    for ch in searchWord:
        prefix += ch
        start = bisect_left(names, prefix)
        result.append([s for s in names[start:start + 3] if s.startswith(prefix)])
    return result`,
'同一前缀的名称在排序后连续出现，二分查找其起点，再检查随后三个名称。若名称和搜索词长均至多 L，商品数为 n，搜索词长为 m，则时间 O(nL log n + mL log(n+1))，排序辅助空间 O(n)。',
[[[['bag','bat','ban','ball','book'],'baz'],[['bag','ball','ban'],['bag','ball','ban'],[]]],[[['a','ab'],'ab'],[['a','ab'],['ab']]],[[['cup'],'ox'],[[],[]]]]),
q('lc-non-overlapping-intervals','intervals','每个区间用 [start,end] 表示，start<end。允许一个区间的右端点等于下一个的左端点。返回为了让所有剩余区间互不重叠，最少要删去多少个区间。',
`def solve(intervals):
    end = float("-inf")
    kept = 0
    for start, finish in sorted(intervals, key=lambda p: p[1]):
        if start >= end:
            end = finish
            kept += 1
    return len(intervals) - kept`,
'每次保留结束最早且与已选区间相容的一项。把其他可行选择换成它，为后续留下的空间至少相同。时间 O(n log n)，排序空间 O(n)。',
[[[[[1,3],[3,4],[2,3]]],1],[[[[0,2],[0,2],[0,2]]],2],[[[[-3,-2],[-2,0]]],0]]),
q('lc-minimum-number-of-arrows-to-burst-balloons','points','每个气球覆盖水平轴上的闭区间 [a,b]。在某个横坐标射一支箭，会击破所有包含该坐标的气球。返回击破全部气球需要的最少箭数。',
`def solve(points):
    arrows = 0
    last = float("-inf")
    for start, end in sorted(points, key=lambda p: p[1]):
        if start > last:
            arrows += 1
            last = end
    return arrows`,
'在尚未击破且右端点最靠左的气球的右端点射箭；这个位置还能覆盖与它共享该点的后续气球。时间 O(n log n)，排序空间 O(n)。',
[[[[[0,2],[2,4]]],1],[[[[-3,-1],[0,1],[2,3]]],3],[[[[1,9],[2,4],[5,8]]],2]]),
q('lc-daily-temperatures','temperatures','给定每日温度列表，返回等长整数列表。位置 i 的值是直到后续第一次严格升温的等待天数；若直到结束都没有升温，该位记 0。',
`def solve(temperatures):
    result = [0] * len(temperatures)
    waiting = []
    for i, temp in enumerate(temperatures):
        while waiting and temperatures[waiting[-1]] < temp:
            j = waiting.pop()
            result[j] = i - j
        waiting.append(i)
    return result`,
'栈内存放尚未找到更高温度的日期，新温度只弹出严格更低的日期。每个下标入栈、出栈各至多一次，时间 O(n)，空间 O(n)。',
[[[[40,40,41]],[2,1,0]],[[[60,50,40]],[0,0,0]],[[[30,32,31,35]],[1,2,1,0]]]),
q('lc-online-stock-span','',
'实现 StockSpanner。构造函数无参数；每次 next(price) 新增一天并返回以当天结束、所有价格均小于等于当天价格的最长连续天数，包含当天。相等价格也计入。样例依次给出方法名、对应参数和各次返回值。',
`class StockSpanner:
    def __init__(self):
        self.stack = []

    def next(self, price):
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span`,
'用严格递减的栈存放价格及其代表的连续天数。比当天便宜或相等的栈顶区段可以整体并入。每次调用均摊 O(1)，n 天占用 O(n) 空间。',
[[[['StockSpanner','next','next','next','next'],[[],[6],[4],[4],[6]]],[null,1,1,2,4]],[[['StockSpanner','next','next','next'],[[],[2],[3],[1]]],[null,1,2,1]]],
stateful('StockSpanner',`class StockSpanner:
    def __init__(self):
        pass

    def next(self, price):
        raise NotImplementedError`)),
q('lc-two-sum','nums, target','整数数组 nums 中恰有一对不同下标，其对应的两个值相加为 target。返回这两个从 0 起算的下标，前后顺序任意。',
`def solve(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        other = target - value
        if other in seen:
            return [seen[other], i]
        seen[value] = i`,
'扫描到一个数时先在此前的下标中查找互补值，再记录当前数，便可处理两个值相等的情况。期望时间 O(n)，空间 O(n)。',
[[[[6,1,5],11],[0,2]],[[[4,4],8],[0,1]],[[[-1,5,2,-3],2],[1,3]]],ordered),
q('lc-group-anagrams','strs','把由小写字母组成的字符串按字母出现次数分组。同组可以通过重排字符互相得到。返回分组后的列表，组内、组间的顺序均任意，重复出现的输入需要保留相同次数。',
`from collections import defaultdict

def solve(strs):
    groups = defaultdict(list)
    for word in strs:
        counts = [0] * 26
        for char in word:
            counts[ord(char) - ord("a")] += 1
        groups[tuple(counts)].append(word)
    return list(groups.values())`,
'相同的 26 维计数向量恰好代表同一类异位词。设总字符数 S、单词数 n，时间 O(S+26n)，含分组索引的空间 O(26n)。',
[[[['tea','dog','ate','tea']],[['ate','tea','tea'],['dog']]],[[['','','a']],[['',''],['a']]],[[['ab','ba','aab','baa']],[['aab','baa'],['ab','ba']]]],orderedGroups),
q('lc-longest-consecutive-sequence','nums','给定无序整数数组，求由连续整数构成的最长序列长度。数在原数组中的位置可以任意，重复数对长度只贡献一次。请设计期望 O(n) 时间的解法，空数组返回 0。',
`def solve(nums):
    values = set(nums)
    best = 0
    for start in values:
        if start - 1 not in values:
            end = start
            while end + 1 in values:
                end += 1
            best = max(best, end - start + 1)
    return best`,
'只从没有前驱的数出发向后延伸，每个连续段恰好遍历一次。期望时间 O(n)，空间 O(n)。',
[[[[]],0],[[[5,1,4,3,5]],3],[[[1,0,-1,1,3,2]],5]]),
q('lc-3sum','nums','从整数数组中选三个不同下标，使其值之和为零。返回所有不同的三元组，按值去重。三元组与组内元素的输出顺序均任意。',
`def solve(nums):
    nums = sorted(nums)
    answer = []
    for i, a in enumerate(nums):
        if a > 0:
            break
        if i and a == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = a + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                b, c = nums[left], nums[right]
                answer.append([a, b, c])
                while left < right and nums[left] == b:
                    left += 1
                while left < right and nums[right] == c:
                    right -= 1
    return answer`,
'排序后固定最左值，用双指针找剩余两值。记录答案后跳过相同取值，使每个三元组仅出现一次。时间 O(n²)，排序副本空间 O(n)，另加输出。',
[[[[-3,1,2,0,-1,1]],[[-3,1,2],[-1,0,1]]],[[[0,0,0,0]],[[0,0,0]]],[[[2,2,3]],[]]],orderedGroups),
q('lc-trapping-rain-water','height','非负整数数组 height 表示相邻、宽度为 1 的柱子高度。雨水会从两端流出，返回最终留在柱子之间的水量。',
`def solve(height):
    left, right = 0, len(height) - 1
    left_peak = right_peak = total = 0
    while left <= right:
        if left_peak <= right_peak:
            left_peak = max(left_peak, height[left])
            total += left_peak - height[left]
            left += 1
        else:
            right_peak = max(right_peak, height[right])
            total += right_peak - height[right]
            right -= 1
    return total`,
'两端维护已扫区域的最高墙。较低最高墙一侧可结算当前位置，另一侧已有同样高或更高的挡板。每列处理一次，时间 O(n)，空间 O(1)。',
[[[[2,0,2]],2],[[[1,2,3,4]],0],[[[4,1,3,0,2,4]],10]]),
q('lc-longest-substring-without-repeating-characters','s','给定字符串 s，求一个连续子串的最大长度，要求其中每个字符只出现一次。字符可能包含数字、空格或标点，空串结果为 0。',
`def solve(s):
    left = best = 0
    last = {}
    for right, ch in enumerate(s):
        left = max(left, last.get(ch, -1) + 1)
        best = max(best, right - left + 1)
        last[ch] = right
    return best`,
'维护最长的无重复后缀。发现当前字符此前在窗口内出现时，从它的上次位置之后开始。时间 O(n)，空间 O(不同字符数)。',
[[[''],0],[['abba'],2],[[' a! a'],3],[['ddabcde'],5]]),
q('lc-find-all-anagrams-in-a-string','s, p','s、p 均由小写字母组成，p 非空。返回 s 中所有连续长度等于 len(p)、且字母频数逐一等于 p 的子串起始下标，从 0 开始计数，结果顺序任意。',
`def solve(s, p):
    target = [0] * 26
    current = [0] * 26
    index = lambda c: ord(c) - ord("a")
    for ch in p:
        target[index(ch)] += 1
    result = []
    for i, ch in enumerate(s):
        current[index(ch)] += 1
        if i >= len(p):
            current[index(s[i - len(p)])] -= 1
        if i + 1 >= len(p) and current == target:
            result.append(i + 1 - len(p))
    return result`,
'维护长度为 |p| 窗口的 26 项计数，并与目标比较。时间 O(26|s|+|p|)，额外空间 O(26)，另加输出。',
[[['abab','ab'],[0,1,2]],[['xx','xxx'],[]],[['baacab','abc'],[3]]],ordered),
q('lc-subarray-sum-equals-k','nums, k','整数数组中允许负数和零。返回和恰好等于整数 k 的非空连续子数组数，按起止下标区分。',
`def solve(nums, k):
    counts = {0: 1}
    prefix = total = 0
    for value in nums:
        prefix += value
        total += counts.get(prefix - k, 0)
        counts[prefix] = counts.get(prefix, 0) + 1
    return total`,
'两个前缀和之差是区间和。统计此前等于当前前缀和减 k 的前缀数，查询后再记入当前前缀，排除空区间。期望时间 O(n)，空间 O(n)。',
[[[[0,0,0],0],6],[[[2,-1,1,2],2],4],[[[-2,1],3],0]]),
q('lc-sliding-window-maximum','nums, k','对长度 n 的整数数组 nums，依次滑动长度 k 的窗口，每次右移一格（1≤k≤n）。按窗口从左到右的顺序返回每个窗口的最大值。',
`from collections import deque

def solve(nums, k):
    queue = deque()
    out = []
    for i, value in enumerate(nums):
        while queue and queue[0] <= i - k:
            queue.popleft()
        while queue and nums[queue[-1]] <= value:
            queue.pop()
        queue.append(i)
        if i >= k - 1:
            out.append(nums[queue[0]])
    return out`,
'队列保存值单调递减的候选下标。删除过期队首和被新值支配的队尾，队首即最大值。时间 O(n)，额外空间 O(k)。',
[[[[5,3,3,2,4],3],[5,3,4]],[[[-2,-5],1],[-2,-5]],[[[2,8,1],3],[8]]]),
q('lc-minimum-window-substring','s, t','s、t 为非空英文字母串，区分大小写。返回 s 中最短的连续片段，使片段中每种字母的数量至少达到 t 中的数量。无解返回空串，有解时最短答案唯一。',
`from collections import Counter

def solve(s, t):
    need = Counter(t)
    missing = len(t)
    left, best_start, best_size = 0, 0, len(s) + 1
    for right, char in enumerate(s):
        if need[char] > 0:
            missing -= 1
        need[char] -= 1
        while missing == 0:
            size = right - left + 1
            if size < best_size:
                best_start, best_size = left, size
            first = s[left]
            left += 1
            need[first] += 1
            if need[first] > 0:
                missing += 1
    return "" if best_size > len(s) else s[best_start:best_start + best_size]`,
'need 保存窗口距离各字符目标还差多少次，missing 统计缺少字符总数。右端扩张至覆盖后持续收缩左端。两端各前进 O(n) 次，时间 O(|s|+|t|)，额外空间与字符集大小成正比。',
[[['bcabcaab','aab'],'aab'],[['aaa','aaaa'],''],[['zAb','A'],'A']]),
q('lc-maximum-subarray','nums','给定非空整数数组，返回其中和最大的非空连续子数组的和。全为负数时也必须选择至少一个数。',
`def solve(nums):
    ending = best = nums[0]
    for i in range(1, len(nums)):
        ending = max(nums[i], ending + nums[i])
        best = max(best, ending)
    return best`,
'以当前元素结尾的最佳区间，要么从当前元素开始，要么接在前一个最佳后缀之后。记录扫描过程的最大值。时间 O(n)，空间 O(1)。',
[[[[-4,-2,-8]],-2],[[[2,-1,4,-7,3]],5],[[[8]],8]]),
q('lc-merge-intervals','intervals','输入若干闭区间 [start,end]，满足 start≤end。把有公共点的区间合并，返回覆盖相同点集的互不相交区间。端点相接也要合并，输出区间顺序任意。每个结果区间内部按起点、终点排列。',
`def solve(intervals):
    merged = []
    for a, b in sorted(intervals):
        if merged and a <= merged[-1][1]:
            merged[-1][1] = max(b, merged[-1][1])
        else:
            merged.append([a, b])
    return merged`,
'按左端点排序后，当前区间只可能与最后一个已并区间发生新重叠。时间 O(n log n)，排序及结果使用 O(n) 空间。',
[[[[[2,6],[0,2],[9,10]]],[[0,6],[9,10]]],[[[[1,8],[3,4],[8,8]]],[[1,8]]],[[[[-3,-2],[0,1]]],[[-3,-2],[0,1]]]],ordered),
q('lc-rotate-array','nums, k','原地修改非空整数列表 nums，把所有元素向右循环移动非负整数 k 个位置。测试读取调用后的 nums，函数可返回 None。请尝试仅用常数额外空间。',
`def solve(nums, k):
    def reverse(left, right):
        while left < right:
            nums[left], nums[right] = nums[right], nums[left]
            left += 1
            right -= 1
    n = len(nums)
    k %= n
    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)`,
'右移后原后缀来到前面。先整体反转，再分别反转前 k 项与剩余项，即可恢复两段内部顺序。时间 O(n)，空间 O(1)。',
[[[[1,2,3,4],1],[4,1,2,3]],[[[5,6,7],5],[6,7,5]],[[[2],0],[2]]],mutateFirst),
q('lc-first-missing-positive','nums','输入一个整数数组。求最小的、未出现在数组中的正整数。允许调整 nums 的元素顺序；请使用线性时间与常数额外空间。',
`def solve(nums):
    n = len(nums)
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]
    for i, value in enumerate(nums):
        if value != i + 1:
            return i + 1
    return n + 1`,
'有效值 x 应在位置 x−1。每次交换至少放对一个值，并借助目标位置相等的判断处理重复。第一次错位的位置给出最小缺失值。时间 O(n)，空间 O(1)。',
[[[[2,1,0]],3],[[[2,2,1,4]],3],[[[-1,0,5]],1]]),
q('lc-set-matrix-zeroes','matrix','原地修改非空矩形整数矩阵。若原始位置 (i,j) 的值为零，令第 i 行和第 j 列在最终矩阵中全为零。测试读取修改后的矩阵，函数可返回 None。请尝试常数额外空间。',
`def solve(matrix):
    m, n = len(matrix), len(matrix[0])
    first_row = any(x == 0 for x in matrix[0])
    first_col = any(row[0] == 0 for row in matrix)
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][j] == 0:
                matrix[i][0] = matrix[0][j] = 0
    for i in range(1, m):
        for j in range(1, n):
            if matrix[i][0] == 0 or matrix[0][j] == 0:
                matrix[i][j] = 0
    if first_row:
        for j in range(n):
            matrix[0][j] = 0
    if first_col:
        for i in range(m):
            matrix[i][0] = 0`,
'把第一行和第一列作为其他行列的标记，另外记住首行、首列原本是否包含零。先改内部，再处理标记本身。时间 O(mn)，额外空间 O(1)。',
[[[[[1,2,3],[4,0,6],[7,8,9]]],[[1,0,3],[0,0,0],[7,0,9]]],[[[[1,0],[3,4]]],[[0,0],[3,0]]],[[[[0],[2]]],[[0],[0]]]],mutateFirst),
q('lc-spiral-matrix','matrix','给定非空矩形矩阵，从左上角出发，按先向右、再向下、再向左、再向上的顺时针方向逐圈访问。返回所有元素的访问顺序，每格访问一次。',
`def solve(matrix):
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    out = []
    while top <= bottom and left <= right:
        for j in range(left, right + 1):
            out.append(matrix[top][j])
        top += 1
        for i in range(top, bottom + 1):
            out.append(matrix[i][right])
        right -= 1
        if top <= bottom:
            for j in range(right, left - 1, -1):
                out.append(matrix[bottom][j])
            bottom -= 1
        if left <= right:
            for i in range(bottom, top - 1, -1):
                out.append(matrix[i][left])
            left += 1
    return out`,
'用上下左右四条边界记录未访问矩形。访问一条边就收缩相应边界，遇到最后单行或单列时避免重复访问。时间 O(mn)，结果之外空间 O(1)。',
[[[[[1],[2],[3]]],[1,2,3]],[[[[2,1,0]]],[2,1,0]],[[[[1,2,3],[4,5,6],[7,8,9]]],[1,2,3,6,9,8,7,4,5]]]),
q('lc-rotate-image','matrix','原地把非空 n×n 矩阵顺时针旋转 90°。元素 (i,j) 应移至 (j,n−1−i)。测试读取修改后的矩阵，不另返回矩阵，使用常数辅助空间。',
`def solve(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()`,
'先转置得到 (j,i)，再反转每一行得到 (j,n−1−i)。时间 O(n²)，额外空间 O(1)。',
[[[[[3]]],[[3]]],[[[[1,2],[3,4]]],[[3,1],[4,2]]],[[[[1,2,3],[4,5,6],[7,8,9]]],[[7,4,1],[8,5,2],[9,6,3]]]],mutateFirst),
q('lc-search-a-2d-matrix-ii','matrix, target','非空矩形矩阵的每行从左到右、每列从上到下均递增排列。给定整数 target，返回矩阵中是否存在该值。',
`def solve(matrix, target):
    i, j = 0, len(matrix[0]) - 1
    while i < len(matrix) and j >= 0:
        value = matrix[i][j]
        if value == target:
            return True
        if value > target:
            j -= 1
        else:
            i += 1
    return False`,
'从右上角出发。当前值过大可排除其所在列，过小可排除其所在行。时间 O(m+n)，额外空间 O(1)。',
[[[[[1,4,9],[2,6,10],[5,7,12]],5],true],[[[[1,4],[2,5]],3],false],[[[[0]],0],true]]),
q('lc-intersection-of-two-linked-lists','headA, headB','传入两条无环单链表的头节点。若它们在某处开始共享同一个节点对象，返回第一个共享节点；否则返回 None。值相等的独立节点是两个节点，调用后应保留两条链表原有的链接。样例输入为 [A 的独有前缀值,B 的独有前缀值,共享尾部值]，输出为返回节点在 A 中的下标，None 表示没有交点。',
`def solve(headA, headB):
    a, b = headA, headB
    while a is not b:
        a = a.next if a else headB
        b = b.next if b else headA
    return a`,
'两指针各自到尾部后转向另一条链表，合计行走相同长度；它们会在交点或共同的空节点相遇。时间 O(m+n)，空间 O(1)。',
[[[[1,2],[2,3],[2,9]],2],[[[8,7,3],[3],[3,9]],3],[[[],[1,4],[6]],0],[[[4],[4],[]],null],[[[],[],[5]],0],[[[],[2],[]],null]],{
 driver:`def run_case(args):
    prefix_a, prefix_b, tail = args
    shared = list_from(tail)
    def attach(values):
        head = shared
        for value in reversed(values):
            head = ListNode(value, head)
        return head
    a, b = attach(prefix_a), attach(prefix_b)
    links = {}
    a_index = {}
    for head in (a, b):
        i = 0
        node = head
        while node:
            links[node] = node.next
            if head is a:
                a_index[node] = i
            node, i = node.next, i + 1
    found = solve(a, b)
    if any(node.next is not old for node, old in links.items()):
        raise ValueError("调用后输入链表的链接发生改变")
    if found is None:
        return None
    return a_index.get(found, -1)`}),
q('lc-palindrome-linked-list','head','给定单链表头节点 head，判定从头到尾的值序列是否与逆序完全相同。样例输入以值列表表示链表。尝试实现线性时间、常数辅助空间。',
`def solve(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    if fast:
        slow = slow.next
    def reverse(node):
        prev = None
        while node:
            node.next, prev, node = prev, node, node.next
        return prev
    tail = reverse(slow)
    left, right = head, tail
    equal = True
    while right:
        if left.val != right.val:
            equal = False
            break
        left, right = left.next, right.next
    reverse(tail)
    return equal`,
'快慢指针分出后半段，奇数长度跳过中心，反转后半段后逐对比较。比较完再反转一次恢复链接。时间 O(n)，空间 O(1)。',
[[[[1]],true],[[[4,2,2,4]],true],[[[1,2,3,1]],false],[[[3,8,3]],true]],{driver:`def run_case(args):
    return solve(list_from(args[0]))`}),
q('lc-linked-list-cycle','head','输入链表头 head；某个节点的 next 可能指回之前访问的节点。判断从头出发是否会反复访问同一个节点对象。样例输入为 [节点值数组,pos]，pos 为尾节点指回的下标，−1 表示正常结束。solve 只接收头节点。',
`def solve(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False`,
'快指针每次两步，慢指针每次一步。一旦都在环中，相对距离每次变化一格，最终相遇。无环时快指针先到尾部。时间 O(n)，空间 O(1)。',
[[[[2,2],-1],false],[[[6],0],true],[[[7,4,1,2],2],true],[[[],-1],false]],{
 driver:`def run_case(args):
    values, pos = args
    nodes = [ListNode(v) for v in values]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if pos >= 0:
        nodes[-1].next = nodes[pos]
    return solve(nodes[0] if nodes else None)`}),
q('lc-linked-list-cycle-ii','head','若从单链表头 head 出发可进入环，返回进入环时遇到的第一个节点对象；无环返回 None。保留原有链接。样例用 [节点值数组,pos] 建链，pos 是尾节点指回的下标，−1 表示无环。预期输出为入口下标或 None；solve 只接收头节点。',
`def solve(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            entry = head
            while entry is not slow:
                entry, slow = entry.next, slow.next
            return entry
    return None`,
'快慢指针相遇时，慢指针行走距离是环长的整数倍。从相遇点和头节点各派一个指针等速前进，两者会在入口相遇。时间 O(n)，空间 O(1)。',
[[[[2,2,2],1],1],[[[5],0],0],[[[3,2],-1],null],[[[],-1],null]],{
 driver:`def run_case(args):
    values, pos = args
    nodes = [ListNode(v) for v in values]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if pos >= 0:
        nodes[-1].next = nodes[pos]
    links = [n.next for n in nodes]
    found = solve(nodes[0] if nodes else None)
    if any(n.next is not old for n, old in zip(nodes, links)):
        raise ValueError("链表链接发生了改变")
    if found is None:
        return None
    return next((i for i, n in enumerate(nodes) if n is found), -1)`}),
q('lc-merge-two-sorted-lists','list1, list2','两条无环单链表的值分别按非降序排列。重用输入节点，合并为一条非降序链表并返回其头节点。任一输入可为 None，样例以两个值列表表示输入。',
`def solve(list1, list2):
    dummy = tail = ListNode()
    while list1 and list2:
        if list1.val <= list2.val:
            tail.next, list1 = list1, list1.next
        else:
            tail.next, list2 = list2, list2.next
        tail = tail.next
    tail.next = list1 or list2
    return dummy.next`,
'每次把两条剩余链表中更小的首节点接到结果尾部，最后直接连接非空后缀。时间 O(m+n)，额外空间 O(1)。',
[[[[1,4,4],[0,4,7]],[0,1,4,4,4,7]],[[[],[2]],[2]],[[[],[]],[]]],{
 driver:`def run_case(args):
    a, b = (list_from(values) for values in args)
    original = {}
    for node in (a, b):
        while node:
            original[node] = node.val
            node = node.next
    head = solve(a, b)
    values = list_values(head)
    node = head
    while node:
        if node not in original:
            raise ValueError("结果应复用输入链表节点")
        if original.pop(node) != node.val:
            raise ValueError("合并链表应保留每个节点原有的值")
        node = node.next
    if original:
        raise ValueError("结果缺少输入节点")
    return values`}),
q('lc-add-two-numbers','l1, l2','两条非空单链表以个位在前的顺序存储非负整数，每个节点的 val 为一位十进制数。返回表示两数之和的链表，顺序相同。除数字零外，输入的最高位均非零。',
`def solve(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        value = carry
        if l1:
            value += l1.val
            l1 = l1.next
        if l2:
            value += l2.val
            l2 = l2.next
        carry, digit = divmod(value, 10)
        tail.next = ListNode(digit)
        tail = tail.next
    return dummy.next`,
'按个位到高位的顺序相加，保留进位。处理完两条链表后，最后一次进位也会生成节点。时间 O(max(m,n))，输出之外空间 O(1)。',
[[[[9,9],[1]],[0,0,1]],[[[0],[0]],[0]],[[[3,2],[4,1,6]],[7,3,6]]],twoLists),
q('lc-remove-nth-node-from-end-of-list','head, n','给定非空单链表头和 n（1≤n≤链表长度）。从原链表移除倒数第 n 个节点，保留其余节点对象并返回修改后的头节点。样例以值列表表示链表。',
`def solve(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next`,
'快指针先走 n 步，随后两个指针同步前进；快指针到达末节点时，慢指针正好位于待删节点之前。哨兵统一处理删除头节点。时间 O(L)，空间 O(1)。',
[[[[9],1],[]],[[[1,2,3],3],[2,3]],[[[7,8,9,10],2],[7,8,10]]],relinked('remove')),
q('lc-swap-nodes-in-pairs','head','把单链表中的节点按相邻两两一组交换，返回新的头节点。奇数个节点时最后一个留在原处。请重新连接节点，并让每个节点对象保留其原值；空链表返回 None。',
`def solve(head):
    dummy = ListNode(0, head)
    before = dummy
    while before.next and before.next.next:
        first = before.next
        second = first.next
        first.next = second.next
        second.next = first
        before.next = second
        before = first
    return dummy.next`,
'用前驱节点统一拼接已交换和未交换部分。每轮交换一对后，原先的第一个节点变成下一对的前驱。时间 O(n)，空间 O(1)。',
[[[[1,2,3,4,5]],[2,1,4,3,5]],[[[7]],[7]],[[[]],[]]],relinked('pair')),
q('lc-reverse-nodes-in-k-group','head, k','以 k 个节点为一组反转单链表，返回新头节点。仅反转完整组，末尾不足 k 个节点按原顺序保留。1≤k≤链表长度。请重连原节点，保持每个节点对象原有的值。',
`def solve(head, k):
    dummy = ListNode(0, head)
    before = dummy
    while True:
        end = before
        for _ in range(k):
            end = end.next
            if end is None:
                return dummy.next
        after = end.next
        first = before.next
        prev, node = after, first
        while node is not after:
            following = node.next
            node.next = prev
            prev, node = node, following
        before.next = end
        before = first`,
'先定位完整组的末节点与下一组头，再把当前组各指针逐一反转并接回前驱。每节点至多被访问常数次，时间 O(n)，空间 O(1)。',
[[[[1,2,3,4,5],3],[3,2,1,4,5]],[[[1,2,3,4],2],[2,1,4,3]],[[[8,9],1],[8,9]]],relinked('group')),
q('lc-copy-list-with-random-pointer','head','输入单链表，每个 Node 有 val、next 和 random 字段。random 为 None 或指向链上任意节点。构造并返回深拷贝，每个节点都是新对象，保留所有值及两种指针的对应关系。样例每项 [val,randomIndex] 表示原节点的值与 random 的目标下标，空指针记为 null。',
`def solve(head):
    copies = {None: None}
    node = head
    while node:
        copies[node] = Node(node.val)
        node = node.next
    node = head
    while node:
        copies[node].next = copies[node.next]
        copies[node].random = copies[node.random]
        node = node.next
    return copies[head]`,
'第一次遍历按节点身份建立原节点到副本的映射，第二次通过映射连接 next 和 random。时间 O(n)，映射空间 O(n)。',
[[[[[3,1],[3,0],[9,1]]],[[3,1],[3,0],[9,1]]],[[[[2,null],[4,1]]],[[2,null],[4,1]]],[[[]],[]]],{
 prelude:`class Node:
    def __init__(self, x=0, next=None, random=None):
        self.val = x
        self.next = next
        self.random = random`,
 driver:`def run_case(args):
    rows = args[0]
    original = [Node(value) for value, _ in rows]
    for i, (_, target) in enumerate(rows):
        original[i].next = original[i+1] if i+1 < len(rows) else None
        original[i].random = original[target] if target is not None else None
    old_links = [(p.val, p.next, p.random) for p in original]
    node = solve(original[0] if original else None)
    if any((p.val, p.next, p.random) != links for p, links in zip(original, old_links)):
        raise ValueError("原链表应保留完整")
    indexed = {}
    originals = set(original)
    copied = []
    while node is not None:
        if node in originals or node in indexed:
            raise ValueError("返回值需要由新的、互异的链表节点组成")
        indexed[node] = len(copied)
        copied.append(node)
        node = node.next
    return [[p.val, None if p.random is None else indexed[p.random]] for p in copied]`}),
q('lc-sort-list','head','给定单链表的头节点，返回按值非降序排列后的链表头。链表可为空，可包含重复值和负数。尝试用 O(n log n) 时间和 O(1) 辅助空间实现。',
`def solve(head):
    def split(node, width):
        if node is None:
            return None
        for _ in range(1, width):
            if node.next is None:
                break
            node = node.next
        rest, node.next = node.next, None
        return rest

    size = 0
    node = head
    while node:
        size += 1
        node = node.next
    dummy = ListNode(0, head)
    width = 1
    while width < size:
        tail = dummy
        remaining = dummy.next
        while remaining:
            left = remaining
            right = split(left, width)
            remaining = split(right, width)
            while left and right:
                if left.val <= right.val:
                    tail.next, left = left, left.next
                else:
                    tail.next, right = right, right.next
                tail = tail.next
            tail.next = left or right
            while tail.next:
                tail = tail.next
        width *= 2
    return dummy.next`,
'自底向上归并，依次合并长度 1、2、4 等的相邻有序链段。每轮线性处理所有节点，共 O(log n) 轮。总时间 O(n log n)，额外空间 O(1)。',
[[[[4,1,-2,1]],[-2,1,1,4]],[[[]],[]],[[[5,4,3,2,1]],[1,2,3,4,5]]],listInput),
q('lc-merge-k-sorted-lists','lists','给定若干条各自按非降序排列的单链表的头节点列表 lists，把所有节点合成一条非降序链表并返回头节点。输入可含空链表，lists 本身也可为空。样例为嵌套的值列表。',
`from heapq import heapify, heappop, heappush

def solve(lists):
    heap = [(node.val, i, node) for i, node in enumerate(lists) if node]
    heapify(heap)
    dummy = tail = ListNode()
    while heap:
        _, i, node = heappop(heap)
        if node.next:
            heappush(heap, (node.next.val, i, node.next))
        tail.next = node
        tail = node
    return dummy.next`,
'堆内对每条链表最多保留一个候选首节点。相同值时使用链表编号作次级排序键，可以跳过节点对象间的比较。设节点总数 N、链表数 k，时间 O(k+N log(k+1))，辅助空间 O(k)。',
[[[[[1,5],[],[1,3],[-2,8]]],[-2,1,1,3,5,8]],[[[]],[]],[[[[],[]]],[]]],{
 driver:`def run_case(args):
    return list_values(solve([list_from(values) for values in args[0]]))`}),
q('lc-lru-cache','','实现固定容量 LRUCache(capacity)，容量为正整数。get(key) 返回已有值并把该键记作最近使用，缺失时返回 −1。put(key,value) 写入或替换并更新最近使用顺序，超容时淘汰最久未使用的键，返回 None。两个操作的平均时间应为 O(1)。样例给出操作名、每次的参数和结果。',
`from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.entries = OrderedDict()

    def get(self, key):
        if key not in self.entries:
            return -1
        self.entries.move_to_end(key)
        return self.entries[key]

    def put(self, key, value):
        self.entries[key] = value
        self.entries.move_to_end(key)
        if len(self.entries) > self.capacity:
            self.entries.popitem(last=False)`,
'OrderedDict 提供哈希查找和可调整的双向顺序。右端始终是最近使用的元素，淘汰时删除左端。各操作平均 O(1)，空间 O(capacity)。',
[[[['LRUCache','put','put','get','put','get','get'],[[2],[3,7],[5,8],[3],[9,4],[5],[9]]],[null,null,null,7,null,-1,4]],[[['LRUCache','put','put','put','put','get','get'],[[2],[1,4],[2,6],[1,8],[3,1],[1],[2]]],[null,null,null,null,null,8,-1]],[[['LRUCache','get','put','get'],[[1],[7],[7,0],[7]]],[null,-1,null,0]]],
stateful('LRUCache',`class LRUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        raise NotImplementedError

    def put(self, key, value):
        raise NotImplementedError`)),
q('lc-binary-tree-inorder-traversal','root','给定二叉树根节点 root，按左子树、当前节点、右子树的顺序输出节点值列表。空树返回空列表。样例用层序数组表示输入，null 表示空子节点。',
`def solve(root):
    stack = []
    out = []
    node = root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        out.append(node.val)
        node = node.right
    return out`,
'栈保存沿左子树下行时尚未访问的祖先，弹出一项后进入其右子树。时间 O(n)，输出之外空间 O(h)，h 为树高。',
[[[[2,1,3]],[1,2,3]],[[[3,null,5,4]],[3,4,5]],[[[]],[]]],treeInput),
q('lc-invert-binary-tree','root','给定二叉树根节点 root，交换树中每个节点的左右子树，返回镜像树的根。空树返回 None。输入与输出示例以层序数组表示，null 标记空子节点。',
`def solve(root):
    stack = [root] if root else []
    while stack:
        node = stack.pop()
        node.left, node.right = node.right, node.left
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)
    return root`,
'访问每个节点时交换两个子节点，然后处理其子树。时间 O(n)，深度优先遍历栈最多 O(h)，h 为树高。',
[[[[3,1,6,null,2]],[3,6,1,null,null,2]],[[[7]],[7]],[[[]],[]]],{
 driver:`def run_case(args):
    return tree_values(solve(tree_from(args[0])))`}),
q('lc-symmetric-tree','root','判断给定二叉树是否关于根的中心轴镜像对称。左右对应位置既要同时存在或同时为空，非空节点的值也应相同。层序样例中以 null 表示空子节点。',
`def solve(root):
    if root is None:
        return True
    stack = [(root.left, root.right)]
    while stack:
        left, right = stack.pop()
        if left is None or right is None:
            if left is not right:
                return False
            continue
        if left.val != right.val:
            return False
        stack.append((left.left, right.right))
        stack.append((left.right, right.left))
    return True`,
'每次取一对镜像位置，同时比较空节点、节点值，并将外侧孩子和内侧孩子分别配对。时间 O(n)，深度优先栈 O(h)。',
[[[[1,2,2,3,null,null,3]],true],[[[1,2,2,null,4,null,4]],false],[[[1,2,3]],false],[[[7]],true]],treeInput),
q('lc-diameter-of-binary-tree','root','二叉树中任意两节点之间的唯一路径长度按边数计算。返回最长路径的长度，端点可以位于任意子树，单节点结果为 0。样例按层序给出树，null 表示空位置。',
`def solve(root):
    if root is None:
        return 0
    depth = {None: 0}
    best = 0
    stack = [(root, False)]
    while stack:
        node, visited = stack.pop()
        if visited:
            left, right = depth[node.left], depth[node.right]
            best = max(best, left + right)
            depth[node] = 1 + max(left, right)
        else:
            stack.append((node, True))
            for child in (node.left, node.right):
                if child:
                    stack.append((child, False))
    return best`,
'后序遍历得到每棵子树以节点数表示的高度。以某节点为两支路径交会处，左右子树高度之和就是最长经过该节点并分别进入两支的路径边数。全树取最大。时间 O(n)，空间 O(n)。',
[[[[5]],0],[[[1,2,null,3,4,5,null,null,6]],4],[[[1,null,2,null,3]],2]],treeInput),
q('lc-binary-tree-level-order-traversal','root','给定二叉树根 root，按自上而下、每层从左到右的顺序，把节点值分层返回为二维列表。空树返回 []，层序输入中的 null 表示缺少孩子。',
`from collections import deque

def solve(root):
    if root is None:
        return []
    queue = deque([root])
    result = []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result`,
'广度优先遍历每轮固定处理队列中的现有节点数，随后加入的孩子属于下一层。时间 O(n)，除输出外队列占 O(w)，w 为最大层宽。',
[[[[]],[]],[[[1,2,3,null,4,5]],[[1],[2,3],[4,5]]],[[[8]],[[8]]]],treeInput),
q('lc-convert-sorted-array-to-binary-search-tree','nums','nums 是严格递增的非空整数数组。构造一棵包含所有输入值的二叉搜索树，要求每个节点左右子树的高度之差至多为 1。返回 TreeNode 根节点。示例输出为一种可行树的层序表示；满足以上条件的其他树形同样通过。',
`def solve(nums):
    def build(left, right):
        if left >= right:
            return None
        mid = (left + right) // 2
        root = TreeNode(nums[mid])
        root.left = build(left, mid)
        root.right = build(mid + 1, right)
        return root
    return build(0, len(nums))`,
'取当前有序区段的中间元素为根，左右两段分别递归构造。区段长度相差至多一，得到高度平衡的 BST。时间 O(n)，结果之外递归栈 O(log n)。',
[[[[-3,-2,0,4,7]],[0,-2,7,-3,null,4]],[[[1,2]],[2,1]],[[[9]],[9]]],{
 driver:`def run_case(args):
    return tree_values(solve(args[0]))

def accepts(args, actual, expected):
    root = tree_from(actual)
    ordered = []
    def visit(node):
        if node is None:
            return 0
        left = visit(node.left)
        ordered.append(node.val)
        right = visit(node.right)
        if left == -1 or right == -1 or abs(left - right) > 1:
            return -1
        return max(left, right) + 1
    return visit(root) >= 0 and ordered == args[0]`,
 judgeNote:'对返回树检查中序值序列和每个节点的高度平衡，允许多种树形。'}),
];

// 链表局部修改题要求节点身份与原值保持对应。用原节点对象序列核对实际顺序。
function relinked(mode) {
  return { driver: `def run_case(args):
    head = list_from(args[0])
    node = head
    original = []
    while node:
        original.append(node)
        node = node.next
    ${mode === 'remove' ? `index = len(original) - args[1]
    expected_nodes = original[:index] + original[index + 1:]` : `k = ${mode === 'pair' ? '2' : 'args[1]'}
    expected_nodes = []
    for i in range(0, len(original), k):
        group = original[i:i+k]
        expected_nodes.extend(reversed(group) if len(group) == k else group)`}
    result = solve(head, *args[1:])
    values = list_values(result)
    node = result
    for original_node in expected_nodes:
        if node is not original_node:
            raise ValueError("检查节点身份与链接顺序，请通过重新连接原节点修改链表")
        node = node.next
    if node is not None:
        raise ValueError("结果中存在额外节点")
    return values` };
}
