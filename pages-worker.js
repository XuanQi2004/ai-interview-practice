'use strict';

const runtimeDirectory = new URL('vendor/pyodide/0.27.7/', self.location.href);
const limits = { stream: 512 * 1024, result: 2 * 1024 * 1024 };

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

function lines(text) {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').replace(/\n+$/, '');
}

function useStreams(runtime, task) {
  const source = new TextEncoder().encode(task.stdio ? task.cases[0].args[0] : '');
  let offset = 0;
  let bytes = 0;
  let overflow = false;
  const output = [];
  const decoder = new TextDecoder();
  runtime.setStdin({ read(buffer) {
    const n = Math.min(buffer.length, source.length - offset);
    buffer.set(source.subarray(offset, offset + n));
    offset += n;
    return n;
  }});
  function write(buffer, capture) {
    bytes += buffer.byteLength;
    if (bytes > limits.stream) {
      if (!overflow) self.postMessage({ type: 'finish', status: 'runtime_error', message: '程序输出超出容量，请核对返回值和打印内容。' });
      overflow = true;
    } else if (capture) {
      output.push(decoder.decode(buffer, { stream: true }));
    }
    return buffer.length;
  }
  runtime.setStdout({ write: buffer => write(buffer, task.stdio) });
  runtime.setStderr({ write: buffer => write(buffer, false) });
  return () => output.join('') + decoder.decode();
}

self.onmessage = async ({ data: task }) => {
  let started = false;
  const finish = (status, message) => self.postMessage({ type: 'finish', status, message });
  try {
    // 运行时和可选 NumPy 的 URL 均为同源常量。作答作为内存数据直接交给解释器。
    importScripts(new URL('pyodide.js', runtimeDirectory).href);
    const [runtime, runner] = await Promise.all([
      loadPyodide({ indexURL: runtimeDirectory.href }),
      fetch(new URL('pages-runner.py', self.location.href)).then(response => {
        if (!response.ok) throw Error('HTTP ' + response.status + ' pages-runner.py');
        return response.text();
      }),
    ]);
    if (task.numpy || /\bnumpy\b/.test([task.code, task.prelude, task.driver].join('\n'))) {
      await runtime.loadPackage('numpy', { checkIntegrity: false });
    }
    const output = useStreams(runtime, task);
    runtime.runPython(runner);
    const prepare = runtime.globals.get('prepare');
    const functionCase = runtime.globals.get('function_case');
    const stdioCase = runtime.globals.get('stdio_case');
    started = true;
    self.postMessage({ type: 'ready' });
    const preparationError = prepare(JSON.stringify(task));
    if (preparationError) return finish('runtime_error', preparationError);
    let resultBytes = 0;
    for (let i = 0; i < task.cases.length; i++) {
      const test = task.cases[i];
      let passed, actual, error;
      if (task.stdio) {
        error = stdioCase();
        actual = output();
        passed = !error && lines(actual) === lines(test.expected);
      } else {
        const json = functionCase(i);
        resultBytes += json.length;
        if (resultBytes > limits.result) return finish('runtime_error', '返回值超出容量，请核对函数返回的对象。');
        const record = JSON.parse(json);
        actual = record.actual ?? null;
        error = record.error;
        passed = !error && (record.accepted ?? equivalent(actual, test.expected));
      }
      self.postMessage({ type: 'case', result: {
        passed, input: test.args, expected: test.expected, actual, ...(error && { error }),
      }});
      if (task.stdio && error) return finish('runtime_error', error);
    }
    finish();
  } catch (error) {
    const hint = started ? '运行出错。' : '加载浏览器 Python 环境失败，请刷新页面后重试。';
    finish(started ? 'runtime_error' : 'unavailable', hint + '\n' + String(error?.message || error).slice(-3500));
  }
};
