/* GitHub Pages 版的个人进度。数据库按站点目录隔离，备份由用户手动保存。 */
(() => {
  "use strict";

  const directory = new URL(".", document.currentScript?.src || location.href).pathname;
  const databaseName = "interview-coding-lab:progress:" + directory;
  const storeName = "events";
  const format = "interview-coding-lab.progress";
  const eventTypes = new Set(["draft", "study", "review", "external", "submission", "chat", "tutorial-study", "tutorial-chat"]);
  const outcomes = new Set(["accepted", "wrong_answer", "runtime_error", "time_limit", "unavailable"]);
  const reserved = new Set(["__proto__", "constructor", "prototype"]);

  const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const isText = value => typeof value === "string";
  const nonempty = value => isText(value) && value.trim().length > 0;
  const isCount = value => Number.isSafeInteger(value) && value >= 0;

  function ensure(condition, message) {
    if (!condition) throw new Error(message);
  }

  // 保留代码、文本和评测数据本身，所有对象都只接受安全的 JSON 字段。
  function checkJson(value) {
    if (value === null || isText(value) || typeof value === "boolean" || Number.isFinite(value)) return;
    if (Array.isArray(value)) {
      for (const item of value) checkJson(item);
      return;
    }
    ensure(isRecord(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)), "记录需要使用 JSON 数据类型。");
    for (const [key, item] of Object.entries(value)) {
      ensure(!reserved.has(key), "记录含保留字段，请使用平台导出的 JSON 备份。");
      checkJson(item);
    }
  }

  function checkEvent(event) {
    ensure(isRecord(event) && eventTypes.has(event.type), "请选择包含有效练习记录类型的备份。");
    ensure(nonempty(event.id) && nonempty(event.problemId), "每条记录都需要事件 ID 和题目或教程 ID。");
    ensure(isText(event.at) && Number.isFinite(Date.parse(event.at)), "每条记录都需要有效日期。");
    for (const key of ["code", "question", "answer", "excerpt", "sourceTitle", "sourceUrl"]) {
      if (Object.hasOwn(event, key)) ensure(isText(event[key]), "记录文本字段格式有误。");
    }
    if (event.sourceUrl) {
      let url;
      try { url = new URL(event.sourceUrl); } catch { /* 统一显示中文说明。 */ }
      ensure(url && ["https:", "http:"].includes(url.protocol), "出处链接需要使用 HTTP 或 HTTPS 地址。");
    }
    if (Object.hasOwn(event, "checks")) ensure(Array.isArray(event.checks) && event.checks.every(isText), "自评项目需要是字符串列表。");
    switch (event.type) {
      case "draft":
        ensure(isText(event.code), "草稿需要包含代码文本。");
        break;
      case "study":
      case "tutorial-study":
        ensure(typeof event.done === "boolean", "学习记录需要包含布尔型完成状态。");
        break;
      case "external":
        ensure(["new", "review", "done"].includes(event.state), "题单标记需要使用有效的进度状态。");
        break;
      case "review":
        ensure(Array.isArray(event.checks), "自评记录需要包含项目列表。");
        break;
      case "chat":
      case "tutorial-chat":
        ensure(isText(event.question) && isText(event.answer), "讨论记录需要包含问题和回答。");
        break;
      case "submission": {
        const r = event.result;
        ensure(isText(event.code) && isRecord(r) && outcomes.has(r.status), "提交记录需要包含代码与评测结果。");
        ensure(isCount(r.passed) && isCount(r.total) && r.passed <= r.total, "评测用例数量格式有误。");
        ensure(Array.isArray(r.results) && r.results.every(item => isRecord(item) && typeof item.passed === "boolean"), "逐例评测结果格式有误。");
        break;
      }
    }
    return event;
  }

  function sameJson(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && sameJson(a[key], b[key]));
  }

  function storageError(error) {
    switch (error?.name) {
      case "QuotaExceededError": return new Error("浏览器存储空间已满。请导出已有学习记录，释放设备空间后重试。");
      case "SecurityError":
      case "InvalidStateError": return new Error("请在支持 IndexedDB 的浏览器窗口中打开平台，并允许此站点使用本地存储。");
      case "VersionError": return new Error("浏览器中的进度格式版本较新，请刷新平台后重试。");
      default: return error instanceof DOMException ? new Error("浏览器读写学习记录时遇到问题，请重新打开平台后重试。") : error;
    }
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      ensure(window.indexedDB, "请使用支持 IndexedDB 的浏览器打开练习平台。");
      const request = indexedDB.open(databaseName, 1);
      let blocked = false;
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName, { keyPath: "id" });
        }
      };
      request.onblocked = () => {
        blocked = true;
        reject(new Error("请关闭其他仍打开此平台的旧标签页，再重试。"));
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        if (blocked) db.close();
        else resolve(db);
      };
    });
  }

  async function transaction(mode, start) {
    let db;
    try {
      db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        let result, failure;
        const abort = error => {
          if (!failure) {
            failure = error;
            tx.abort();
          }
        };
        tx.oncomplete = () => resolve(result());
        tx.onabort = () => reject(failure || tx.error || new Error("本次保存已取消，可重新尝试。"));
        try { result = start(tx.objectStore(storeName), abort); }
        catch (error) { abort(error); }
      });
    } catch (error) {
      throw storageError(error);
    } finally {
      db?.close();
    }
  }

  async function list() {
    const events = await transaction("readonly", store => {
      const request = store.getAll();
      return () => request.result;
    });
    return events.sort((a,b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id));
  }

  // 同一批记录在一个读写事务中处理。并发标签页按 IndexedDB 的事务顺序合并。
  function merge(events, reuseTime = false) {
    const unique = new Map();
    let skipped = 0;
    for (const event of events) {
      const previous = unique.get(event.id);
      if (previous) {
        ensure(sameJson(previous, event), "备份中同一事件 ID 对应多份内容，请核对备份。");
        skipped++;
      } else unique.set(event.id, event);
    }
    return transaction("readwrite", (store, abort) => {
      const count = store.count();
      let added = 0, first = events[0];
      for (const event of unique.values()) {
        const lookup = store.get(event.id);
        lookup.onsuccess = () => {
          try {
            const previous = lookup.result;
            if (previous) {
              const candidate = reuseTime ? { ...event, at: previous.at } : event;
              ensure(sameJson(previous, candidate), "已有事件 ID 对应其他内容；本次合并已回滚，请核对备份。");
              skipped++;
              if (event === first) first = previous;
            } else {
              store.add(event);
              added++;
            }
          } catch (error) { abort(error); }
        };
      }
      return () => ({ first, added, skipped, total: count.result + added });
    });
  }

  async function append(data) {
    ensure(isRecord(data), "请提供练习记录对象。");
    checkJson(data);
    const event = checkEvent({
      ...structuredClone(data),
      id: data.id ?? crypto.randomUUID(),
      at: data.at ?? new Date().toISOString(),
    });
    return (await merge([event], data.at == null)).first;
  }

  async function exportProgress() {
    const events = await list();
    const exportedAt = new Date().toISOString();
    const backup = { format, version: 1, exportedAt, events };
    const filename = "面试练习进度-" + exportedAt.replace(/[:.]/g, "-") + ".json";
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    try { anchor.click(); }
    finally {
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return { count: events.length, filename };
  }

  async function importProgress(file) {
    ensure(file && typeof file.text === "function", "请选择学习记录 JSON 文件。");
    let payload;
    try { payload = JSON.parse((await file.text()).replace(/^\uFEFF/, "")); }
    catch { throw new Error("读取 JSON 备份失败，请选择完整的学习记录文件。"); }
    checkJson(payload);
    let events;
    if (Array.isArray(payload)) events = payload;
    else if (isRecord(payload) && Object.hasOwn(payload, "format")) {
      ensure(payload.format === format && payload.version === 1, "请选择本平台支持的进度备份版本。");
      events = payload.events;
    } else if (isRecord(payload) && Array.isArray(payload.events)) events = payload.events;
    else if (isRecord(payload) && payload.id && payload.type) events = [payload];
    ensure(Array.isArray(events), "备份需要包含 events 数组或一条完整的事件记录。");
    events.forEach(checkEvent);
    const { added, skipped, total } = await merge(events);
    return { added, skipped, total };
  }

  window.PagesProgress = Object.freeze({ list, append, exportProgress, importProgress });
})();
