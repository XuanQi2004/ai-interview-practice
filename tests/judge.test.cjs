const test = require('node:test');
const assert = require('node:assert/strict');
const { judge, pythonCommand } = require('../server/judge.cjs');

const double = { cases: [{ args: [3], expected: 6 }, { args: [0], expected: 0 }] };

test('作答中的日志、原地修改和小幅浮点误差均能正确处理', async () => {
  const problem = { cases: [{ args: [[1, 2]], expected: { values: [1.5, 2.5] } }] };
  const result = await judge(problem, [
    'def solve(values):',
    '    print("调试信息")',
    '    values[:] = [v + 0.50000001 for v in values]',
    '    return {"values": values}',
  ].join('\n'));
  assert.equal(result.status, 'accepted');
  assert.equal(result.passed, 1);
  assert.deepEqual(result.results[0].input, [[1, 2]]);
});

test('用例能区分布尔值和整数，并精确比较整数答案', async () => {
  const result = await judge({ cases: [
    { args: [true], expected: 1 },
    { args: [1000000], expected: 1000001 },
  ] }, 'def solve(x): return x');
  assert.equal(result.status, 'wrong_answer');
  assert.equal(result.passed, 0);
  assert.equal(result.total, 2);
});

test('模块题通过指定的测试入口测量实现', async () => {
  const result = await judge({
    ...double, driver: 'def run_case(args): return Multiplier()(args[0])',
  }, 'class Multiplier:\n    def __call__(self, x): return 2*x');
  assert.equal(result.status, 'accepted');
});

test('逐例记录异常，保留同一次提交中其余通过的结果', async () => {
  const result = await judge(double, 'def solve(x):\n    if not x: raise ValueError("输入为零")\n    return 2*x');
  assert.equal(result.status, 'runtime_error');
  assert.equal(result.passed, 1);
  assert.match(result.results[1].error, /输入为零/);
});

test('语法错误含作答行号，非有限返回值记录为错误', async () => {
  const badSyntax = await judge(double, 'def solve(:');
  assert.equal(badSyntax.status, 'runtime_error');
  assert.match(badSyntax.message, /SyntaxError/);
  const nan = await judge(double, 'def solve(x): return float("nan")');
  assert.equal(nan.status, 'runtime_error');
  assert.equal(nan.passed, 0);
});

test('超时会终止本次作答', async () => {
  const result = await judge({ ...double, timeLimitMs: 400 }, 'def solve(x):\n    while True: pass');
  assert.equal(result.status, 'time_limit');
  assert.equal(result.total, 2);
});

test('标准输入输出题逐例独立执行，兼容 CRLF 和行末空白', async () => {
  const cases = [
    { args: ['2\n1 2\n'], expected: '总和\r\n3\r\n' },
    { args: ['3\n4 5 6\n'], expected: '总和\n15' },
  ];
  const code = [
    'import sys',
    'from pathlib import Path',
    'assert not Path("seen").exists()',
    'Path("seen").touch()',
    'n = int(input())',
    'values = list(map(int, sys.stdin.readline().split()))',
    'assert len(values) == n',
    'print("诊断信息", file=sys.stderr)',
    'print("总和  ")',
    'print(sum(values), end="  \\n\\n")',
  ].join('\n');
  const result = await judge({ mode: 'stdio', cases }, code);
  assert.equal(result.status, 'accepted', JSON.stringify(result));
  assert.equal(result.passed, 2);
});

test('标准输出的行序和行首缩进影响判断', async () => {
  const result = await judge({ mode: 'stdio', cases: [
    { args: [''], expected: '乙\n  甲' }, { args: [''], expected: '甲\n乙' },
  ] }, 'print("  甲\\n乙")');
  assert.equal(result.status, 'wrong_answer');
  assert.equal(result.passed, 0);
  assert.equal(result.results.length, 2);
});

test('标准输入输出题报告运行错误、超时及过量输出', async () => {
  const problem = { mode: 'stdio', timeLimitMs: 500, cases: [{ args: [''], expected: '' }] };
  const [crash, slow, loud] = await Promise.all([
    judge(problem, 'raise ValueError("读取失败")'),
    judge(problem, 'while True: pass'),
    judge(problem, 'print("x" * 600000)'),
  ]);
  assert.equal(crash.status, 'runtime_error');
  assert.match(crash.results[0].error, /读取失败/);
  assert.equal(slow.status, 'time_limit');
  assert.equal(loud.status, 'runtime_error');
  assert.match(loud.message, /输出超出容量/);
});

test('解释器不可用时返回环境信息', async () => {
  const previous = process.env.INTERVIEW_PYTHON;
  process.env.INTERVIEW_PYTHON = 'interview-python-path-that-does-not-exist';
  try {
    assert.equal(pythonCommand(), process.env.INTERVIEW_PYTHON);
    const result = await judge(double, 'def solve(x): return 2*x');
    assert.equal(result.status, 'unavailable');
    assert.match(result.message, /INTERVIEW_PYTHON/);
  } finally {
    if (previous === undefined) delete process.env.INTERVIEW_PYTHON;
    else process.env.INTERVIEW_PYTHON = previous;
  }
});

test('多解题保留实际输出，接受其他合法解，并用作答前的输入校验', async () => {
  const problem = {
    cases: [{ args: [[2, 7, 11]], expected: 2 }],
    driver: [
      'def run_case(args): return solve(*args)',
      'def accepts(args, actual, expected): return actual in args[0]',
    ].join('\n'),
  };
  const correct = await judge(problem, 'def solve(nums):\n    return nums.pop()');
  assert.equal(correct.status, 'accepted');
  assert.equal(correct.results[0].actual, 11);
  assert.equal(correct.results[0].expected, 2);
  const bad = await judge(problem, 'def solve(nums):\n    nums.append(-1)\n    return -1');
  assert.equal(bad.status, 'wrong_answer');
});
