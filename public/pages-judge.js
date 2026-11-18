'use strict';

(() => {
  const workerUrl = new URL('pages-worker.js', document.currentScript?.src || document.baseURI);
  const clock = () => performance.now();

  function canJudge(problem) {
    return Boolean(problem && !problem.requiresTorch && typeof Worker === 'function' && typeof WebAssembly === 'object');
  }

  function execute(task, results) {
    return new Promise(resolve => {
      let worker;
      let timer;
      let running = false;
      let finished = false;
      function finish(status, message) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        worker?.terminate();
        resolve({ status, message });
      }
      try {
        worker = new Worker(workerUrl);
        timer = setTimeout(() => finish('unavailable', 'Python 运行时加载超时，请检查网络后重新提交。'), 120000);
        worker.onmessage = ({ data }) => {
          if (data.type === 'ready') {
            running = true;
            clearTimeout(timer);
            timer = setTimeout(() => finish('time_limit', '本次执行超过 ' + task.limitMs / 1000 + ' 秒。'), task.limitMs);
          } else if (data.type === 'case') {
            results.push(data.result);
          } else if (data.type === 'finish') {
            finish(data.status, data.message);
          }
        };
        worker.onerror = event => finish(running ? 'runtime_error' : 'unavailable', event.message || '浏览器 Python 运行出错，请重新提交。');
        worker.onmessageerror = () => finish('runtime_error', '浏览器读取测试结果失败。');
        worker.postMessage(task);
      } catch (error) {
        finish('unavailable', '浏览器启动 Python 工作线程失败。' + error.message);
      }
    });
  }

  async function run(problem, code) {
    const start = clock();
    const cases = problem?.cases || [];
    const results = [];
    let status, message;
    if (!canJudge(problem) || !cases.length) {
      status = 'unavailable';
      message = problem?.requiresTorch ? '这道 PyTorch 题可在本机版运行。' : '请在支持 WebAssembly 的浏览器中打开含测试用例的练习。';
    } else {
      const stdio = problem.mode === 'stdio';
      const task = {
        stdio, code: String(code), prelude: problem.prelude || '', driver: problem.driver || '',
        limitMs: problem.timeLimitMs || 5000,
        numpy: !!(problem.requiresNumpy || problem.requiresNumPy),
      };
      // 标准输入输出题按用例启动独立解释器，以便每个程序都从全新状态开始。
      const batches = stdio ? cases.map(test => [test]) : [cases];
      for (const batch of batches) {
        const before = results.length;
        ({ status, message } = await execute({ ...task, cases: batch }, results));
        if (status) {
          if (stdio && results.length === before && status !== 'unavailable') {
            results.push({ passed: false, input: batch[0].args, expected: batch[0].expected, actual: '', error: message });
          }
          break;
        }
      }
    }
    const passed = results.filter(result => result.passed).length;
    if (!status) {
      if (results.length !== cases.length || results.some(result => result.error)) status = 'runtime_error';
      else status = passed === cases.length ? 'accepted' : 'wrong_answer';
    }
    return { status, passed, total: cases.length, results, ...(message && { message }), durationMs: Math.round(clock() - start) };
  }

  window.PagesJudge = Object.freeze({ canJudge, run });
})();
