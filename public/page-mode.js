/* GitHub Pages 使用静态教材和浏览器数据库。所有请求都是获取公开文件的 GET。 */
(() => {
  "use strict";
  const base = new URL(".", document.currentScript.src);
  const files = { problems: "problems", catalog: "catalog", tutorials: "tutorials", survey: "survey" };
  const loads = new Map();
  let index;

  function content(name) {
    if (!loads.has(name)) {
      const request = fetch(new URL("content/" + files[name] + ".json", base), {
        credentials: "omit", referrerPolicy: "no-referrer",
      }).then(response => {
        if (!response.ok) throw new Error("读取公开教材失败（HTTP " + response.status + "），请刷新重试。");
        return response.json();
      }).catch(error => {
        loads.delete(name);
        throw error;
      });
      loads.set(name, request);
    }
    return loads.get(name);
  }

  async function api(path, body) {
    if (body === undefined && Object.hasOwn(files, path)) return content(path);
    if (path === "events") {
      return body === undefined ? { events: await PagesProgress.list() } : { event: await PagesProgress.append(body) };
    }
    if (path === "status") {
      return {
        python: { available: typeof WebAssembly === "object" && typeof Worker === "function", message: "浏览器 Python · 按需加载 NumPy" },
        codex: { available: false, message: "在本机版使用已登录的 Codex。" }, sync: {},
      };
    }
    if (path === "judge") {
      if (!index) index = new Map((await content("problems")).problems.map(problem => [problem.id, problem]));
      const problem = index.get(body?.problemId);
      if (!problem || typeof body.code !== "string") throw new Error("请选择题目并提供 Python 代码。");
      const result = await PagesJudge.run(problem, body.code);
      return { event: await PagesProgress.append({ type: "submission", problemId: problem.id, code: body.code, result }) };
    }
    throw new Error("请通过本机版使用此功能。");
  }

  window.InterviewPages = Object.freeze({
    api, canJudge: PagesJudge.canJudge,
    importProgress: PagesProgress.importProgress, exportProgress: PagesProgress.exportProgress,
  });
})();
