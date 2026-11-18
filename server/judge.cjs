const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');

// 单独保留结果管道，并把作答中的 print 和库的日志统一送到诊断流。
const RUNNER = String.raw`
import copy
import json
import os
import sys
import traceback
from types import ModuleType

result_stream = os.fdopen(os.dup(1), "w", encoding="utf-8", buffering=1)
os.dup2(2, 1)
task = json.load(sys.stdin)

def emit(record):
    result_stream.write(json.dumps(record, ensure_ascii=True, allow_nan=False) + "\n")

def error_text():
    return traceback.format_exc(limit=6)[-3500:]

def main():
    if sys.platform.startswith("linux"):
        import resource
        limit = (16 if task["requiresTorch"] else 1) * 1024**3
        _, hard = resource.getrlimit(resource.RLIMIT_AS)
        soft = min(limit, hard) if hard != resource.RLIM_INFINITY else limit
        resource.setrlimit(resource.RLIMIT_AS, (soft, hard))

    if task["requiresTorch"]:
        try:
            import torch
            torch.manual_seed(0)
            torch.set_num_threads(1)
        except Exception:
            emit({"status": "unavailable", "error": "当前 Python 环境加载 PyTorch 失败。请在该环境安装 torch，或将 INTERVIEW_PYTHON 指向已有 PyTorch 的解释器。\n" + error_text()})
            return

    module = ModuleType("submission")
    sys.modules[module.__name__] = module
    namespace = module.__dict__
    try:
        if task.get("prelude"):
            exec(compile(task["prelude"], "<题目提供的类型>", "exec"), namespace)
        exec(compile(task["code"], "<作答代码>", "exec"), namespace)
        accepts = None
        if task["driver"]:
            # 仅题目提供的评测适配器可以指定多解比较函数。
            namespace.pop("accepts", None)
            exec(compile(task["driver"], "<题目测试入口>", "exec"), namespace)
            run = namespace["run_case"]
            accepts = namespace.get("accepts")
        else:
            solve = namespace["solve"]
            run = lambda args: solve(*args)
    except BaseException:
        emit({"status": "runtime_error", "error": error_text()})
        return

    for case in task["cases"]:
        try:
            args = case["args"]
            actual = run(copy.deepcopy(args) if accepts else args)
            record = {"actual": actual}
            if accepts:
                record["accepted"] = bool(accepts(args, actual, case["expected"]))
            emit(record)
        except BaseException:
            emit({"error": error_text()})
    emit({"status": "done"})

main()
`;

const OUTPUT_LIMIT = 512 * 1024;
const CASE_RESULT_LIMIT = 2 * 1024 * 1024;

function equivalent(actual, expected) {
  if (actual === expected) return true;
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
    if (Number.isInteger(actual) && Number.isInteger(expected)) return false;
    return Math.abs(actual - expected) <= 1e-6 + 1e-5 * Math.abs(expected);
  }
  if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object') return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(expected);
  return keys.length === Object.keys(actual).length &&
    keys.every(key => Object.hasOwn(actual, key) && equivalent(actual[key], expected[key]));
}

function stopProcessGroup(child) {
  if (!child.pid) return;
  try {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore', windowsHide: true,
      });
      killer.on('error', () => child.kill('SIGKILL'));
      killer.on('close', code => { if (code) child.kill('SIGKILL'); });
    } else process.kill(-child.pid, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ESRCH') child.kill('SIGKILL');
  }
}

function pythonCommand() {
  const override = process.env.INTERVIEW_PYTHON;
  if (override) return override.includes(path.sep) || override.includes('/') ? path.resolve(override) : override;
  const local = path.join(__dirname, '..', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  if (existsSync(local)) return local;
  return process.platform === 'win32' ? 'python' : 'python3';
}

function executePython({ args, input, directory, limitMs, stdoutLimit }) {
  const interpreter = pythonCommand();
  // 采用用户选择的解释器，练习代码不继承服务的 GitHub/Codex 环境凭据。
  const env = {
    PATH: process.env.PATH, HOME: directory, TMPDIR: directory, TEMP: directory, TMP: directory,
    LANG: 'en_US.UTF-8', OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1', MKL_NUM_THREADS: '1',
    CUDA_VISIBLE_DEVICES: '', ...(process.env.SystemRoot && { SystemRoot: process.env.SystemRoot }),
  };
  return new Promise(resolve => {
    const child = spawn(interpreter, ['-I', '-B', '-u', '-X', 'utf8', ...args], {
      cwd: directory, env, detached: process.platform !== 'win32', stdio: 'pipe',
    });
    const stdout = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let diagnostic = '';
    let status;
    let message;
    const fail = (kind, text) => {
      if (status) return;
      status = kind;
      message = text;
      stopProcessGroup(child);
    };
    const timer = setTimeout(() => fail('time_limit', `本次执行超过 ${limitMs / 1000} 秒。`), limitMs);
    child.stdout.on('data', chunk => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= stdoutLimit) stdout.push(chunk);
      else fail('runtime_error', '程序输出超出容量，请核对返回值和打印内容。');
    });
    child.stderr.setEncoding('utf8').on('data', chunk => {
      stderrBytes += Buffer.byteLength(chunk);
      diagnostic = (diagnostic + chunk).slice(-3500);
      if (stderrBytes > OUTPUT_LIMIT) fail('runtime_error', '日志超出容量，请减少循环内的打印。');
    });
    child.on('error', error => {
      fail('unavailable', `无法启动 Python 解释器 ${interpreter}。请安装 Python 3 或设置 INTERVIEW_PYTHON。\n${error.message}`);
    });
    child.stdin.on('error', () => {}); // Python 提前退出时，管道会随之关闭。
    if (process.platform !== 'win32') child.once('exit', () => stopProcessGroup(child));
    child.once('close', (exitCode, signal) => {
      clearTimeout(timer);
      if (!status && exitCode !== 0) {
        status = 'runtime_error';
        message = diagnostic.trim() || `Python 进程提前结束（${signal || exitCode}）。`;
      }
      resolve({ status, message, stdout: Buffer.concat(stdout).toString('utf8') });
    });
    child.stdin.end(input);
  });
}

function verdict(results, total, status, message) {
  const passed = results.filter(result => result.passed).length;
  if (!status && results.some(result => result.error)) status = 'runtime_error';
  return {
    status: status || (passed === total ? 'accepted' : 'wrong_answer'),
    passed, total, results, ...(message && { message }),
  };
}

async function runFunctions(problem, code, directory) {
  const execution = await executePython({
    args: ['-c', RUNNER], directory, stdoutLimit: CASE_RESULT_LIMIT,
    limitMs: problem.timeLimitMs || (problem.requiresTorch ? 30000 : 5000),
    input: JSON.stringify({
      code, cases: problem.cases, driver: problem.driver || '', prelude: problem.prelude || '',
      requiresTorch: !!problem.requiresTorch,
    }),
  });
  let { status, message } = execution;
  let done = false;
  const results = [];
  // 每条完整记录以换行结束。进程超时时，保留此前已写完的用例结果。
  for (const line of execution.stdout.split('\n').slice(0, -1)) {
    try {
      const record = JSON.parse(line);
      if (record.status === 'done') done = true;
      else if (record.status) {
        status = record.status;
        message = record.error;
      } else {
        const test = problem.cases[results.length];
        results.push({
          passed: !record.error && (record.accepted ?? equivalent(record.actual, test.expected)),
          input: test.args, expected: test.expected, actual: record.actual ?? null,
          ...(record.error && { error: record.error }),
        });
      }
    } catch {
      status ||= 'runtime_error';
      message ||= '读取判题结果失败。';
      break;
    }
  }
  if (!status && (!done || results.length !== problem.cases.length)) {
    status = 'runtime_error';
    message = 'Python 进程在返回全部测试结果前结束。';
  }
  return verdict(results, problem.cases.length, status, message);
}

function normalizeLines(value) {
  return value.replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').replace(/\n+$/, '');
}

async function runStdio(problem, code, directory) {
  const filename = path.join(directory, 'submission.py');
  await writeFile(filename, code, 'utf8');
  const results = [];
  for (const test of problem.cases) {
    const caseDirectory = await mkdtemp(path.join(directory, 'case-'));
    const { status, message, stdout } = await executePython({
      args: [filename], input: test.args[0], directory: caseDirectory,
      limitMs: problem.timeLimitMs || 5000, stdoutLimit: OUTPUT_LIMIT,
    });
    results.push({
      passed: !status && normalizeLines(stdout) === normalizeLines(test.expected),
      input: test.args, expected: test.expected, actual: status ? stdout.slice(0, 3500) : stdout,
      ...(status && { error: message }),
    });
    if (status) return verdict(results, problem.cases.length, status, message);
  }
  return verdict(results, problem.cases.length);
}

async function judge(problem, code) {
  const start = performance.now();
  let directory;
  let outcome;
  try {
    if (!Array.isArray(problem.cases) || !problem.cases.length) throw Error('该题尚未配置测试用例。');
    directory = await mkdtemp(path.join(tmpdir(), 'interview-practice-'));
    outcome = await (problem.mode === 'stdio' ? runStdio : runFunctions)(problem, code, directory);
  } catch (error) {
    outcome = {
      status: 'unavailable', passed: 0, total: problem.cases?.length || 0, results: [],
      message: `本机判题服务暂时不可用。\n${error.message}`,
    };
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
  return { ...outcome, durationMs: Math.round(performance.now() - start) };
}

module.exports = { judge, pythonCommand };
