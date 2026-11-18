'use strict';

const path = require('node:path');
const fs = require('node:fs/promises');

const version = '0.27.7';
const distribution = 'https://cdn.jsdelivr.net/pyodide/v' + version + '/full/';
const destination = path.resolve(process.argv[2] || path.join(__dirname, '../public/vendor/pyodide', version));
const files = new Map([
  ...['pyodide.js', 'pyodide.js.map', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip',
    'pyodide-lock.json', 'numpy-2.0.2-cp312-cp312-pyodide_2024_0_wasm32.whl'].map(name => [name, distribution + name]),
  ['LICENSE-Pyodide.md', 'https://raw.githubusercontent.com/pyodide/pyodide/0.27.7/LICENSE'],
  ['LICENSE-CPython.md', 'https://raw.githubusercontent.com/python/cpython/v3.12.7/LICENSE'],
  ['LICENSE-Emscripten.md', 'https://raw.githubusercontent.com/emscripten-core/emscripten/3.1.58/LICENSE'],
  ['LICENSE-NumPy.md', 'https://raw.githubusercontent.com/numpy/numpy/v2.0.2/LICENSE.txt'],
]);

async function download([name, url]) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw Error(name + ' HTTP ' + response.status);
      const content = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(path.join(destination, name), content);
      return;
    } catch (error) {
      if (attempt >= 2) throw error;
    }
  }
}

(async () => {
  await fs.mkdir(destination, { recursive: true });
  await Promise.all([...files].map(download));
  await fs.writeFile(path.join(destination, 'SOURCES.md'), [
    '# 浏览器 Python 运行时', '',
    '本站使用 Pyodide 0.27.7、CPython 3.12.7 与 NumPy 2.0.2。上述文件来自固定版本的官方构建，软件许可随文件一同发布。', '',
    '[Pyodide 源码](https://github.com/pyodide/pyodide/tree/0.27.7) · [部署文档](https://pyodide.org/en/0.27.7/usage/downloading-and-deploying.html) · [CPython 源码](https://github.com/python/cpython/tree/v3.12.7) · [NumPy 源码](https://github.com/numpy/numpy/tree/v2.0.2)', '',
    '[Pyodide 许可](LICENSE-Pyodide.md) · [CPython 许可](LICENSE-CPython.md) · [Emscripten 许可](LICENSE-Emscripten.md) · [NumPy 许可](LICENSE-NumPy.md)', '',
  ].join('\n'));
  console.log('同源 Python 与 NumPy 运行时已写入 ' + destination);
})().catch(error => { console.error(error); process.exitCode = 1; });
