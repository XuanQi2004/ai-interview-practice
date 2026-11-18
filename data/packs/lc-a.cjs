const { q } = require('../catalog-kit.cjs');

function linkedResult(nodeOrder) {
  return {driver: `def run_case(args):
    head = list_from(args[0])
    nodes = []
    node = head
    while node:
        nodes.append(node)
        node = node.next
    expected_nodes = ${nodeOrder}
    result = solve(head)
    values = list_values(result)
    for original in expected_nodes:
        if result is not original:
            raise ValueError("请重新连接输入链表的原节点，并保留各节点原有的值")
        result = result.next
    if result is not None:
        raise ValueError("结果链表包含额外节点")
    return values`};
}
const linkedScalar = {driver: `def run_case(args):
    return solve(list_from(args[0]))`};
const treeScalar = {driver: `def run_case(args):
    return solve(tree_from(args[0]), *args[1:])`};

module.exports = [
q('lc-merge-strings-alternately','word1, word2','交替取两个字符串中的字符，第一次取 word1。一个字符串取完后，将另一个的剩余部分接到末尾。返回拼接结果。',
`def solve(word1, word2):
    result = []
    for i in range(max(len(word1), len(word2))):
        if i < len(word1):
            result.append(word1[i])
        if i < len(word2):
            result.append(word2[i])
    return "".join(result)`,
'按下标交替追加可用字符，最后一次连接。时间和输出空间均为 O(m+n)。',
[[['ab','XYZ'],'aXbYZ'],[['abcd','x'],'axbcd'],[['p','q'],'pq'],[['xy','ab'],'xayb']]),

q('lc-greatest-common-divisor-of-strings','str1, str2','输入两个非空大写字母串。寻找最长的非空字符串，使两个输入都能由它重复整数次得到。存在时返回该字符串，否则返回空串。',
`def solve(str1, str2):
    from math import gcd
    if str1 + str2 != str2 + str1:
        return ""
    return str1[:gcd(len(str1), len(str2))]`,
'两个字符串的拼接次序可交换当且仅当它们是同一个基本串的重复。可行的最大长度是两串长度的最大公因数。时间与临时空间 O(m+n)。',
[[['ABABAB','ABAB'],'AB'],[['AAAA','AA'],'AA'],[['XYZ','XYZ'],'XYZ'],[['AB','ABA'],'']]),

q('lc-kids-with-the-greatest-number-of-candies','candies, extra','candies[i] 是第 i 个孩子已有的糖果数，数组非空。分别考虑把全部 extra 颗额外糖果给每个孩子的情况；若此时该孩子糖果数达到或超过其他所有孩子，结果中对应位置填 True，否则填 False。允许并列第一。',
`def solve(candies, extra):
    highest = max(candies)
    return [count + extra >= highest for count in candies]`,
'把每个候选总数与原数组最大值比较即可。时间 O(n)，除了返回数组仅用 O(1) 空间。',
[[[[1,5,3],2],[false,true,true]],[[[2,2],1],[true,true]],[[[8],3],[true]],[[[5,1,1],3],[true,false,false]]]),

q('lc-can-place-flowers','flowerbed, n','flowerbed 只含 0 和 1，1 表示已有花，已有花互不相邻。判断能否再种 n 朵，使最终任何相邻位置都不会同时有花。返回布尔值，n 可以为 0。',
`def solve(flowerbed, n):
    previous = 0
    for i, occupied in enumerate(flowerbed):
        right = flowerbed[i + 1] if i + 1 < len(flowerbed) else 0
        if not occupied and not previous and not right:
            n -= 1
            previous = 1
        else:
            previous = occupied
    return n <= 0`,
'从左向右在最早的合法空位种花；把可行方案的第一朵移到该位置只会给右侧留下更多空间。花坛长 m 时，时间 O(m)，空间 O(1)。',
[[[[0],1],true],[[[1,0,0,0,1],2],false],[[[0,0,0,0],2],true],[[[1,0,1],0],true],[[[0,1,0],1],false]]),

q('lc-reverse-vowels-of-a-string','s','将 s 中的英文元音（a、e、i、o、u 及其大写形式）按出现顺序逆转，其他字符保留原位置。返回结果字符串，元音本身保留大小写。',
`def solve(s):
    chars = list(s)
    vowels = set("aeiouAEIOU")
    left, right = 0, len(chars) - 1
    while left < right:
        if chars[left] not in vowels:
            left += 1
        elif chars[right] not in vowels:
            right -= 1
        else:
            chars[left], chars[right] = chars[right], chars[left]
            left += 1
            right -= 1
    return "".join(chars)`,
'两个指针从两端定位元音并交换。每个位置最多访问常数次，时间 O(n)，字符数组空间 O(n)。',
[[['aBcE'],'EBca'],[['rhythm'],'rhythm'],[['OuAi'],'iAuO'],[['a!'],'a!']]),

q('lc-reverse-words-in-a-string','s','将字符串中由空格分隔的非空单词逆序排列，单词内部顺序不变。结果中相邻单词之间恰好放一个空格，去掉首尾空格。输入至少含一个单词。',
`def solve(s):
    return " ".join(reversed(s.split()))`,
'按空白分词会同时处理首尾空格和连续空格，再倒序连接单词。时间与空间均为 O(n)。',
[[['  red  blue '],'blue red'],[['solo'],'solo'],[['a b c'],'c b a'],[[' wyZ    11  '],'11 wyZ']]),

q('lc-product-of-array-except-self','nums','给定长度至少为 2 的整数数组，返回等长列表，其第 i 项是除了 nums[i] 以外其他元素的乘积。使用线性时间，运算仅依赖乘法及索引，支持零和负数。',
`def solve(nums):
    result = [1] * len(nums)
    product = 1
    for i, value in enumerate(nums):
        result[i] = product
        product *= value
    product = 1
    for i in range(len(nums) - 1, -1, -1):
        result[i] *= product
        product *= nums[i]
    return result`,
'正向把左侧乘积存到输出，反向乘上右侧乘积。零自然参与乘法。时间 O(n)，除输出外空间 O(1)。',
[[[[2,3,5]],[15,10,6]],[[[0,-2,4]],[-8,0,0]],[[[0,4,0]],[0,0,0]],[[[-1,-2]],[ -2,-1]]]),

q('lc-increasing-triplet-subsequence','nums','判断整数数组中是否存在 i < j < k 且 nums[i] < nums[j] < nums[k] 的三个位置。三个位置可以不连续。',
`def solve(nums):
    first = second = float("inf")
    for x in nums:
        if x <= first:
            first = x
        elif x <= second:
            second = x
        else:
            return True
    return False`,
'保存长度 1 和长度 2 的严格递增子序列可达到的最小末值。遇到比第二个末值更大的新值，已有长度 3 的答案。时间 O(n)，空间 O(1)。',
[[[[3,1,5,0,4,7]],true],[[[2,2,2]],false],[[[3,2,1]],false],[[[1,2]],false],[[[1,5,0,6]],true]]),

q('lc-string-compression','chars','chars 是非空的单字符列表。对每段连续相同字符，依次写入该字符；若该段长度超过 1，随后逐个写入长度的十进制数字。原地把压缩内容写到列表前部，返回有效前缀长度 k，使用常量额外空间。判题显示 k 和前 k 个字符。',
`def solve(chars):
    read = write = 0
    while read < len(chars):
        end = read + 1
        while end < len(chars) and chars[end] == chars[read]:
            end += 1
        chars[write] = chars[read]
        write += 1
        if end - read > 1:
            count = end - read
            divisor = 1
            while divisor * 10 <= count:
                divisor *= 10
            while divisor:
                chars[write] = str(count // divisor)
                write += 1
                count %= divisor
                divisor //= 10
        read = end
    return write`,
'读指针识别完整的一段，写指针在前部顺序放字符和计数各位。压缩一段所需字符数至多等于原段长度。时间 O(n)，额外空间 O(1)。',
[[[['a','a','b','c','c']],[5,['a','2','b','c','2']]],[[Array(12).fill('x')],[3,['x','1','2']]],[[['a']],[1,['a']]],[[['1','1','1','2']],[3,['1','3','2']]]],
{driver:`def run_case(args):
    chars = args[0]
    k = solve(chars)
    if type(k) is not int or not 0 <= k <= len(chars):
        raise ValueError("返回值应为合法前缀长度")
    return [k, chars[:k]]`}),

q('lc-move-zeroes','nums','原地修改整数列表 nums，将零全部移到尾部，其余元素保持原相对顺序。使用常量额外空间。函数无需返回值，判题读取修改后的 nums。',
`def solve(nums):
    write = 0
    for read, x in enumerate(nums):
        if x != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1`,
'write 指向下一项非零值的位置；读到非零项时交换，使已处理部分成为非零前缀和零后缀。时间 O(n)，额外空间 O(1)。',
[[[[0,2,0,-1]], [2,-1,0,0]],[[[0,0]],[0,0]],[[[7]],[7]],[[[4,0,3,2]],[4,3,2,0]]],
{driver:`def run_case(args):
    solve(args[0])
    return args[0]`}),

q('lc-is-subsequence','s, t','判断能否从字符串 t 中删除若干字符并保持剩余字符的顺序，得到 s。可以删除全部字符或零个字符。返回布尔值。',
`def solve(s, t):
    matched = 0
    for char in t:
        if matched < len(s) and s[matched] == char:
            matched += 1
    return matched == len(s)`,
'在 t 中从左到右为 s 的每个字符选最早可行位置，给剩余字符保留最多位置。时间 O(len(t))，空间 O(1)。',
[[['aa','abba'],true],[['aba','aab'],false],[['','xyz'],true],[['x',''],false],[['ace','abcde'],true]]),

q('lc-container-with-most-water','height','位置 i 竖有高度为 height[i] 的线段，输入至少两项非负高度。选 i < j 构成左右边界，容量为 (j−i) × min(height[i], height[j])。求最大容量。',
`def solve(height):
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        best = max(best, (right - left) * min(height[left], height[right]))
        if height[left] <= height[right]:
            left += 1
        else:
            right -= 1
    return best`,
'保留较矮边而向内移另一边，宽度会减小且高度至多为原较矮边。因此每步可以丢弃较矮边。时间 O(n)，空间 O(1)。',
[[[[3,1,2,4]],9],[[[0,0]],0],[[[7,7]],7],[[[1,5,1,5,1]],10]]),

q('lc-max-number-of-k-sum-pairs','nums, k','每次从整数数组中取走两个不同位置的数，要求两数之和为 k。一个位置至多使用一次。返回最多能进行多少次操作。',
`def solve(nums, k):
    waiting = {}
    pairs = 0
    for x in nums:
        partner = k - x
        if waiting.get(partner, 0):
            waiting[partner] -= 1
            pairs += 1
        else:
            waiting[x] = waiting.get(x, 0) + 1
    return pairs`,
'每个数的配对值唯一。存在尚未使用的补数时立即消耗一个，否则把当前值记入等待计数。平均时间 O(n)，额外空间 O(n)。',
[[[[1,4,1,4,3],5],2],[[[3,3,3],6],1],[[[2,7],4],0],[[[1,2,3,4],5],2]]),

q('lc-maximum-average-subarray-i','nums, k','在整数数组中求长度恰好为 k 的连续子数组的最大算术平均值，返回数值。1 ≤ k ≤ 数组长度，元素可以为负。',
`def solve(nums, k):
    total = sum(nums[i] for i in range(k))
    highest = total
    for i in range(k, len(nums)):
        total += nums[i] - nums[i - k]
        highest = max(highest, total)
    return highest / k`,
'等长窗口的平均数按总和排序。移动时减去离开项、加上新项，最后除以 k。时间 O(n)，额外空间 O(1)。',
[[[[-5,-2,-3],2],-2.5],[[[1,4,2,9],2],5.5],[[[7],1],7],[[[0,3,1],3],4/3]]),

q('lc-maximum-number-of-vowels-in-a-substring-of-given-length','s, k','s 由小写英文字母组成，1 ≤ k ≤ len(s)。返回所有长度为 k 的连续子串中，a、e、i、o、u 的最多出现次数。',
`def solve(s, k):
    vowels = set("aeiou")
    count = sum(s[i] in vowels for i in range(k))
    best = count
    for i in range(k, len(s)):
        count += (s[i] in vowels) - (s[i-k] in vowels)
        best = max(best, count)
    return best`,
'维护定长窗口内的元音数，每向右移动一次只更新两个边界字符。时间 O(n)，空间 O(1)。',
[[['zzaior',3],3],[['rhythm',2],0],[['aeiou',5],5],[['xa',1],1]]),

q('lc-max-consecutive-ones-iii','nums, k','输入只含 0、1 的列表和非负整数 k。最多可以把 k 个 0 改为 1，求能得到的最长连续 1 的长度。',
`def solve(nums, k):
    left = zeros = best = 0
    for right, bit in enumerate(nums):
        zeros += bit == 0
        while zeros > k:
            zeros -= nums[left] == 0
            left += 1
        best = max(best, right - left + 1)
    return best`,
'一个区间可全部置一，当且仅当其中零的个数至多 k。从右侧扩展，零过多时收缩左侧。时间 O(n)，空间 O(1)。',
[[[[1,0,1,0,1],1],3],[[[0,0],0],0],[[[1,1],0],2],[[[0,1,0],3],3]]),

q('lc-longest-subarray-of-1s-after-deleting-one-element','nums','从非空二进制数组中恰好删除一个元素，再求剩余数组中最长连续全 1 片段的长度。只含一个元素时返回 0。',
`def solve(nums):
    left = zeros = best = 0
    for right, bit in enumerate(nums):
        zeros += bit == 0
        while zeros > 1:
            zeros -= nums[left] == 0
            left += 1
        best = max(best, right - left)
    return best`,
'窗口允许至多一个零。删除窗口中的零或其中一个 1 后，可贡献窗口长度减一；全 1 输入也按同一规则处理。时间 O(n)，空间 O(1)。',
[[[[1,1,0,1,1]],4],[[[1,1,1]],2],[[[0]],0],[[[0,0,1,1]],2],[[[0,0,0]],0]]),

q('lc-find-the-highest-altitude','gain','从海拔 0 出发，gain 依时间给出每段行程的海拔变化量。计算起点及所有段末所达到的最高海拔。',
`def solve(gain):
    altitude = peak = 0
    for delta in gain:
        altitude += delta
        peak = max(peak, altitude)
    return peak`,
'维护累计变化量和已见过的最大累计值。把起点 0 纳入最高值。时间 O(n)，空间 O(1)。',
[[[[-2,-3]],0],[[[2,4,-7]],6],[[[0]],0],[[[-5,6,3]],4]]),

q('lc-find-pivot-index','nums','返回最靠左的下标 i，使 nums[i] 左侧所有元素之和与右侧之和相同。空侧的和是 0，未找到这样的下标时返回 -1。',
`def solve(nums):
    total = sum(nums)
    left = 0
    for i, value in enumerate(nums):
        if left == total - left - value:
            return i
        left += value
    return -1`,
'已知总和与左侧和，减去左侧和及当前元素即得右侧和。从左到右第一次满足时返回。时间 O(n)，空间 O(1)。',
[[[[2,1,-1]],0],[[[2,0,2]],1],[[[0,0]],0],[[[1,3]],-1],[[[-1,1,5]],2]]),

q('lc-find-the-difference-of-two-arrays','nums1, nums2','返回含两个列表的列表。第一项收集仅出现于 nums1 的整数，第二项收集仅出现于 nums2 的整数。每侧每个数只出现一次，各侧顺序任意。',
`def solve(nums1, nums2):
    a, b = set(nums1), set(nums2)
    return [list(a - b), list(b - a)]`,
'先按数值去重，再分别求有方向的集合差。平均时间与额外空间均为 O(m+n)。',
[[[[2,2,4,7],[1,4,4]],[[2,7],[1]]],[[[1,1],[1]],[[],[]]],[[[-2,3],[0]],[[-2,3],[0]]],[[[5],[9]],[[5],[9]]]],
{driver:`def run_case(args):
    answer = solve(*args)
    if not isinstance(answer, (list, tuple)) or len(answer) != 2:
        raise ValueError("返回包含两项的列表")
    return [sorted(part) for part in answer]`}),

q('lc-unique-number-of-occurrences','arr','统计每种整数在 arr 中出现的次数，判断这些次数是否两两不同。返回布尔值。',
`def solve(arr):
    from collections import Counter
    counts = Counter(arr)
    return len(counts) == len(set(counts.values()))`,
'统计每个值的频数，再比较频数集合大小和不同数值的个数。平均时间 O(n)，空间 O(u)，u 为不同值数。',
[[[[1,1,2,3,3,3]],true],[[[3,4]],false],[[[-1,-1]],true],[[[1,1,2,2]],false]]),

q('lc-determine-if-two-strings-are-close','word1, word2','给定两个小写字母串。一次操作可交换任意两个位置的字符，或选择当前都存在的两种字母，将两种字母的全部出现互换。判断能否经过若干操作把 word1 变为 word2。',
`def solve(word1, word2):
    from collections import Counter
    a, b = Counter(word1), Counter(word2)
    return a.keys() == b.keys() and sorted(a.values()) == sorted(b.values())`,
'位置交换允许任意重排，字母互换允许在现有字母之间任意重排频数。两串须有相同的字母集合与频数多重集，这两个条件也充分。对固定小写字母表，时间 O(m+n)，空间 O(1)。',
[[['aabbb','aaabb'],true],[['abc','cba'],true],[['aab','aac'],false],[['aaaaab','aaabbb'],false],[['a','aa'],false]]),

q('lc-equal-row-and-column-pairs','grid','输入非空 n×n 整数方阵。统计有序对 (i,j) 的数量，使第 i 行从左到右的序列等于第 j 列从上到下的序列。相同内容的多行、多列按各自索引计数。',
`def solve(grid):
    from collections import Counter
    rows = Counter(tuple(row) for row in grid)
    return sum(rows[column] for column in zip(*grid))`,
'把每行转为元组计数，再将每列作为完整元组查询行数。平均时间 O(n²)，额外空间 O(n²)。',
[[[[[1,2],[2,1]]],2],[[[[5,5],[5,5]]],4],[[[[2]]],1],[[[[1,2],[3,4]]],0]]),

q('lc-removing-stars-from-a-string','s','从左到右处理小写字母和星号构成的字符串。每个星号与它左侧最近的、仍然保留的字母一起删除。输入保证每个星号都有可删除的字母。返回最终字符串。',
`def solve(s):
    kept = []
    for char in s:
        if char == "*":
            kept.pop()
        else:
            kept.append(char)
    return "".join(kept)`,
'已保留的字母按原顺序入栈，星号删除栈顶。每个字符只处理一次。时间与额外空间 O(n)。',
[[['ab*c'],'ac'],[['x*y*'],''],[['abc**d'],'ad'],[['abc'],'abc']]),

q('lc-asteroid-collision','asteroids','非零整数依次表示从左到右排列的小行星，正数向右、负数向左，均等速移动；绝对值表示大小。相撞时小者消失，等大时同时消失。返回碰撞结束后从左到右的小行星列表。',
`def solve(asteroids):
    survivors = []
    for x in asteroids:
        while survivors and survivors[-1] > 0 > x:
            if survivors[-1] < -x:
                survivors.pop()
                continue
            if survivors[-1] == -x:
                survivors.pop()
            break
        else:
            survivors.append(x)
    return survivors`,
'当前向左运动的小行星只可能与末尾向右者碰撞。以栈模拟，击碎较小的栈顶后继续，碰到更大或等大时停止。每颗最多入栈出栈各一次，时间与空间 O(n)。',
[[[[4,2,-5]],[-5]],[[[7,-7]],[]],[[[-3,2]],[-3,2]],[[[9,1,-3]],[9]],[[[1,2,3]],[1,2,3]]]),

q('lc-decode-string','s','输入合法编码串，字母保持原样，k[片段] 表示把片段重复 k 次，k 为正十进制整数；重复结构可以嵌套、相连。返回完全展开的字符串。',
`def solve(s):
    stack = []
    pieces = []
    count = 0
    for char in s:
        if char.isdigit():
            count = count * 10 + int(char)
        elif char == "[":
            stack.append((pieces, count))
            pieces, count = [], 0
        elif char == "]":
            prefix, repetitions = stack.pop()
            prefix.append("".join(pieces) * repetitions)
            pieces = prefix
        else:
            pieces.append(char)
    return "".join(pieces)`,
'入括号时保存当前前缀与次数，出括号时将内层展开后加入上一层。若原串长 n、结果长 L、嵌套深度 d，各层复制的时间上界为 O(n+(d+1)L)，空间 O(n+L)。',
[[['a2[bc]d'],'abcbcd'],[['2[a3[b]]'],'abbbabbb'],[['10[x]'],'xxxxxxxxxx'],[['2[a]3[c]'],'aaccc'],[['z'],'z']]),

q('lc-number-of-recent-calls','','实现 RecentCounter 类，构造器无参数。ping(t) 登记一次发生在整数毫秒 t 的请求，并返回时间落在闭区间 [t−3000,t] 内的已登记请求数。每次调用的 t 严格递增。用例输入是一组时间，输出是各次 ping 的返回值。',
`class RecentCounter:
    def __init__(self):
        from collections import deque
        self.times = deque()

    def ping(self, t):
        self.times.append(t)
        while self.times[0] < t - 3000:
            self.times.popleft()
        return len(self.times)`,
'单调递增的时间使过期项集中在队首。每个时间只入队一次、至多出队一次，每次均摊 O(1)。空间 O(w)，w 为当前区间内的请求数。',
[[[[1,3001,3002]],[1,2,2]],[[[10,12,15]],[1,2,3]],[[[1,5000,9001]],[1,1,1]],[[[3]],[1]]],
{signature:'RecentCounter().ping(t)',starter:'class RecentCounter:\n    def __init__(self):\n        pass\n\n    def ping(self, t):\n        pass\n',driver:`def run_case(args):
    counter = RecentCounter()
    return [counter.ping(t) for t in args[0]]`}),

q('lc-dota2-senate','senate','环形顺序投票，字符串 R、D 分别表示两个阵营的议员。每位仍有资格的议员按顺序行动，可以永久取消对方一位议员的资格；若只余自己阵营，该阵营获胜。双方均选择有利于本方的行动。返回胜方 "Radiant" 或 "Dire"。输入非空。',
`def solve(senate):
    from collections import deque
    radiant = deque(i for i, c in enumerate(senate) if c == "R")
    dire = deque(i for i, c in enumerate(senate) if c == "D")
    while radiant and dire:
        r, d = radiant.popleft(), dire.popleft()
        if r < d:
            radiant.append(r + len(senate))
        else:
            dire.append(d + len(senate))
    return "Radiant" if radiant else "Dire"`,
'当前先行动者淘汰下一位能行动的对手，可以最早减少对方的行动机会。将胜出者的下轮时间加上全体人数，放回队尾。每轮淘汰一人，时间与空间 O(n)。',
[[['RD'],'Radiant'],[['RDD'],'Dire'],[['DDRR'],'Dire'],[['R'],'Radiant'],[['RRDDD'],'Radiant']]),

q('lc-delete-the-middle-node-of-a-linked-list','head','给定长度 n ≥ 1 的单链表头节点 head，从原链表中移除从 0 开始编号的第 ⌊n/2⌋ 个节点，保留其余节点对象并返回头节点。长度为 1 时返回 None。用例以值列表表示链表。',
`def solve(head):
    if head.next is None:
        return None
    before, fast = head, head.next.next
    while fast and fast.next:
        before = before.next
        fast = fast.next.next
    before.next = before.next.next
    return head`,
'快指针先走两步，此后每走两步，前驱指针走一步。结束时前驱恰好位于待删节点前。时间 O(n)，空间 O(1)。',
[[[[5]],[]],[[[1,2]],[1]],[[[7,3,9]],[7,9]],[[[4,5,6,7]],[4,5,7]],[[[1,2,3,4,5]],[1,2,4,5]]],linkedResult('nodes[:len(nodes)//2] + nodes[len(nodes)//2+1:]')),

q('lc-odd-even-linked-list','head','按单链表节点的位置重排：从 1 开始编号，把所有奇数位置节点放在前半部分，偶数位置节点放在后半部分，各自保持原顺序。通过调整 next 指针在 O(1) 额外空间内完成，返回头节点。空链表用 None 表示。',
`def solve(head):
    if not head:
        return head
    odd, even = head, head.next
    even_head = even
    while even and even.next:
        odd.next = even.next
        odd = odd.next
        even.next = odd.next
        even = even.next
    odd.next = even_head
    return head`,
'分别维护奇数链和偶数链的尾节点，交替接入原链节点，再把奇数链尾指向偶数链头。时间 O(n)，额外空间 O(1)。',
[[[[2,4,6,8,10]],[2,6,10,4,8]],[[[]],[]],[[[4]],[4]],[[[2,3,4,5]],[2,4,3,5]]],linkedResult('nodes[::2] + nodes[1::2]')),

q('lc-reverse-linked-list','head','反转单链表所有 next 指针，返回新的头节点。空链表返回 None。用例列表按原始链表的访问顺序给出节点值。',
`def solve(head):
    previous = None
    while head:
        following = head.next
        head.next = previous
        previous = head
        head = following
    return previous`,
'每次先暂存原后继，再将当前节点接到已反转前缀的头部。时间 O(n)，空间 O(1)。',
[[[[2,7,1]],[1,7,2]],[[[]],[]],[[[42]],[42]],[[[2,1,2,1]],[1,2,1,2]]],linkedResult('nodes[::-1]')),

q('lc-maximum-twin-sum-of-a-linked-list','head','单链表长度 n 是正偶数，节点值均为正数。把第 i 与第 n−1−i 个节点配成一对（从 0 编号），返回所有配对的最大节点值之和。',
`def solve(head):
    from collections import deque
    values = deque()
    while head:
        values.append(head.val)
        head = head.next
    best = 0
    while values:
        best = max(best, values.popleft() + values.pop())
    return best`,
'将节点值存入双端队列，每次从两端各取一个得到一对。时间与额外空间 O(n)。也可原地反转后半段，再同时遍历前后两段。',
[[[[2,9,3,6]],12],[[[7,7]],14],[[[10,1,2,3,1,9]],19],[[[1,6,6,1]],12]],linkedScalar),

q('lc-maximum-depth-of-binary-tree','root','给定二叉树根节点，求从根到最远叶节点的路径所含节点数。空树深度为 0。用例以层序列表表示树，null 表示空子节点。',
`def solve(root):
    if not root:
        return 0
    stack = [(root, 1)]
    deepest = 0
    while stack:
        node, depth = stack.pop()
        deepest = max(deepest, depth)
        if node.left:
            stack.append((node.left, depth + 1))
        if node.right:
            stack.append((node.right, depth + 1))
    return deepest`,
'显式栈保存节点及其深度，遍历时更新最大深度。时间 O(n)，栈空间 O(h)，h 为树高。',
[[[[1,2,3,null,4]],3],[[[]],0],[[[8]],1],[[[3,null,4,null,5,null,6]],4]],treeScalar),

q('lc-leaf-similar-trees','root1, root2','从左到右依次列出两棵二叉树所有叶节点的值，判断两个值序列是否完全相同。叶节点指左右子树均为空的节点。用例按层序表示每棵树。',
`def solve(root1, root2):
    def leaves(root):
        stack = [root] if root else []
        while stack:
            node = stack.pop()
            if not node.left and not node.right:
                yield node.val
            if node.right:
                stack.append(node.right)
            if node.left:
                stack.append(node.left)
    from itertools import zip_longest
    missing = object()
    return all(a == b for a, b in zip_longest(
        leaves(root1), leaves(root2), fillvalue=missing))`,
'先压右后压左即可按从左到右的顺序产生叶值。把两个序列逐项比较，较短序列用独立哨兵补齐。时间 O(n+m)，空间 O(h₁+h₂)。',
[[[[1,2,3],[9,2,3]],true],[[[1,2,3],[1,3,2]],false],[[[1,2,2],[2]],false],[[[7],[7]],true]],
{driver:`def run_case(args):
    return solve(tree_from(args[0]), tree_from(args[1]))`}),

q('lc-count-good-nodes-in-binary-tree','root','在非空二叉树中，若一个节点的值大于或等于从根到它的路径上所有节点值，该节点计为好节点。返回好节点数，根本身也参与计数。',
`def solve(root):
    count = 0
    stack = [(root, root.val)]
    while stack:
        node, highest = stack.pop()
        count += node.val >= highest
        highest = max(highest, node.val)
        if node.left:
            stack.append((node.left, highest))
        if node.right:
            stack.append((node.right, highest))
    return count`,
'显式栈传递当前路径最大值。每条根路径的状态独立，另一个分支的最大值不会影响当前节点。时间 O(n)，空间 O(h)。',
[[[[3,1,4,3,null,1,5]],4],[[[-3,-4,-2]],2],[[[7]],1],[[[2,2,2]],3]],treeScalar),

q('lc-path-sum-iii','root, targetSum','统计二叉树中节点值之和等于 targetSum 的非空连续向下路径。路径可从任意节点开始，在其任意后代或自身处结束。空树返回 0；不同起止节点分别计数。',
`def solve(root, targetSum):
    counts = {0: 1}
    total = 0
    stack = [(root, 0, False)] if root else []
    while stack:
        node, prefix, leaving = stack.pop()
        if leaving:
            counts[prefix] -= 1
            if counts[prefix] == 0:
                del counts[prefix]
            continue
        prefix += node.val
        total += counts.get(prefix - targetSum, 0)
        counts[prefix] = counts.get(prefix, 0) + 1
        stack.append((node, prefix, True))
        if node.right:
            stack.append((node.right, prefix, False))
        if node.left:
            stack.append((node.left, prefix, False))
    return total`,
'用当前根路径的前缀和频次查询以当前节点结尾的有效路径数。退出节点时撤销频次，避免把不同分支拼成一条路径。平均时间 O(n)，空间 O(h)。',
[[[[1,0,1],1],3],[[[0,0,0],0],5],[[[],0],0],[[[-2,null,-3],-5],1],[[[1,2,3],5],0]],treeScalar),

q('lc-longest-zigzag-path-in-a-binary-tree','root','在非空二叉树的任意节点出发，每次沿一条子边向下，方向在左、右之间交替。返回最长此类路径的边数。单节点路径长度为 0。',
`def solve(root):
    best = 0
    stack = [(root, 0, 0)]
    while stack:
        node, via_left, via_right = stack.pop()
        best = max(best, via_left, via_right)
        if node.left:
            stack.append((node.left, via_right + 1, 0))
        if node.right:
            stack.append((node.right, 0, via_left + 1))
    return best`,
'维护到达节点且最后一步向左、向右的两种长度，向左延长上一条向右的路径，向右同理。时间 O(n)，空间 O(h)。',
[[[[1,null,2,3,null,null,4]],3],[[[1,2,null,3]],1],[[[3]],0],[[[1,2,3,null,4]],2]],treeScalar),

q('lc-lowest-common-ancestor-of-a-binary-tree','root, p, q','树中所有值互异，p 和 q 是树内两个不同节点。返回二者最近公共祖先的节点对象，节点可作为自己的祖先。用例中后两个输入是定位 p、q 的节点值；判题比较实际返回节点的身份和值。',
`def solve(root, p, q):
    parent = {root: None}
    stack = [root]
    while p not in parent or q not in parent:
        node = stack.pop()
        for child in (node.left, node.right):
            if child:
                parent[child] = node
                stack.append(child)
    ancestors = set()
    while p:
        ancestors.add(p)
        p = parent[p]
    while q not in ancestors:
        q = parent[q]
    return q`,
'记录节点到父节点的映射。标记 p 的祖先，从 q 向上遇见的第一个已标记节点即为最近公共祖先。时间 O(n)，空间 O(n)。',
[[[[8,3,12,1,5,10,15],1,5],3],[[[8,3,12,1,5],8,5],8],[[[4,null,9,6],9,6],9],[[[1,2,3],2,3],1]],
{driver:`def run_case(args):
    root = tree_from(args[0])
    by_value = {}
    queue = [root]
    while queue:
        node = queue.pop()
        if node:
            by_value[node.val] = node
            queue.extend((node.left, node.right))
    result = solve(root, by_value[args[1]], by_value[args[2]])
    if result is None or by_value.get(result.val) is not result:
        raise ValueError("请返回原树中的节点")
    return result.val`}),

q('lc-binary-tree-right-side-view','root','从二叉树右侧观察，每层只看到该层最靠右的节点。返回这些节点的值，按自顶向下的顺序排列。空树返回 []。',
`def solve(root):
    from collections import deque
    queue = deque([root]) if root else deque()
    answer = []
    while queue:
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        answer.append(node.val)
    return answer`,
'按层从左到右取出节点，每层最后取出的值来自该层最靠右位置。时间 O(n)，队列空间 O(w)，w 为最大层宽。',
[[[[1,2,3,null,4]],[1,3,4]],[[[]],[]],[[[7]],[7]],[[[1,2,null,3]],[1,2,3]]],treeScalar),

q('lc-maximum-level-sum-of-a-binary-tree','root','给定非空二叉树。根所在层编号为 1。对每层的节点值求和，返回层和最大的层号；多层并列时返回最小层号。',
`def solve(root):
    from collections import deque
    queue = deque([root])
    best_sum = float("-inf")
    level = best_level = 0
    while queue:
        level += 1
        total = 0
        for _ in range(len(queue)):
            node = queue.popleft()
            total += node.val
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        if total > best_sum:
            best_sum, best_level = total, level
    return best_level`,
'逐层 BFS 累加，每次仅在当前层严格优于历史最大时更新以保留较小层号。时间 O(n)，空间 O(w)。',
[[[[5,2,3]],1],[[[-9,-2,-3]],2],[[[0]],1],[[[2,0,1,7]],3]],treeScalar),

q('lc-search-in-a-binary-search-tree','root, val','在节点值互异的二叉搜索树中查找目标值。返回匹配节点本身（保留以它为根的整棵子树），找不到时返回 None。用例将返回子树按层序展示。',
`def solve(root, val):
    while root and root.val != val:
        root = root.left if val < root.val else root.right
    return root`,
'比较目标与当前值，较小就走左子树，较大就走右子树。时间 O(h)，空间 O(1)。',
[[[[5,2,8,1,3],2],[2,1,3]],[[[3,null,7],4],[]],[[[2],2],[2]],[[[6,3,8],8],[8]]],
{driver:`def run_case(args):
    root = tree_from(args[0])
    target = root
    while target and target.val != args[1]:
        target = target.left if args[1] < target.val else target.right
    result = solve(root, args[1])
    if result is not target:
        raise ValueError("返回值应为原树的目标节点或 None")
    return tree_values(result)`}),

q('lc-delete-node-in-a-bst','root, key','从节点值互异的二叉搜索树删除 key 并返回处理后的根节点。若树中没有 key，保留全部原值。结果应保持严格的二叉搜索树性质，允许任意合法树形。判题按中序序列比较节点值。',
`def solve(root, key):
    parent = None
    node = root
    while node and node.val != key:
        parent = node
        node = node.left if key < node.val else node.right
    if not node:
        return root
    if node.left and node.right:
        old = node
        parent, node = node, node.right
        while node.left:
            parent, node = node, node.left
        old.val = node.val
    child = node.left or node.right
    if not parent:
        return child
    if parent.left is node:
        parent.left = child
    else:
        parent.right = child
    return root`,
'有两个孩子时用右子树最小值替换待删值，接着删除这个至多有一个孩子的后继节点。其他情况直接让父节点接替唯一孩子。时间 O(h)，空间 O(1)。',
[[[[8,4,12,2,6,10,14],8],[2,4,6,10,12,14]],[[[2],2],[]],[[[3,2,5],7],[2,3,5]],[[[],1],[]],[[[5,2,null,1],2],[1,5]]],
{driver:`def run_case(args):
    root = solve(tree_from(args[0]), args[1])
    result, stack, seen = [], [], set()
    while root or stack:
        while root:
            if id(root) in seen:
                raise ValueError("节点被重复引用")
            seen.add(id(root))
            stack.append(root)
            root = root.left
        root = stack.pop()
        result.append(root.val)
        root = root.right
    return result`}),

q('lc-keys-and-rooms','rooms','有 n ≥ 1 个房间，编号 0 到 n−1，从房间 0 出发。rooms[i] 列出进入房间 i 后能获得的钥匙，每把钥匙可以打开对应编号的房间。判断能否访问所有房间。',
`def solve(rooms):
    seen = {0}
    stack = [0]
    while stack:
        for room in rooms[stack.pop()]:
            if room not in seen:
                seen.add(room)
                stack.append(room)
    return len(seen) == len(rooms)`,
'把房间视作有向图顶点，钥匙视作出边。DFS 得到从 0 可达的所有顶点。时间 O(n+e)，空间 O(n)。',
[[[[[1],[2],[]]],true],[[[[1],[0],[1]]],false],[[[[]]],true],[[[[2,1],[],[0]]],true]]),

q('lc-number-of-provinces','isConnected','给定 n×n 对称的 0/1 矩阵，主对角为 1。isConnected[i][j]=1 表示城市 i、j 直接连通；可经其他城市间接连通。返回连通分量数。',
`def solve(isConnected):
    visited = set()
    count = 0
    for start in range(len(isConnected)):
        if start in visited:
            continue
        count += 1
        visited.add(start)
        stack = [start]
        while stack:
            node = stack.pop()
            for neighbor, linked in enumerate(isConnected[node]):
                if linked and neighbor not in visited:
                    visited.add(neighbor)
                    stack.append(neighbor)
    return count`,
'每次选择新起点时统计一个分量，并一次遍历完其可达城市。输入为邻接矩阵，每个城市扫描一行，时间 O(n²)，空间 O(n)。',
[[[[[1,0,1],[0,1,0],[1,0,1]]],2],[[[[1]]],1],[[[[1,0],[0,1]]],2],[[[[1,1,0],[1,1,1],[0,1,1]]],1]]),

q('lc-reorder-routes-to-make-all-paths-lead-to-the-city-zero','n, connections','n 座城市的无向连接关系是一棵树。每条边 [u,v] 现有方向是 u 到 v，可以翻转。返回至少翻转多少条边，才能令每个城市都能沿有向道路到达城市 0。',
`def solve(n, connections):
    graph = [[] for _ in range(n)]
    for u, v in connections:
        graph[u].append((v, 1))
        graph[v].append((u, 0))
    answer = 0
    stack = [(0, -1)]
    while stack:
        u, parent = stack.pop()
        for v, outward in graph[u]:
            if v != parent:
                answer += outward
                stack.append((v, u))
    return answer`,
'从 0 按无向关系向外走，原方向正好与遍历方向一致的边必须反转。树中每个城市到根的路径唯一，这些翻转也充分。时间和空间 O(n)。',
[[[4,[[0,1],[2,1],[2,3]]],2],[[3,[[1,0],[2,0]]],0],[[3,[[0,1],[1,2]]],2],[[2,[[1,0]]],0]]),

q('lc-evaluate-division','equations, values, queries','equations[i]=[a,b] 和 values[i] 给出变量比值 a/b，所有已知比值为正且相互一致。对每个查询 [x,y] 返回由已知关系确定的 x/y，变量未知或比值无法推出时填 -1.0。查询已知变量除以自身得 1.0。',
`def solve(equations, values, queries):
    from collections import defaultdict
    graph = defaultdict(list)
    for (a, b), ratio in zip(equations, values):
        graph[a].append((b, ratio))
        graph[b].append((a, 1 / ratio))
    def evaluate(a, b):
        if a not in graph or b not in graph:
            return -1.0
        stack, seen = [(a, 1.0)], {a}
        while stack:
            u, product = stack.pop()
            if u == b:
                return product
            for v, ratio in graph[u]:
                if v not in seen:
                    seen.add(v)
                    stack.append((v, product * ratio))
        return -1.0
    return [evaluate(a, b) for a, b in queries]`,
'每条边保存正向比值和反向倒数，沿路径乘积即两端的比值。V 个变量、E 条等式、Q 个查询时，总时间 O(E+Q(V+E))，图和搜索空间 O(V+E)。',
[[[[['a','b'],['b','c']],[4,2],[['a','c'],['c','a'],['d','d']]],[8,0.125,-1]],[[[['z','x']],[0.5],[['z','z'],['x','z']]],[1,2]],[[[['p','q'],['a','b']],[3,9],[['p','b'],['a','q']]],[-1,-1]],[[[['a','b']],[1],[['a','b']]],[1]]]),

q('lc-nearest-exit-from-entrance-in-maze','maze, entrance','矩形 maze 是字符列表的列表，"." 可通行，"+" 是墙，entrance 为 [行,列] 且可通行。每步上下左右移动一格，入口以外的可通行边界格均是出口。返回到最近出口的步数，无法到达时返回 -1。',
`def solve(maze, entrance):
    from collections import deque
    rows, cols = len(maze), len(maze[0])
    start = tuple(entrance)
    queue = deque([(start, 0)])
    seen = {start}
    while queue:
        (r, c), distance = queue.popleft()
        if distance and (r in (0, rows-1) or c in (0, cols-1)):
            return distance
        for dr, dc in ((0,1),(1,0),(0,-1),(-1,0)):
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if maze[nr][nc] == "." and (nr, nc) not in seen:
                    seen.add((nr,nc))
                    queue.append(((nr,nc), distance+1))
    return -1`,
'从入口分层 BFS，第一次抵达非入口边界时即达到最少步数。R 行 C 列的时间和空间均为 O(RC)。',
[[[[['+','.','+'],['+','.','.'],['+','+','+']],[0,1]],2],[[[['.']],[0,0]],-1],[[[['.','.']],[0,0]],1],[[[['+','+','+'],['+','.','+'],['+','+','+']],[1,1]],-1]]),

q('lc-rotting-oranges','grid','矩形网格中，0 表示空格，1 表示新鲜橘子，2 表示已腐烂的橘子。每分钟所有在该分钟开始时已经腐烂的橘子同时感染四邻的新鲜橘子。返回全部腐烂所需的最少分钟数；剩有无法感染的橘子时返回 -1。',
`def solve(grid):
    from collections import deque
    queue = deque()
    fresh = minutes = 0
    for r, row in enumerate(grid):
        for c, value in enumerate(row):
            if value == 2:
                queue.append((r,c))
            elif value == 1:
                fresh += 1
    while queue and fresh:
        minutes += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((0,1),(1,0),(0,-1),(-1,0)):
                nr, nc = r+dr, c+dc
                if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr,nc))
    return minutes if fresh == 0 else -1`,
'以所有初始腐烂位置为起点进行多源 BFS。每轮只扩展轮初的队列，剩余新鲜数用于识别不可达位置。时间、空间 O(RC)。',
[[[[[2,1,1,1,2]]],2],[[[[0,2,0]]],0],[[[[2,0,1]]],-1],[[[[1]]],-1],[[[[2,1],[1,1]]],2]]),

q('lc-kth-largest-element-in-an-array','nums, k','在非空整数数组 nums 中找到降序排列后第 k 个位置的值，k 从 1 开始。重复出现的元素各自占一个位置。1 ≤ k ≤ len(nums)。',
`def solve(nums, k):
    import heapq
    heap = []
    for value in nums:
        if len(heap) < k:
            heapq.heappush(heap, value)
        elif value > heap[0]:
            heapq.heapreplace(heap, value)
    return heap[0]`,
'用容量为 k 的最小堆维护目前最大的 k 个元素。最终堆顶就是第 k 大值。时间 O(n log(k+1))，空间 O(k)。',
[[[[7,2,7,3],2],7],[[[-9,-1,-7],3],-9],[[[3],1],3],[[[2,4,6,8],1],8]]),

q('lc-smallest-number-in-infinite-set','','实现 SmallestInfiniteSet 类，初始集合含所有正整数。popSmallest() 取出并返回集合中最小值；addBack(num) 将正整数 num 放回集合（已在集合中则保持原状），无需返回值。用例是一列 [方法名, 可选参数]；每一步记录返回值。',
`class SmallestInfiniteSet:
    def __init__(self):
        self.next_new = 1
        self.returned = []
        self.present = set()

    def popSmallest(self):
        import heapq
        if self.returned:
            value = heapq.heappop(self.returned)
            self.present.remove(value)
            return value
        value = self.next_new
        self.next_new += 1
        return value

    def addBack(self, num):
        import heapq
        if num < self.next_new and num not in self.present:
            heapq.heappush(self.returned, num)
            self.present.add(num)`,
'用指针表示尚未取出的连续后缀，用小顶堆存已归还的旧值、集合去重。堆中有 m 个值时操作最坏 O(log(m+2))，空间 O(m+1)。',
[[[[['popSmallest'],['popSmallest'],['addBack',1],['addBack',1],['popSmallest'],['popSmallest']]],[1,2,null,null,1,3]],[[[['addBack',100],['popSmallest']]],[null,1]],[[[['popSmallest'],['addBack',1],['popSmallest']]],[1,null,1]],[[[['popSmallest'],['popSmallest'],['addBack',2],['addBack',1],['popSmallest'],['popSmallest']]],[1,2,null,null,1,2]]],
{signature:'SmallestInfiniteSet · popSmallest() / addBack(num)',starter:'class SmallestInfiniteSet:\n    def __init__(self):\n        pass\n\n    def popSmallest(self):\n        pass\n\n    def addBack(self, num):\n        pass\n',driver:`def run_case(args):
    obj = SmallestInfiniteSet()
    return [getattr(obj, name)(*params) for name, *params in args[0]]`}),

q('lc-maximum-subsequence-score','nums1, nums2, k','从两个等长的非负整数数组中选相同的 k 个不同下标。分数等于这些位置的 nums1 值之和乘以这些位置的 nums2 最小值。返回最大分数。1 ≤ k ≤ 数组长度。',
`def solve(nums1, nums2, k):
    import heapq
    heap = []
    subtotal = best = 0
    for y, x in sorted(zip(nums2, nums1), reverse=True):
        heapq.heappush(heap, x)
        subtotal += x
        if len(heap) > k:
            subtotal -= heapq.heappop(heap)
        if len(heap) == k:
            best = max(best, subtotal * y)
    return best`,
'以第二数组值从大到小扫描，当前前缀内任意 k 项的最小值都至少为当前 y。最小堆维护前缀内最大的 k 项 nums1 之和；当扫描至最优解的最小 y 时一定能取得其分数。排序主导时间 O(n log n)，空间 O(n)。',
[[[[5,1,3],[2,10,4],2],16],[[[0,4],[0,2],1],8],[[[1,4,5],[7,7,7],2],63],[[[2,3],[4,6],2],20]]),

q('lc-total-cost-to-hire-k-workers','costs, k, candidates','雇佣 k 人，每轮可从剩余工人中最前 candidates 位或最后 candidates 位选择一人。选费用最低者，平局选原下标最小者。删除选中人员后重新确定首尾范围。两个范围可重叠。返回费用总和。k 和 candidates 均在 1 到工人数之间。',
`def solve(costs, k, candidates):
    import heapq
    left, right = 0, len(costs) - 1
    heap = []
    for _ in range(candidates):
        if left > right:
            break
        heapq.heappush(heap, (costs[left], left, 0))
        left += 1
    for _ in range(candidates):
        if left > right:
            break
        heapq.heappush(heap, (costs[right], right, 1))
        right -= 1
    total = 0
    for _ in range(k):
        cost, _, side = heapq.heappop(heap)
        total += cost
        if left <= right:
            if side == 0:
                heapq.heappush(heap, (costs[left], left, 0))
                left += 1
            else:
                heapq.heappush(heap, (costs[right], right, 1))
                right -= 1
    return total`,
'把候选人按 (费用,原下标) 排序存入堆，同时记住来自哪一侧。每轮从选中侧补一人。左右指针在区间为空时停止补入，避免重复。c 为 candidates，时间 O((c+k)log(c+1))，空间 O(c)。',
[[[[3,1,8,2,4],3,1],8],[[[2,7,1],2,3],3],[[[5,1,9,5],2,1],6],[[[4],1,1],4],[[[8,2,3,6],4,2],19]]),

q('lc-guess-number-higher-or-lower','n','隐藏的整数位于 [1,n]。调用预置的 guess(x)：x 大于隐藏值时返回 -1，小于隐藏值时返回 1，相等时返回 0。实现 solve(n) 返回隐藏值。样例的第二个参数是判题器设置的隐藏值，solve 仅接收 n。',
`def solve(n):
    low, high = 1, n
    while low <= high:
        mid = (low + high) // 2
        result = guess(mid)
        if result == 0:
            return mid
        if result < 0:
            high = mid - 1
        else:
            low = mid + 1`,
'维护包含答案的闭区间。guess 的返回值指明应丢弃哪一半，命中中点时直接返回。调用次数 O(log(n+1))，额外空间 O(1)。',
[[[10,8],8],[[1,1],1],[[97,1],1],[[100,100],100],[[2147483647,1298765432],1298765432]],
{driver:`def run_case(args):
    global guess
    n, target = args
    def guess(x):
        if type(x) is not int or not 1 <= x <= n:
            raise ValueError("guess 的参数须为区间内整数")
        return (target > x) - (target < x)
    return solve(n)`}),

q('lc-successful-pairs-of-spells-and-potions','spells, potions, success','spells、potions 存放正整数。一个法术和一瓶药水的乘积至少为给定的正整数 success 时配对成功。对于每个法术，统计成功药水的个数，按原法术顺序返回，重复药水各计一次。',
`def solve(spells, potions, success):
    from bisect import bisect_left
    ordered = sorted(potions)
    answer = []
    for spell in spells:
        needed = (success + spell - 1) // spell
        answer.append(len(ordered) - bisect_left(ordered, needed))
    return answer`,
'把乘积条件化为药水值至少为 success/spell 的上取整。排序后用二分定位第一个合格值。m 瓶药水、n 个法术的时间 O((m+n)log(m+1))，除结果外空间 O(m)。',
[[[[2,5,1],[1,3,3,6],6],[3,3,1]],[[[1],[1],2],[0]],[[[3,2],[2,2,2],5],[3,0]],[[[100000],[100000],10000000000],[1]]]),

q('lc-find-peak-element','nums','非空整数数组的相邻值均不相等，数组两端外侧的值视作负无穷。返回任意峰值的下标，即该位置的值严格大于左右邻居。尝试在对数时间内完成。评测接受每个有效峰值的下标。',
`def solve(nums):
    low, high = 0, len(nums) - 1
    while low < high:
        mid = (low + high) // 2
        if nums[mid] < nums[mid + 1]:
            low = mid + 1
        else:
            high = mid
    return low`,
'若中点右侧上升，沿右侧继续前进总会遇到下降或到达边界，因此右半边必有峰；下降时左半边含中点必有峰。时间 O(log n)，空间 O(1)。',
[[[[1,4,1,6,2]],1],[[[9]],0],[[[8,5,3]],0],[[[-5,-3,-1]],2],[[[2,1,4]],0]],
{driver:`def run_case(args):
    return solve(*args)

def accepts(args, actual, expected):
    nums = args[0]
    return (type(actual) is int and 0 <= actual < len(nums)
            and (actual == 0 or nums[actual] > nums[actual - 1])
            and (actual == len(nums) - 1 or nums[actual] > nums[actual + 1]))`,
judgeNote:'期望值展示一种峰值下标，任意满足左右条件的下标均通过。'}),

q('lc-koko-eating-bananas','piles, h','每堆香蕉数量均为正整数。每小时可选一堆，以整数速度 k 吃掉至多 k 根，本小时剩余时间不能用于另一堆。给定 h ≥ 堆数，返回能在 h 小时内吃完的最小正整数速度。',
`def solve(piles, h):
    low, high = 1, max(piles)
    while low < high:
        mid = (low + high) // 2
        hours = sum((pile + mid - 1) // mid for pile in piles)
        if hours <= h:
            high = mid
        else:
            low = mid + 1
    return low`,
'给定速度后，把每堆所需小时数向上取整再求和。速度增加时总小时数单调不增，二分第一个可行速度。最大堆大小为 M，时间 O(n log(M+1))，额外空间 O(1)。',
[[[[5,7,9],8],3],[[[2,9,3],3],9],[[[1,1,1],100],1],[[[11],2],6],[[[1000000000],3],333333334]])
];
