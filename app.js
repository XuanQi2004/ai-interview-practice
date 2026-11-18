"use strict";

const pages = window.InterviewPages || null;

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const urls = (value) => {
  try {
    const u = new URL(value);
    return /^https?:$/.test(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
};
const link = (label, url) =>
  urls(url)
    ? `<a href="${esc(urls(url))}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
    : esc(label);
const paths = {
  home: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/>',
  catalog:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h1m3 0h6M7 12h1m3 0h6M7 16h1m3 0h6"/>',
  review:
    '<path d="M5 5v5h5M5.3 10a7.5 7.5 0 1 1-.2 5"/><path d="M12 8v4l3 2"/>',
  history: '<path d="M5 3h12l3 3v15H5zM8 8h6m-6 4h8m-8 4h6"/>',
  tutorials: '<path d="M3 6l9-4 9 4-9 4zM6 9v7c4 3 8 3 12 0V9M21 6v9"/>',
  resources:
    '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14"/>',
  sync: '<path d="M4 10a8 8 0 0 1 14-4l2 3m0-5v5h-5M20 14a8 8 0 0 1-14 4l-2-3m0 5v-5h5"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',
  ai: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 3v3m6-3v3m-6 12v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  laptop:
    '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 19h20"/>',
  play: '<path d="m7 4 13 8-13 8z"/>',
  chat: '<path d="M4 4h16v13H9l-5 4z"/>',
  flag: '<path d="M5 21V4m0 1c5-4 9 3 14-1v10c-5 4-9-3-14 1"/>',
  book: '<path d="M6 3h13v18l-6.5-4L6 21z"/>',
  out: '<path d="M13 4h7v7m0-7L10 14M9 6H4v14h14v-5"/>',
};
const icon = (key) =>
  `<svg class="ico" aria-hidden="true" viewBox="0 0 24 24">${paths[key] || ""}</svg>`;
const nav = {
  home: "练习工作台",
  tutorials: "教程库",
  catalog: "算法题单",
  review: "错题复习",
  history: "练习记录",
  resources: "资源调研",
  sync: pages ? "进度备份" : "记录同步",
};
const results = {
  accepted: "已通过",
  wrong_answer: "答案错误",
  runtime_error: "运行错误",
  time_limit: "运行超时",
  unavailable: "运行环境待配置",
};
const types = {
  draft: "保存草稿",
  review: "工程自评",
  study: "学习记录",
  submission: "提交评测",
  chat: "Codex 讨论",
  external: "题单标记",
  "tutorial-study": "教程阅读",
  "tutorial-chat": "教程 GPT 讨论",
};
const states = { new: "未标记", done: "已完成", review: "待复习" };
const progressStates = {
  new: "未练习",
  active: "练习中",
  done: "已完成",
  review: "待复习",
};
const problemsById = new Map();
const catalogById = new Map();
const eventsByProblem = new Map();
const tutorialsById = new Map();
const tutorialsByProblem = new Map();
const tutorialAttachments = new Map();
let selectedPassage = null;
const ui = {
  problems: [],
  items: [],
  tutorials: [],
  tutorialError: "",
  tutorialTrack: "全部",
  tutorialKind: "全部",
  tutorialSearch: "",
  tutorialView: "lessons",
  lessonId: "",
  originProblem: "",
  aiTrack: "全部",
  events: [],
  status: null,
  survey: null,
  page: "home",
  id: "",
  problemTab: "statement",
  from: "",
  cat: "全部",
  search: "",
  collection: "全部",
  externalSearch: "",
  externalState: "全部",
  externalPage: 1,
  reviewAll: false,
  historyFilter: "all",
  backupBusy: false,
  backupMessage: "",
  syncing: false,
  syncMessage: "",
  loadError: "",
  catalogError: "",
  surveyError: "",
  statusError: "",
};
const pendingJudge = new Set(),
  pendingChat = new Set(),
  chatInputs = new Map(),
  failures = new Map(),
  draftTimers = new Map(),
  draftJobs = new Map(),
  workingDrafts = new Map();
const locks = new Set();
const projectPath = pages
  ? new URL(".", document.currentScript?.src || document.baseURI).pathname
  : "";
const PENDING_KEY =
  "interview-room:pending-drafts:v1" + (pages ? ":" + projectPath : "");
function readPending() {
  try {
    const data = JSON.parse(localStorage.getItem(PENDING_KEY) || "{}");
    return new Map(
      Object.entries(data).filter(([, d]) => d && typeof d.code === "string"),
    );
  } catch {
    return new Map();
  }
}
const unsaved = readPending();
function persistPending() {
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify(Object.fromEntries(unsaved)),
    );
  } catch {
    /* Server persistence remains active. */
  }
}
const main = $("#main");
let toastTimer;
function toast(text) {
  $("#toast").textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").textContent = ""), 3800);
}
async function api(path, data) {
  if (pages) return pages.api(path, data);
  const res = await fetch(
    "/api/" + path,
    data === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(body.error || "请求失败（" + res.status + "）");
  return body;
}
function inlineMarkdown(raw) {
  // Limit HTML construction to escaped text, validated links and emphasis.
  const pattern =
    /(`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*\n]+\*\*)/g;
  let html = "",
    last = 0;
  for (const m of String(raw).matchAll(pattern)) {
    html += esc(raw.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("`")) html += "<code>" + esc(t.slice(1, -1)) + "</code>";
    else if (t.startsWith("**"))
      html += "<strong>" + esc(t.slice(2, -2)) + "</strong>";
    else {
      const cut = t.indexOf("](");
      html += link(t.slice(1, cut), t.slice(cut + 2, -1));
    }
    last = m.index + t.length;
  }
  return html + esc(raw.slice(last));
}
function markdown(raw) {
  const lines = String(raw || "")
      .replace(/\r/g, "")
      .split("\n"),
    out = [];
  let i = 0;
  const listType = (s) =>
    /^\s*[-*+]\s+/.test(s) ? "ul" : /^\s*\d+[.)、]\s+/.test(s) ? "ol" : "";
  const cells = (line) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((v) => v.trim());
  const isTable = (n) =>
    n + 1 < lines.length &&
    lines[n].includes("|") &&
    /^\s*\|?\s*:?-{3,}/.test(lines[n + 1]);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]))
        code.push(lines[i++]);
      i++;
      out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(4, heading[1].length + 1);
      out.push(
        "<h" + level + ">" + inlineMarkdown(heading[2]) + "</h" + level + ">",
      );
      i++;
      continue;
    }
    if (isTable(i)) {
      const head = cells(line)
        .map((x) => "<th>" + inlineMarkdown(x) + "</th>")
        .join("");
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim())
        rows.push(
          "<tr>" +
            cells(lines[i++])
              .map((x) => "<td>" + inlineMarkdown(x) + "</td>")
              .join("") +
            "</tr>",
        );
      out.push(
        '<div class="table-wrap"><table><thead><tr>' +
          head +
          "</tr></thead><tbody>" +
          rows.join("") +
          "</tbody></table></div>",
      );
      continue;
    }
    const lt = listType(line);
    if (lt) {
      const items = [];
      while (i < lines.length && listType(lines[i]) === lt)
        items.push(
          "<li>" +
            inlineMarkdown(
              lines[i++].replace(/^\s*(?:[-*+]|\d+[.)、])\s+/, ""),
            ) +
            "</li>",
        );
      out.push("<" + lt + ">" + items.join("") + "</" + lt + ">");
      continue;
    }
    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      i++;
      out.push("<hr>");
      continue;
    }
    const group = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(?:#{1,6}\s|\s*```|\s*---+\s*$)/.test(lines[i]) &&
      !listType(lines[i]) &&
      !isTable(i)
    )
      group.push(lines[i++]);
    out.push("<p>" + group.map(inlineMarkdown).join("<br>") + "</p>");
  }
  return out.join("");
}
function catalogParams() {
  const params = new URLSearchParams();
  if (ui.collection !== "全部") params.set("list", ui.collection);
  if (ui.externalState !== "全部") params.set("status", ui.externalState);
  if (ui.externalSearch) params.set("q", ui.externalSearch);
  if (ui.externalPage > 1) params.set("page", String(ui.externalPage));
  return params;
}
function catalogHash() {
  const query = catalogParams().toString();
  return "#catalog" + (query ? "?" + query : "");
}
function hashWithParams(route, params) {
  const query = params.toString();
  return "#" + route + (query ? "?" + query : "");
}
function homeParams() {
  const params = new URLSearchParams();
  if (ui.cat !== "全部") params.set("cat", ui.cat);
  if (ui.aiTrack !== "全部") params.set("track", ui.aiTrack);
  if (ui.search) params.set("q", ui.search);
  return params;
}
function tutorialParams() {
  const params = new URLSearchParams();
  if (ui.tutorialTrack !== "全部") params.set("track", ui.tutorialTrack);
  if (ui.tutorialKind !== "全部") params.set("kind", ui.tutorialKind);
  if (ui.tutorialSearch) params.set("q", ui.tutorialSearch);
  if (ui.tutorialView === "sources") params.set("view", "sources");
  return params;
}
function T(id, origin = ui.page) {
  const params = tutorialParams();
  if (origin === "history" || origin === "resources")
    params.set("from", origin);
  if (origin === "problem") {
    params.set("from", "problem");
    params.set("pid", ui.id);
  }
  return hashWithParams("tutorial/" + encodeURIComponent(id), params);
}
function H(id, from = ui.page) {
  const params =
    from === "catalog"
      ? catalogParams()
      : from === "home"
        ? homeParams()
        : from === "tutorial"
          ? tutorialParams()
          : new URLSearchParams();
  if (from === "tutorial") params.set("lesson", ui.id);
  if (["home", "catalog", "review", "history", "tutorial"].includes(from))
    params.set("from", from);
  const query = params.toString();
  return "#problem/" + encodeURIComponent(id) + (query ? "?" + query : "");
}
function catalogStateFromURL(params) {
  const collection = params.get("list");
  ui.collection = ui.items.some((item) =>
    (item.collections || [item.collection]).includes(collection),
  )
    ? collection
    : "全部";
  ui.externalState = Object.hasOwn(progressStates, params.get("status"))
    ? params.get("status")
    : "全部";
  ui.externalSearch = params.get("q") || "";
  ui.externalPage = Math.max(1, parseInt(params.get("page"), 10) || 1);
}
function newest(a, b) {
  return (
    String(b.at || "").localeCompare(String(a.at || "")) ||
    String(b.id).localeCompare(String(a.id))
  );
}
function sorted(data) {
  return data.slice().sort(newest);
}
function eventsFor(id) {
  return eventsByProblem.get(id) || [];
}
function replaceEvents(events) {
  ui.events = sorted(events);
  eventsByProblem.clear();
  for (const event of ui.events) {
    if (!eventsByProblem.has(event.problemId))
      eventsByProblem.set(event.problemId, []);
    eventsByProblem.get(event.problemId).push(event);
  }
}
function last(id, type) {
  return eventsFor(id).find((event) => event.type === type);
}
function addEvent(e) {
  if (!e?.id) return;
  ui.events = sorted([e, ...ui.events.filter((other) => other.id !== e.id)]);
  eventsByProblem.set(
    e.problemId,
    sorted([e, ...eventsFor(e.problemId).filter((other) => other.id !== e.id)]),
  );
}
function shortDate(at) {
  const d = new Date(at);
  return Number.isFinite(+d)
    ? d.toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";
}
function problem(id) {
  return problemsById.get(id);
}
function external(id) {
  return catalogById.get(id);
}
function accepted(id) {
  return eventsFor(id).some(
    (e) => e.type === "submission" && e.result?.status === "accepted",
  );
}
const failed = (result) =>
  ["wrong_answer", "runtime_error", "time_limit"].includes(result?.status);
function externalState(id) {
  return last(id, "external")?.state || "new";
}
function progressOf(id) {
  const events = eventsFor(id);
  const judgment = events.find(
    (e) =>
      e.type === "submission" &&
      (failed(e.result) || e.result?.status === "accepted"),
  );
  const mark = last(id, "external");
  // A fresh manual mark supersedes the previous judgment. Clearing it restores the judgment.
  if (
    mark &&
    mark.state !== "new" &&
    (!judgment || newest(mark, judgment) < 0)
  ) {
    return {
      state: mark.state,
      label: states[mark.state],
      style: mark.state === "review" ? "warn" : "ok",
    };
  }
  if (judgment) {
    return failed(judgment.result)
      ? { state: "review", label: "待复习", style: "warn" }
      : { state: "done", label: "已通过", style: "ok" };
  }
  if (last(id, "study")?.done)
    return { state: "active", label: "已学习", style: "ok" };
  if (
    events.some(
      (e) => e.type !== "external" && !e.type.startsWith("tutorial-"),
    ) ||
    unsaved.has(id)
  )
    return { state: "active", label: "练习中", style: "" };
  return { state: "new", label: "未练习", style: "" };
}
function needsReview(id) {
  return progressOf(id).state === "review";
}
function reviewHistory(id) {
  return eventsFor(id).some(
    (e) =>
      (e.type === "submission" && failed(e.result)) ||
      (e.type === "external" && e.state === "review"),
  );
}
function statusFor(p) {
  const { label, style } = progressOf(p.id);
  return [label, style];
}
function focusedProblems() {
  return ui.problems.filter((p) => !p.catalogExercise);
}
function statusPill(label, cls = "") {
  return (
    '<span class="state ' +
    cls +
    '"><span class="dot"></span>' +
    esc(label) +
    "</span>"
  );
}
function difficulty(value) {
  const v = String(value || "");
  const cls = /hard|困难|高阶|进阶/i.test(v)
    ? "hard"
    : /medium|中等|中级/i.test(v)
      ? "medium"
      : "";
  return '<span class="difficulty ' + cls + '">' + esc(v || "综合") + "</span>";
}
function titlePage(name, sub = "", extra = "") {
  return (
    '<div class="page-head"><div><h1>' +
    esc(name) +
    "</h1>" +
    (sub ? '<p class="sub">' + esc(sub) + "</p>" : "") +
    "</div>" +
    extra +
    "</div>"
  );
}
function empty(text) {
  return '<div class="empty">' + esc(text) + "</div>";
}
function drawShell() {
  const page =
    ui.page === "tutorial" || (ui.page === "problem" && ui.from === "tutorial")
      ? "tutorials"
      : ui.page === "problem"
        ? ui.from || (problem(ui.id)?.catalogExercise ? "catalog" : "home")
        : ui.page;
  $("#side-nav").innerHTML = Object.entries(nav)
    .map(
      ([key, name]) =>
        `<a class="side-link ${page === key ? "active" : ""}" ${page === key ? 'aria-current="page"' : ""} href="#${key}">${icon(key)}${name}</a>`,
    )
    .join("");
  $("#crumb").textContent =
    ui.page === "problem"
      ? "题目练习"
      : ui.page === "tutorial"
        ? "教程正文"
        : nav[page] || "练习工作台";
  $("#top-sync").innerHTML = icon("sync") + (pages ? "进度备份" : "同步记录");
  $("#storage-location").textContent = pages ? "当前浏览器存储" : "本机存储";
  $("#space-location").textContent = pages ? "浏览器版" : "个人工作空间";
  $("#local-icon").innerHTML = icon("laptop");
  document.title = $("#crumb").textContent + " · 面试练习室";
}
function activeProblem() {
  const ids = ui.events
    .filter(
      (e) =>
        !e.type.startsWith("tutorial-") &&
        (e.type !== "external" || e.state === "review"),
    )
    .map((e) => e.problemId);
  return (
    Array.from(new Set([...unsaved.keys(), ...ids]))
      .map(problem)
      .find((p) => p && progressOf(p.id).state !== "done") ||
    focusedProblems().find((p) => progressOf(p.id).state !== "done") ||
    ui.problems[0]
  );
}
function rows(data) {
  if (!data.length) return empty("当前条件下共有 0 道题。可调整分类或搜索词。");
  return (
    '<div class="table-wrap"><table><thead><tr><th>题目</th><th class="hide-mobile">方向</th><th>难度</th><th>状态</th><th class="next"></th></tr></thead><tbody>' +
    data
      .map((p) => {
        const [s, c] = statusFor(p),
          ai = p.category === "AI 模块";
        return `<tr class="question-row" data-open="${esc(p.id)}"><td><div class="row-title"><span class="topic-icon ${ai ? "ai" : ""}">${icon(ai ? "ai" : "code")}</span><div><a class="title-link" href="${H(p.id)}">${esc(p.title)}</a><div class="row-sub">${esc(p.topic)}</div></div></div></td><td class="hide-mobile">${esc(p.category)}</td><td>${difficulty(p.difficulty)}</td><td>${statusPill(s, c)}</td><td class="next">${icon("right")}</td></tr>`;
      })
      .join("") +
    "</tbody></table></div>"
  );
}
function tracksFor(p) {
  if (p.track) return [p.track];
  const tracks = [
    ...new Set(
      (tutorialsByProblem.get(p.id) || [])
        .map((t) => t.track)
        .filter((track) => track && track !== "学习指南"),
    ),
  ];
  return tracks.length ? tracks : [p.topic].filter(Boolean);
}
function homeRows() {
  const q = ui.search.trim().toLowerCase(),
    filtered = focusedProblems().filter(
      (p) =>
        (ui.cat === "全部" || p.category === ui.cat) &&
        (ui.aiTrack === "全部" || tracksFor(p).includes(ui.aiTrack)) &&
        [p.title, p.topic, p.summary, p.id, ...tracksFor(p)].some((x) =>
          String(x || "")
            .toLowerCase()
            .includes(q),
        ),
    );
  const href = hashWithParams("home", homeParams());
  if (ui.page === "home" && (location.hash || "#home") !== href)
    history.replaceState(history.state, "", href);
  $("#local-rows").innerHTML = rows(filtered);
  $("#local-count").textContent = filtered.length + " 道";
}
function home() {
  const next = activeProblem(),
    wins = ui.problems.filter((p) => accepted(p.id)).length,
    pct = ui.problems.length
      ? Math.round((100 * wins) / ui.problems.length)
      : 0;
  const reviews = ui.problems.filter((p) => needsReview(p.id)).length;
  const ai = focusedProblems().filter((p) => p.category === "AI 模块");
  const trackSelect =
    ui.cat === "AI 模块"
      ? `<select class="compact" id="ai-track" aria-label="AI 实现方向">${selectOptions(
          ["全部", ...new Set(ai.flatMap(tracksFor))].map((v) => [
            v,
            v === "全部" ? "全部 AI 方向" : v,
          ]),
          ui.aiTrack,
        )}</select>`
      : "";
  const hero = next
    ? `<div class="hero"><div class="hero-art"></div><div class="terminal-art" aria-hidden="true">❯_</div><div class="hero-content"><div class="hero-kicker">${icon("flag")}${eventsFor(next.id).length || unsaved.has(next.id) ? "继续练习" : "开始练习"}</div><h2>${esc(next.title)}</h2><div class="hero-tags">${esc(next.category)} · ${esc(next.topic)}</div><a class="button" href="${H(next.id)}">进入练习 ${icon("arrow")}</a></div></div>`
    : empty("题库正在准备中");
  main.innerHTML =
    titlePage(
      "练习工作台",
      pages
        ? "在浏览器中练习算法与 AI 实现，进度自动保存在当前浏览器。"
        : "算法解题与 AI 工程模块手写练习。",
      '<span class="date-label">' +
        icon("calendar") +
        new Date().toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
          weekday: "long",
        }) +
        "</span>",
    ) +
    `<div class="dashboard-cards">${hero}<section class="panel overview"><h2>练习概览</h2><div class="overview-center"><div class="overview-stats"><div class="stat"><span>站内题目</span><strong>${ui.problems.length}</strong></div><div class="stat"><span>累计通过题目</span><strong>${wins}</strong></div><a href="#review" class="stat"><span>待复习题目</span><strong>${reviews}</strong></a></div><div class="donut" style="--percent:${pct}%"><div><strong>${pct}%</strong><span>通过进度</span></div></div></div></section></div><div class="home-learning"><a class="learn-entry" href="#home?cat=AI+%E6%A8%A1%E5%9D%97"><span class="topic-icon ai">${icon("ai")}</span><span><strong>AI 实现练习</strong><small>${ai.length} 道代码题 · 模型训练、推理与 Agent</small></span>${icon("arrow")}</a><a class="learn-entry" href="#tutorials"><span class="topic-icon">${icon("tutorials")}</span><span><strong>教程与原文资料</strong><small>${pages ? "阅读教程、查找原文与配套练习" : "阅读教程、对照源码、与 GPT 讨论"}</small></span>${icon("arrow")}</a></div><a class="catalog-entry" href="#catalog"><span class="topic-icon">${icon("catalog")}</span><span><strong>算法题单</strong><small>LeetCode 75、热题 100、面试经典 150、牛客 TOP101</small></span><span class="catalog-entry-count">${ui.items.length} 道站内练习 ${icon("arrow")}</span></a><section class="panel catalog"><div class="section-head"><h2>专项练习</h2><span id="local-count" class="count"></span></div><div class="filters"><div class="filter-tabs" aria-label="练习方向">${["全部", ...new Set(focusedProblems().map((p) => p.category))].map((c) => `<button type="button" data-cat="${esc(c)}" class="${ui.cat === c ? "on" : ""}" aria-pressed="${ui.cat === c}">${esc(c)}</button>`).join("")}</div>${trackSelect}<label class="search">${icon("search")}<input id="local-search" type="search" placeholder="搜索题目或知识点" aria-label="搜索专项练习" value="${esc(ui.search)}"></label></div><div id="local-rows"></div></section>`;
  homeRows();
}
function selectOptions(values, selected) {
  return values
    .map(
      ([v, label]) =>
        `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(label)}</option>`,
    )
    .join("");
}
function markSelect(p) {
  const mark = externalState(p.id);
  const reapply =
    mark !== "new" && progressOf(p.id).state !== mark
      ? `<button class="reapply-mark" data-reapply="${esc(p.id)}" aria-label="再次将${esc(p.title)}标记为${esc(states[mark])}">重新应用</button>`
      : "";
  return `<div class="mark-actions"><label class="mark-label">手动标记 <select class="compact" data-external="${esc(p.id)}" aria-label="${esc(p.title)}手动标记">${selectOptions(Object.entries(states), mark)}</select></label>${reapply}</div>`;
}
function progressDetails(id) {
  const parts = [];
  const attempt = last(id, "submission");
  if (attempt)
    parts.push("最近评测 · " + (results[attempt.result?.status] || "已提交"));
  if (last(id, "study")?.done) parts.push("已学习");
  const checks = last(id, "review")?.checks;
  if (checks?.length) parts.push("已自评 " + checks.length + " 项");
  return parts.length
    ? '<div class="row-sub">' + esc(parts.join("　")) + "</div>"
    : "";
}
function placementLabel(item, collection) {
  const placement = item?.placements?.[collection];
  if (placement)
    return [
      collection,
      "第 " + placement.position + " 题",
      placement.topic || item.topic,
    ]
      .filter(Boolean)
      .join(" · ");
  return (item?.collections || [item?.collection]).filter(Boolean).join(" · ");
}
function externalRows(data, collection = "全部") {
  if (!data.length)
    return empty("当前条件下共有 0 道题，可调整题单、状态或搜索词。");
  const rows = data.map((item) => {
    const id = item.exerciseId || item.id;
    const href = H(id);
    const groups = [
      item.number ? "#" + item.number : "",
      placementLabel(item, collection),
    ]
      .filter(Boolean)
      .join(" · ");
    const { label, style } = progressOf(id);
    return `<tr><td><div class="external-title"><a href="${esc(href)}">${esc(item.title)}</a></div><div class="row-sub">${esc(groups)}</div><div class="catalog-sources">${link("原题来源", item.url)}${item.urlEn ? " · " + link("英文原题", item.urlEn) : ""}${item.localId && problem(item.localId) ? ' · <a href="' + esc(H(item.localId)) + '">相关变式</a>' : ""}</div></td><td class="hide-mobile">${difficulty(item.difficulty)}</td><td>${statusPill(label, style)}${progressDetails(id)}${markSelect(item)}</td><td><a class="start-problem" aria-label="练习${esc(item.title)}" href="${esc(href)}">练习 ${icon("arrow")}</a></td></tr>`;
  });
  return (
    '<div class="table-wrap"><table class="catalog-table"><thead><tr><th>题目与题单</th><th class="hide-mobile">难度</th><th>进度</th><th>操作</th></tr></thead><tbody>' +
    rows.join("") +
    "</tbody></table></div>"
  );
}
function filterExternal() {
  const q = ui.externalSearch.trim().toLowerCase(),
    perPage = 25;
  const numberQuery = q.match(/^#?(\d+)$/)?.[1];
  const list = ui.items.filter(
    (i) =>
      (ui.collection === "全部" ||
        (i.collections || [i.collection]).includes(ui.collection)) &&
      (ui.externalState === "全部" ||
        progressOf(i.exerciseId || i.id).state === ui.externalState) &&
      (numberQuery
        ? String(i.number || "") === numberQuery
        : [
            i.title,
            i.id,
            ...(ui.collection === "全部"
              ? [
                  i.topic,
                  ...Object.values(i.placements || {}).map((x) => x.topic),
                ]
              : [i.placements?.[ui.collection]?.topic || i.topic]),
          ].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q),
          )),
  );
  if (ui.collection !== "全部") {
    const position = (item) =>
      item.placements?.[ui.collection]?.position ?? Infinity;
    list.sort((a, b) => position(a) - position(b));
  }
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  ui.externalPage = Math.min(pages, ui.externalPage);
  if (ui.page === "catalog" && location.hash !== catalogHash())
    history.replaceState(history.state, "", catalogHash());
  const start = (ui.externalPage - 1) * perPage;
  $("#catalog-count").textContent = list.length + " 道";
  $("#external-rows").innerHTML = externalRows(
    list.slice(start, start + perPage),
    ui.collection,
  );
  $("#pages").innerHTML =
    `<span class="meta">第 ${ui.externalPage} / ${pages} 页</span><div class="align"><button type="button" data-pager="-1" class="button"${ui.externalPage <= 1 ? " disabled" : ""}>上一页</button><button type="button" data-pager="1" class="button"${ui.externalPage >= pages ? " disabled" : ""}>下一页</button></div>`;
}
function catalog() {
  main.innerHTML =
    titlePage(
      "算法题单",
      pages
        ? "在浏览器中编写 Python、运行评测并查看参考答案。每道题都提供本机 Codex 讨论入口。"
        : "逐题在站内编写 Python、提交评测、查看参考答案，或向 Codex 提问。",
    ) +
    (ui.catalogError
      ? '<div class="error-box">' +
        esc(ui.catalogError) +
        ' <button class="plain" data-reload>重新加载</button></div>'
      : "") +
    `<section class="panel wide-panel"><div class="section-head"><h2>算法题目目录</h2><span id="catalog-count" class="count"></span></div><div class="filters"><div class="align"><select id="collection" aria-label="选择题单" class="compact">${selectOptions(
      [
        "全部",
        ...new Set(
          ui.items
            .flatMap((i) => i.collections || [i.collection])
            .filter(Boolean),
        ),
      ].map((v) => [v, v === "全部" ? "全部题单" : v]),
      ui.collection,
    )}</select><select id="external-state" aria-label="筛选练习状态" class="compact">${selectOptions([["全部", "全部状态"], ...Object.entries(progressStates)], ui.externalState)}</select></div><label class="search">${icon("search")}<input type="search" id="external-search" placeholder="搜索题号、题名或知识点" aria-label="搜索题号、题名或知识点" value="${esc(ui.externalSearch)}"></label></div><p class="status-legend">进度采用最近一次有效评测或手动标记。选择「未标记」可清除手动标记，恢复评测状态。</p><div id="external-rows"></div><div class="toolrow pager" id="pages"></div></section>`;
  filterExternal();
}
function reviewPage() {
  const matches = ui.reviewAll ? reviewHistory : needsReview;
  const focused = focusedProblems().filter((p) => matches(p.id));
  const exercises = ui.items.filter((item) =>
    matches(item.exerciseId || item.id),
  );
  main.innerHTML =
    titlePage(
      "错题复习",
      "出现评测错误或手动标记为待复习的题目会在这里汇总。",
    ) +
    `<div class="review-filter"><label class="check-row"><input type="checkbox" id="review-all" ${ui.reviewAll ? "checked" : ""}> 同时显示已经订正的题目</label></div><section class="panel wide-panel"><div class="section-head"><h2>专项练习</h2><span class="count">${focused.length} 道</span></div>${focused.length ? rows(focused) : empty("专项练习的错题会出现在这里。")}</section><section class="panel wide-panel spaced"><div class="section-head"><h2>算法题单</h2><span class="count">${exercises.length} 道</span></div>${exercises.length ? externalRows(exercises) : empty("在算法题单中提交练习或手动标记待复习，即可在这里复盘。")}</section>`;
}
function json(value) {
  if (typeof value === "string") return value;
  if (value === undefined) return "—";
  function format(item, depth) {
    if (item === null || typeof item !== "object") return JSON.stringify(item);
    const isArray = Array.isArray(item);
    const entries = isArray
      ? item.map((child) => format(child, depth + 1))
      : Object.entries(item).map(
          ([key, child]) =>
            JSON.stringify(key) + ": " + format(child, depth + 1),
        );
    const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
    const compact = open + entries.join(", ") + close;
    if (!compact.includes("\n") && compact.length <= 64) return compact;
    const indent = "  ".repeat(depth + 1);
    return (
      open +
      "\n" +
      indent +
      entries.join(",\n" + indent) +
      "\n" +
      "  ".repeat(depth) +
      close
    );
  }
  return format(value, 0);
}
function evSummary(e) {
  switch (e.type) {
    case "submission":
      return (
        (results[e.result?.status] || "评测完成") +
        " · " +
        (e.result?.passed ?? 0) +
        "/" +
        (e.result?.total ?? 0)
      );
    case "tutorial-chat":
    case "chat":
      return e.question || "";
    case "review":
      return "已勾选 " + (e.checks?.length || 0) + " 项";
    case "tutorial-study":
      return e.done ? "已读" : "已标记为未读";
    case "study":
      return e.done ? "已学习" : "已取消学习标记";
    case "external":
      return states[e.state] || "";
    default:
      return "";
  }
}
function historyPage() {
  const data = ui.events.filter((e) =>
    ui.historyFilter === "all"
      ? e.type !== "draft"
      : e.type === ui.historyFilter,
  );
  main.innerHTML =
    titlePage("练习记录", "按时间查看代码提交、自评、教程阅读与讨论。") +
    `<section class="panel wide-panel"><div class="section-head"><h2>时间记录</h2><select id="history-filter" class="compact" aria-label="记录类型">${selectOptions([["all", "全部活动"], ...Object.entries(types)], ui.historyFilter)}</select></div>${
      data.length
        ? data
            .map((e) => {
              const lesson =
                e.type.startsWith("tutorial-") &&
                tutorialsById.get(e.problemId);
              const p = lesson || problem(e.problemId) || external(e.problemId);
              return `<details class="record"><summary><span><strong>${esc(p?.title || e.problemId)}</strong> · ${esc(types[e.type] || e.type)}</span><span class="meta">${esc(shortDate(e.at))}</span></summary><p class="sub">${esc(evSummary(e))}</p>${lesson && e.type === "tutorial-chat" ? chatCitation(e, lesson) : ""}${e.code !== undefined ? '<pre class="code-block">' + esc(e.code) + "</pre>" : ""}${e.type === "submission" ? feedback(e.result, p) : ""}${e.answer ? '<div class="article">' + markdown(e.answer) + "</div>" : ""}${e.checks?.length ? "<ul>" + e.checks.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ul>" : ""}${lesson ? '<a class="button" href="' + esc(T(e.problemId)) + '">打开教程</a>' : problem(e.problemId) ? '<a class="button" href="' + H(e.problemId) + '">打开练习</a>' : p?.url ? link("打开原题", p.url) : ""}</details>`;
            })
            .join("")
        : empty("完成一次练习后，可以在这里查看记录。")
    }</section>`;
}
function errorSlot(key, id) {
  return (
    '<div role="alert" class="error-box" data-error="' +
    key +
    '">' +
    esc(failures.get(key + ":" + id) || "") +
    "</div>"
  );
}
function setFailure(key, id, error) {
  const value = error?.message || String(error || "");
  if (value) failures.set(key + ":" + id, value);
  else failures.delete(key + ":" + id);
  if (["problem", "tutorial"].includes(ui.page) && ui.id === id) {
    const el = $('[data-error="' + key + '"]');
    if (el) el.textContent = value;
  }
}
function latestCode(p) {
  if (unsaved.has(p.id)) return unsaved.get(p.id).code;
  if (workingDrafts.has(p.id)) return workingDrafts.get(p.id);
  return (
    last(p.id, "draft")?.code ??
    last(p.id, "submission")?.code ??
    p.starter ??
    ""
  );
}
function draftChanged(id, code) {
  workingDrafts.set(id, code);
  unsaved.set(id, { code, at: new Date().toISOString() });
  persistPending();
  clearTimeout(draftTimers.get(id));
  draftTimers.set(
    id,
    setTimeout(() => flushDraft(id), 700),
  );
  paintDraft(id);
}
function paintDraft(id) {
  if (ui.page === "problem" && ui.id === id && $("#draft-state"))
    $("#draft-state").textContent = unsaved.has(id)
      ? "正在保存草稿…"
      : last(id, "draft")
        ? pages
          ? "草稿已保存到浏览器"
          : "草稿已保存"
        : pages
          ? "自动保存到当前浏览器"
          : "编辑后自动保存";
}
async function flushDraft(id) {
  clearTimeout(draftTimers.get(id));
  draftTimers.delete(id);
  if (draftJobs.has(id)) return draftJobs.get(id);
  if (!unsaved.has(id)) return;
  const job = (async () => {
    while (unsaved.has(id)) {
      const draft = unsaved.get(id);
      try {
        const { event } = await api("events", {
          type: "draft",
          problemId: id,
          code: draft.code,
        });
        addEvent(event);
        if (unsaved.get(id) === draft) {
          unsaved.delete(id);
          persistPending();
        }
        setFailure("draft", id, "");
      } catch (e) {
        setFailure(
          "draft",
          id,
          "草稿等待写入。" + e.message + "。可点击保存草稿重试。",
        );
        break;
      }
    }
  })();
  draftJobs.set(id, job);
  try {
    await job;
  } finally {
    draftJobs.delete(id);
    paintDraft(id);
    if (
      unsaved.has(id) &&
      ui.page === "problem" &&
      ui.id === id &&
      $("#draft-state")
    )
      $("#draft-state").textContent = "草稿等待写入";
  }
}
function statement(p) {
  const samples = (p.cases || [])
    .slice(0, 2)
    .map(
      (c, i) =>
        `<details class="example"${i === 0 ? " open" : ""}><summary>样例 ${i + 1}</summary><span class="field-label">样例输入</span><pre class="json">${esc(json(p.mode === "stdio" ? (c.stdin ?? c.input ?? c.args?.[0]) : c.args))}</pre><span class="field-label">评测期望</span><pre class="json">${esc(json(c.expected))}</pre></details>`,
    )
    .join("");
  return `<div class="article">${markdown(p.statement || p.summary)}</div>${p.judgeNote ? '<div class="info-block"><h3>判分说明</h3><div class="notice article">' + markdown(p.judgeNote) + "</div></div>" : ""}${p.signature ? '<div class="info-block"><h3>' + (p.mode === "stdio" ? "输入输出约定" : "实现接口") + '</h3><pre class="code-block">' + esc(p.signature) + "</pre></div>" : ""}${samples ? '<div class="info-block"><h3>示例</h3>' + samples + "</div>" : ""}${p.source?.url ? '<div class="info-block support">关联资源 · ' + link(p.source.label || "阅读原文", p.source.url) + "</div>" : ""}`;
}
function problemBody(p) {
  if (ui.problemTab === "submissions") {
    const attempts = ui.events.filter(
      (e) => e.problemId === p.id && e.type === "submission",
    );
    if (!attempts.length)
      return empty("提交评测后，可以在这里回看每次实现和出错的用例。");
    return attempts
      .map(
        (e, i) =>
          `<details class="record"${i === 0 ? " open" : ""}><summary><strong>${esc(results[e.result?.status] || "评测记录")}</strong><span class="meta">${esc(shortDate(e.at))}</span></summary>${feedback(e.result, p)}<p class="field-label">本次提交的代码</p><pre class="code-block">${esc(e.code)}</pre></details>`,
      )
      .join("");
  }
  if (ui.problemTab === "solution")
    return (
      '<h3>参考实现</h3><pre class="code-block spaced">' +
      esc(p.solution) +
      '</pre><div class="info-block"><h3>思路与分析</h3><div class="article">' +
      markdown(p.explanation) +
      "</div></div>"
    );
  if (ui.problemTab === "rubric") {
    const checks = last(p.id, "review")?.checks || [];
    return `<h3>工程自评</h3><p class="support">根据当前实现逐项勾选，修改会自动记录。</p>${(p.rubric || []).map((s, i) => `<label class="check-row"><input type="checkbox" data-rubric="${i}"${checks.includes(s) ? " checked" : ""}> <span>${esc(s)}</span></label>`).join("")}`;
  }
  return statement(p);
}
function feedback(result, p) {
  if (!result) return '<p class="support">提交后查看逐例评测结果。</p>';
  const ok = result.status === "accepted";
  return `<div class="result-status ${ok ? "" : "fail"}"><strong>${esc(results[result.status] || result.status)}</strong> <span class="meta">${esc(result.passed ?? 0)} / ${esc(result.total ?? 0)} 个用例通过${Number.isFinite(result.durationMs) ? " · " + Math.round(result.durationMs) + " ms" : ""}</span></div>${result.message ? '<p class="sub">' + esc(result.message) + "</p>" : ""}${p?.judgeNote ? '<details class="judge-note"><summary>查看本题判分说明</summary><div class="article">' + markdown(p.judgeNote) + "</div></details>" : ""}<div class="result-details">${(
    result.results || []
  )
    .map(
      (r, i) =>
        `<details class="test-case"${!r.passed && !(result.results || []).slice(0, i).some((x) => !x.passed) ? " open" : ""}><summary>用例 ${i + 1} ${statusPill(r.passed ? "通过" : "未通过", r.passed ? "ok" : "warn")}</summary>${[
          [
            "输入",
            p?.mode === "stdio" && Array.isArray(r.input)
              ? r.input[0]
              : r.input,
          ],
          ["评测期望", r.expected],
          ["评测取得的输出", r.actual],
          ["运行信息", r.error],
        ]
          .filter(([, v]) => v !== undefined && v !== null)
          .map(
            ([k, v]) =>
              '<span class="field-label">' +
              k +
              '</span><pre class="json">' +
              esc(json(v)) +
              "</pre>",
          )
          .join("")}</details>`,
    )
    .join("")}</div>`;
}
function chatLog(id, type = "chat") {
  const chats = eventsFor(id)
    .filter((e) => e.type === type)
    .reverse();
  return chats
    .map(
      (e) =>
        `<div class="chat-line"><strong>你 · ${esc(shortDate(e.at))}</strong><p class="question">${esc(e.question)}</p>${e.sourceUrl || e.excerpt ? chatCitation(e, tutorialsById.get(id)) : ""}<div class="answer"><strong>${type === "tutorial-chat" ? "GPT" : "Codex"}</strong><div class="article">${markdown(e.answer)}</div></div></div>`,
    )
    .join("");
}
function updatePracticeProgress(p) {
  const box = $("#problem-progress");
  if (!box || !p) return;
  const { label, style } = progressOf(p.id);
  box.innerHTML = `<div>${statusPill(label, style)}${progressDetails(p.id)}</div>${p.catalogExercise ? markSelect(p) : ""}`;
}
function localEntry(label, primary = false, id = "") {
  const hash = location.hash || "#home";
  return `<a ${id ? 'id="' + id + '"' : ""} class="button ${primary ? "primary" : ""}" href="${esc("http://127.0.0.1:4174/" + hash)}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon("out")}</a>`;
}
function localSetup() {
  return "在本机项目目录运行 <code>npm start</code> 后，打开本机版。";
}
function handoffChat(tutorial) {
  const sourceText = tutorial
    ? "在本机版可结合这篇教程和阅读资料向 GPT 提问。"
    : "本机版可结合题面和本机编辑器中的代码与 Codex 讨论。";
  return `<div class="mode-handoff"><p>${sourceText}${localSetup()}</p><p class="support">可复制当前提问${tutorial ? "和引用片段" : "和代码"}，粘贴到本机版继续。</p><div class="align"><button class="button" type="button" data-copy-discussion>复制讨论内容</button>${localEntry(tutorial ? "在本机讨论这篇教程" : "在本机讨论这道题", true)}</div></div>`;
}
function judgeAction(problem) {
  if (pages && !pages.canJudge(problem)) {
    return `<div class="align"><button class="button" data-copy-code>复制当前代码</button>${localEntry("在本机评测", true, "local-judge")}</div>`;
  }
  const running = pendingJudge.has(problem.id);
  return `<button class="button primary" id="submit-code"${running ? " disabled" : ""}>${icon("play")}${running ? "正在评测…" : pages ? "浏览器评测" : "提交评测"}</button>`;
}
function practice() {
  const p = problem(ui.id);
  if (!p) {
    main.innerHTML =
      titlePage("题目暂未收录") + '<a class="button" href="#home">返回题库</a>';
    return;
  }
  const chat = ui.status?.codex,
    studied = !!last(p.id, "study")?.done,
    tabs = [
      ["statement", "题目"],
      ["solution", "参考答案"],
      ...(p.rubric?.length ? [["rubric", "工程自评"]] : []),
      ["submissions", "提交记录"],
    ];
  const from = ui.from || (p.catalogExercise ? "catalog" : "home");
  const returnHref =
    from === "tutorial" && tutorialsById.has(ui.lessonId)
      ? T(ui.lessonId, "tutorials")
      : from === "catalog"
        ? catalogHash()
        : from === "home"
          ? hashWithParams("home", homeParams())
          : "#" + from;
  const related = tutorialsByProblem.get(p.id) || [];
  const readings = related.length
    ? `<div class="linked-reading"><span>${icon("tutorials")} 配套教程</span>${related.map((t) => '<a href="' + esc(T(t.id)) + '">' + esc(t.title) + "</a>").join("")}</div>`
    : "";
  const number = p.number || external(p.id)?.number;
  const topicLabel =
    p.catalogExercise && ui.from === "catalog" && ui.collection !== "全部"
      ? placementLabel(external(p.id), ui.collection)
      : p.topic;
  main.innerHTML = `<div class="practice-head"><a class="back" href="${esc(returnHref)}">${icon("back")} 返回${esc(from === "tutorial" ? "教程正文" : nav[from])}</a><div class="toolrow"><h1>${esc(p.title)}</h1><label class="check-row small"><input type="checkbox" id="mark-study"${studied ? " checked" : ""}> 已学习</label></div><div class="badges"><span class="badge">${esc(p.category)}</span>${difficulty(p.difficulty)}<span class="meta">${number ? "力扣 #" + esc(number) + " · " : ""}${esc(topicLabel)}</span>${pages ? '<span class="mode-pill">' + (pages.canJudge(p) ? "支持浏览器评测" : "使用本机评测") + "</span>" : ""}</div><div id="problem-progress" class="problem-progress"></div>${readings}</div><div class="practice-grid"><div class="practice-stack"><section class="panel"><div class="tabbar" aria-label="题目内容">${tabs.map(([v, s]) => `<button type="button" data-tab="${v}" aria-pressed="${v === ui.problemTab}" class="${v === ui.problemTab ? "on" : ""}">${s}</button>`).join("")}</div><div class="panel-body" id="problem-body">${problemBody(p)}</div></section></div><div class="practice-stack"><section class="panel"><div class="panel-head"><h2>代码编辑器</h2><span id="draft-state" class="small"></span></div><div class="editor-box"><div class="editor-top"><span>Python${p.requiresTorch ? " · PyTorch" : ""}</span><span>${p.mode === "stdio" ? "标准输入输出" : "函数 / 模块"}</span></div><textarea id="editor" class="editor" aria-label="Python 代码编辑器，Esc 键移出编辑区" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div><div class="toolrow editor-foot"><button class="plain" id="save-draft">保存草稿</button>${judgeAction(p)}</div>${pages && !pages.canJudge(p) ? '<div class="mode-note">这道题使用' + (p.requiresTorch ? " PyTorch" : "本机 Python 环境") + "。这里可以编辑和保存草稿。" + localSetup() + "</div>" : ""}${errorSlot("draft", p.id)}${errorSlot("judge", p.id)}<div class="feedback" aria-live="polite" id="feedback">${feedback(last(p.id, "submission")?.result, p)}</div></section><section class="panel" id="chat"><div class="panel-head"><h2>和 Codex 讨论</h2><span class="small">${pages ? "本机功能" : chat?.available ? "本机已连接" : "本机 Codex"}</span></div><div class="panel-body discussion"><div id="chat-log">${chatLog(p.id)}</div>${chat?.available ? "" : '<p class="notice">' + esc(chat?.message || "可在记录同步页查看本机 Codex 的连接状态。") + "</p>"}<div class="chat-prompts"><button class="prompt" data-prompt="hint">给我一个提示</button><button class="prompt" data-prompt="review">模拟面试官点评</button></div><label class="support" for="question">${pages ? "准备要向本机 Codex 提出的问题。" : "消息会附上本题题面和当前代码。"}</label><textarea id="question" class="chat-input" placeholder="例如：给一个提示，解释如何处理这个边界条件。" aria-label="向 Codex 提问"></textarea>${pages ? handoffChat(false) : `<div class="toolrow"><span class="support" id="chat-status">${pendingChat.has(p.id) ? "Codex 正在回答…" : ""}</span><button class="button" id="ask"${pendingChat.has(p.id) || chat?.available === false ? " disabled" : ""}>${icon("chat")} 发送提问</button></div>`}${errorSlot("chat", p.id)}</div></section></div></div>`;
  updatePracticeProgress(p);
  $("#editor").value = latestCode(p);
  $("#question").value = chatInputs.get(p.id) || "";
  paintDraft(p.id);
}
function isRead(id) {
  return !!last(id, "tutorial-study")?.done;
}

function indexTutorials(tutorials) {
  ui.tutorials = tutorials;
  tutorialsById.clear();
  tutorialsByProblem.clear();
  for (const lesson of tutorials) {
    tutorialsById.set(lesson.id, lesson);
    for (const id of new Set(lesson.problemIds || [])) {
      if (!tutorialsByProblem.has(id)) tutorialsByProblem.set(id, []);
      tutorialsByProblem.get(id).push(lesson);
    }
  }
}
function lessonSources(lesson) {
  return lesson.resources || [];
}
function sourceMatches(source, query) {
  return [
    source.title,
    source.author,
    source.kind,
    source.note,
    source.url,
  ].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(query),
  );
}
function lessonHeaderMatches(lesson, query) {
  return [lesson.title, lesson.track, lesson.summary].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(query),
  );
}
function tutorialCard(lesson) {
  return `<a class="lesson-card" href="${esc(T(lesson.id))}">
    <div class="lesson-card-head"><h3>${esc(lesson.title)}</h3>${icon("right")}</div>
    <p>${esc(lesson.summary)}</p>
    <div class="lesson-card-foot">${statusPill(isRead(lesson.id) ? "已读" : "未读", isRead(lesson.id) ? "ok" : "")}
    <span>${lessonSources(lesson).length} 份资料 · ${(lesson.problemIds || []).length} 道练习</span></div></a>`;
}
function groupBy(items, getKey) {
  const groups = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}
function libraryResults() {
  const q = ui.tutorialSearch.trim().toLowerCase();
  const lessons = ui.tutorials.filter(
    (l) => ui.tutorialTrack === "全部" || l.track === ui.tutorialTrack,
  );
  let html = "",
    count = 0;
  if (ui.tutorialView === "lessons") {
    const filtered = lessons.filter(
      (l) =>
        lessonHeaderMatches(l, q) ||
        lessonSources(l).some((r) => sourceMatches(r, q)),
    );
    count = filtered.length;
    for (const [track, items] of groupBy(filtered, (l) => l.track || "专题")) {
      html += `<section class="library-section"><div class="section-head"><h2>${esc(track)}</h2><span class="count">${items.length} 篇</span></div><div class="lesson-grid">${items.map(tutorialCard).join("")}</div></section>`;
    }
  } else {
    const sources = new Map();
    for (const lesson of lessons) {
      for (const source of lessonSources(lesson)) {
        if (ui.tutorialKind !== "全部" && source.kind !== ui.tutorialKind)
          continue;
        if (!sourceMatches(source, q) && !lessonHeaderMatches(lesson, q))
          continue;
        const key = source.url || source.title;
        if (!sources.has(key)) sources.set(key, { ...source, lessons: [] });
        const refs = sources.get(key).lessons;
        if (!refs.some((l) => l.id === lesson.id)) refs.push(lesson);
      }
    }
    count = sources.size;
    for (const [kind, items] of groupBy(
      [...sources.values()],
      (r) => r.kind || "阅读资料",
    )) {
      html += `<section class="library-section"><div class="section-head"><h2>${esc(kind)}</h2><span class="count">${items.length} 份</span></div><div class="source-list">${items.map((r) => `<article class="source-row"><div class="source-title">${link(r.title, r.url)} ${icon("out")}</div><div class="meta">${esc(r.author)}</div><p>${esc(r.note)}</p><div class="source-lessons"><span>配套教程</span>${r.lessons.map((l) => `<a href="${esc(T(l.id))}">${esc(l.title)}</a>`).join("")}</div></article>`).join("")}</div></section>`;
    }
  }
  $("#library-count").textContent =
    count + (ui.tutorialView === "lessons" ? " 篇教程" : " 份原文");
  $("#library-results").innerHTML =
    html || empty("当前筛选共有 0 项，可更换方向、类型或搜索词。");
  const hash = hashWithParams("tutorials", tutorialParams());
  if (ui.page === "tutorials" && location.hash !== hash)
    history.replaceState(history.state, "", hash);
}
function tutorialLibrary() {
  if (ui.tutorialError) {
    main.innerHTML =
      titlePage("教程库") +
      '<div class="error-box">' +
      esc(ui.tutorialError) +
      ' <button class="plain" data-reload>重新加载</button></div>';
    return;
  }
  const tracks = [
    "全部",
    ...new Set(ui.tutorials.map((t) => t.track).filter(Boolean)),
  ];
  const kinds = [
    "全部",
    ...new Set(
      ui.tutorials
        .flatMap((t) => lessonSources(t).map((r) => r.kind))
        .filter(Boolean),
    ),
  ];
  const sources = ui.tutorialView === "sources";
  main.innerHTML =
    titlePage(
      "教程库",
      "按主题阅读站内教程与原文资料，从教程进入对应的代码练习。",
    ) +
    `<section class="panel wide-panel"><div class="section-head"><div class="filter-tabs" aria-label="内容类型">${[
      ["lessons", "站内教程"],
      ["sources", "原文资料"],
    ]
      .map(
        ([value, title]) =>
          `<button data-library-view="${value}" class="${ui.tutorialView === value ? "on" : ""}" aria-pressed="${ui.tutorialView === value}">${title}</button>`,
      )
      .join("")}</div><span class="count" id="library-count"></span></div>
    <div class="filters"><div class="align"><select class="compact" aria-label="教程方向" id="lesson-track">${selectOptions(
      tracks.map((v) => [v, v === "全部" ? "全部方向" : v]),
      ui.tutorialTrack,
    )}</select>
    ${
      sources
        ? `<select class="compact" aria-label="资料类型" id="source-kind">${selectOptions(
            kinds.map((v) => [v, v === "全部" ? "全部资料类型" : v]),
            ui.tutorialKind,
          )}</select>`
        : ""
    }</div>
    <label class="search library-search">${icon("search")}<input type="search" id="lesson-search" aria-label="搜索教程、作者、项目或资料类型" placeholder="搜索教程、作者、项目或类型" value="${esc(ui.tutorialSearch)}"></label></div>
    <div id="library-results"></div></section>`;
  libraryResults();
}
function chatCitation(event, lesson) {
  const resource = lessonSources(lesson || {}).find(
    (r) => r.url === event.sourceUrl,
  );
  const source = event.sourceUrl
    ? '<p class="citation-source">讨论资料 · ' +
      link(resource?.title || event.sourceUrl, event.sourceUrl) +
      "</p>"
    : "";
  const excerpt = event.excerpt
    ? '<details class="citation-excerpt"><summary>引用片段</summary><blockquote>' +
      esc(event.excerpt) +
      "</blockquote></details>"
    : "";
  return source + excerpt;
}
function contextFor(id) {
  if (!tutorialAttachments.has(id))
    tutorialAttachments.set(id, { sourceUrl: "", excerpt: "" });
  return tutorialAttachments.get(id);
}
function tutorialDiscussion(lesson) {
  const id = lesson.id,
    context = contextFor(id),
    chat = ui.status?.codex;
  return `<section class="panel spaced" id="chat"><div class="panel-head"><h2>和 GPT 讨论</h2><span class="small">${pages ? "本机功能" : chat?.available ? "本机 Codex 已连接" : "本机 Codex"}</span></div>
    <div class="panel-body discussion"><div id="chat-log">${chatLog(id, "tutorial-chat")}</div>
    ${pages || chat?.available ? "" : '<p class="notice">' + esc(chat?.message || "可在记录同步页查看本机 Codex 登录状态。") + "</p>"}
    <p class="support">本机 Codex 提供 GPT 对话，结合本篇教程、阅读指引与本篇讨论历史回答。讨论原文中的细节时，可附上阅读片段。</p>
    <label class="context-field">讨论资料<select class="compact" id="tutorial-source">${selectOptions(
      [
        ["", "本篇教程"],
        ...lessonSources(lesson)
          .filter((r) => urls(r.url))
          .map((r) => [r.url, r.title]),
      ],
      context.sourceUrl,
    )}</select></label>
    <details class="citation-excerpt"${context.excerpt ? " open" : ""}><summary>附上阅读片段</summary><textarea class="chat-input" id="tutorial-excerpt" aria-label="阅读片段" placeholder="粘贴希望 GPT 解释的原文、公式或代码。"></textarea></details>
    <div class="chat-prompts">${(lesson.prompts || []).map((v, i) => `<button class="prompt" data-lesson-prompt="${i}">${esc(v)}</button>`).join("")}</div>
    <label for="question" class="support">向 GPT 提问</label><textarea id="question" class="chat-input" placeholder="输入你想讨论的问题。" aria-label="向 GPT 提问"></textarea>
    ${pages ? handoffChat(true) : `<div class="toolrow"><span id="chat-status" class="support">${pendingChat.has(id) ? "GPT 正在回答…" : ""}</span><button class="button primary" id="ask"${pendingChat.has(id) || chat?.available === false ? " disabled" : ""}>${icon("chat")} 发送提问</button></div>`}${errorSlot("tutorial-chat", id)}</div></section>`;
}
function tutorialPage() {
  const l = tutorialsById.get(ui.id);
  if (!l) {
    main.innerHTML =
      titlePage("教程正文") +
      '<p class="notice">' +
      esc(ui.tutorialError || "这篇教程暂未收录。") +
      '</p><a class="button spaced" href="#tutorials">浏览教程库</a>';
    return;
  }
  const destination =
    ui.from === "resources" || ui.from === "history"
      ? "#" + ui.from
      : ui.from === "problem" && problem(ui.originProblem)
        ? H(ui.originProblem, "tutorials")
        : hashWithParams("tutorials", tutorialParams());
  const label =
    ui.from === "resources"
      ? "资源调研"
      : ui.from === "history"
        ? "练习记录"
        : ui.from === "problem"
          ? "题目练习"
          : "教程库";
  const sources = lessonSources(l),
    linked = (l.problemIds || []).map(problem).filter(Boolean);
  const sourcePanel = sources.length
    ? `<section class="panel" id="tutorial-sources"><div class="panel-head"><h2>原文与阅读指引</h2><span class="count">${sources.length} 份</span></div><div class="panel-body reading-list">${sources.map((r, i) => `<article class="source-row" data-resource-url="${esc(r.url)}"><div class="source-title">${link(r.title, r.url)} ${icon("out")}</div><div class="meta">${esc([r.kind, r.author].filter(Boolean).join(" · "))}</div><p>${esc(r.note)}</p><button class="plain source-discuss" data-source-index="${i}">${icon("chat")} 讨论这份资料</button></article>`).join("")}</div></section>`
    : "";
  const practicePanel = linked.length
    ? `<section class="panel" id="tutorial-practice"><div class="panel-head"><h2>对应练习</h2><span class="count">${linked.length} 道</span></div><div class="related-problems">${linked.map((p) => `<a href="${esc(H(p.id))}"><span><strong>${esc(p.title)}</strong><small>${esc(p.topic)} · ${esc(p.difficulty)}</small></span>${icon("right")}</a>`).join("")}</div></section>`
    : "";
  main.innerHTML = `<div class="practice-head"><a class="back" href="${esc(destination)}">${icon("back")} 返回${label}</a>
    <div class="page-head"><div><p class="lesson-track">${esc(l.track)}</p><h1>${esc(l.title)}</h1><p class="sub">${esc(l.summary)}</p></div><label class="check-row small"><input type="checkbox" id="tutorial-read"${isRead(l.id) ? " checked" : ""}> 已读</label></div>
    <div class="jump-links">${sources.length ? '<button data-lesson-jump="tutorial-sources">原文资料</button>' : ""}${linked.length ? '<button data-lesson-jump="tutorial-practice">对应练习</button>' : ""}<button data-lesson-jump="chat">和 GPT 讨论</button></div></div>
    <div class="tutorial-layout"><article id="tutorial-body" class="panel wide-panel article">${markdown(l.body)}</article><aside class="practice-stack">${practicePanel}${sourcePanel}</aside></div>${tutorialDiscussion(l)}<button id="quote-selection" class="button primary quote-selection" hidden>${icon("chat")} 讨论所选片段</button>`;
  $("#question").value = chatInputs.get(l.id) || "";
  $("#tutorial-excerpt").value = contextFor(l.id).excerpt;
}
let surveyJob;
function resources() {
  main.innerHTML =
    titlePage(
      "资源调研",
      "面向中美 AI 岗位的题库调研、资料对照与本地练习指南。",
    ) +
    `<section class="survey-discuss"><a class="button" href="${esc(T("learn-interview-resources"))}">${icon("chat")} 讨论题库资源调研</a><a class="button" href="${esc(T("learn-worked-examples"))}">${icon("chat")} 讨论手算示例</a></section><section class="panel wide-panel resources"><div id="survey-body"></div></section>`;
  if (ui.survey !== null) {
    const content = $("#survey-body");
    content.innerHTML =
      '<div class="article">' + markdown(ui.survey) + "</div>";
    const headers = [...content.querySelectorAll("h2,h3")];
    headers.forEach((h, i) => (h.id = "survey-section-" + i));
    if (headers.length) {
      const toc = document.createElement("details");
      toc.className = "toc";
      toc.open = true;
      toc.innerHTML =
        "<summary>文章目录</summary><div>" +
        headers
          .map(
            (h, i) =>
              '<button type="button" class="link-button" data-section="' +
              i +
              '">' +
              esc(h.textContent) +
              "</button>",
          )
          .join("") +
        "</div>";
      content.prepend(toc);
    }
    return;
  }
  if (ui.surveyError) {
    $("#survey-body").innerHTML =
      '<div class="error-box">' +
      esc(ui.surveyError) +
      ' <button class="plain" data-survey-retry>重新加载</button></div>';
    return;
  }
  $("#survey-body").textContent = "正在读取资源调研…";
  if (surveyJob) return;
  surveyJob = api("survey")
    .then((v) => {
      ui.survey = v.markdown || "";
    })
    .catch((e) => (ui.surveyError = e.message))
    .finally(() => {
      surveyJob = null;
      if (ui.page === "resources") resources();
    });
}
function backupPanel() {
  const busy = ui.backupBusy ? " disabled" : "";
  return `<section class="panel wide-panel${pages ? "" : " spaced"}"><div class="section-head"><h2>${pages ? "浏览器练习记录" : "JSON 备份与迁移"}</h2><span class="count">${ui.events.length} 条</span></div>
    <p class="sub">Pages 版和本机版共用一种 JSON 备份。导入时按记录 ID 合并，保留两端的新增记录。备份包含草稿、提交、自评、教程已读和讨论。</p>
    <p class="support">${pages ? "在本机版的「记录同步」中导入网页备份，即可把网页练习记录同步到个人私库。" : "导入 Pages 导出的文件后，点击「立即同步」可保存到已配置的个人私库。本机导出的文件也可在 Pages 的「进度备份」中导入。"}</p>
    <div class="backup-tools"><button type="button" id="export-progress" class="button primary"${busy}>导出进度 JSON</button>
    <button type="button" id="choose-progress" class="button"${busy}>合并导入 JSON</button>
    <input id="progress-file" type="file" accept=".json,application/json" hidden>
    <button type="button" id="refresh-progress" class="plain"${busy}>${icon("sync")} 重新读取</button></div>
    <p id="backup-status" role="status" class="backup-status">${esc(ui.backupMessage)}</p></section>`;
}
function pagesBackup() {
  main.innerHTML =
    titlePage(
      "进度备份",
      "网页练习记录保存在当前浏览器。JSON 文件可用于备份，或在另一台电脑上继续练习。",
    ) +
    backupPanel() +
    `<section class="panel wide-panel spaced"><div class="section-head"><h2>评测与讨论</h2></div>
    <p class="sub">支持浏览器评测的题目直接在页面运行 Python。PyTorch 实现和 Codex 讨论使用本机版。${localSetup()}</p>
    <div class="backup-tools">${localEntry("打开本机版")}</div></section>`;
}
async function importBackup(file) {
  if (pages) return pages.importProgress(file);
  let data;
  try {
    data = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
  } catch {
    throw Error("请选择平台导出的有效 JSON 备份文件。");
  }
  return api("backup/import", data);
}
async function exportBackup() {
  if (pages) return pages.exportProgress();
  const data = await api("backup");
  const href = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = href;
  link.download =
    "面试练习进度-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
}
async function transferProgress(action, file) {
  if (ui.backupBusy) return;
  ui.backupBusy = true;
  ui.backupMessage =
    action === "import"
      ? "正在合并记录…"
      : action === "export"
        ? "正在生成备份…"
        : "正在重新读取记录…";
  if (ui.page === "sync") syncPage();
  try {
    await Promise.all([...unsaved.keys()].map(flushDraft));
    let result;
    if (action === "import") result = await importBackup(file);
    if (action === "export") await exportBackup();
    replaceEvents((await api("events")).events || []);
    for (const id of workingDrafts.keys())
      if (!unsaved.has(id)) workingDrafts.delete(id);
    ui.backupMessage =
      action === "import"
        ? `导入完成。新增 ${result.added} 条，已有 ${result.skipped} 条，当前共 ${ui.events.length} 条记录。`
        : action === "export"
          ? "JSON 备份已生成，可在浏览器下载记录中查看。"
          : pages
            ? "已重新读取当前浏览器的练习记录。"
            : "已重新读取本机练习记录。";
    if (unsaved.size)
      ui.backupMessage += " 另有 " + unsaved.size + " 份草稿等待写入。";
  } catch (err) {
    ui.backupMessage = "操作未完成。" + (err.message || String(err));
  } finally {
    ui.backupBusy = false;
    if (ui.page === "sync") syncPage();
    else if (ui.page !== "problem" && ui.page !== "tutorial") render();
    toast(ui.backupMessage);
  }
}
async function copyHandoff(text, label) {
  try {
    if (!navigator.clipboard?.writeText) throw Error();
    await navigator.clipboard.writeText(text);
    toast(label + "已复制。");
  } catch {
    const focused = document.activeElement;
    const area = document.createElement("textarea");
    area.value = text;
    area.className = "copy-buffer";
    document.body.append(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    focused?.focus({ preventScroll: true });
    toast(copied ? label + "已复制。" : "请在编辑框中选中文字并使用系统复制。");
  }
}
function discussionText() {
  const tutorial = ui.page === "tutorial",
    item = tutorial ? tutorialsById.get(ui.id) : problem(ui.id);
  const parts = [item?.title, $("#question")?.value.trim()].filter(Boolean);
  if (tutorial) {
    const ctx = contextFor(ui.id);
    if (ctx.sourceUrl) parts.push("资料：" + ctx.sourceUrl);
    if (ctx.excerpt) parts.push("引用片段：\n" + ctx.excerpt);
  } else if ($("#editor")?.value)
    parts.push("当前代码：\n" + $("#editor").value);
  return parts.join("\n\n");
}
function syncPage() {
  if (pages) {
    pagesBackup();
    return;
  }
  const st = ui.status || {},
    sy = st.sync || {};
  main.innerHTML =
    titlePage(
      "记录同步",
      "将两台电脑的学习记录同步到同一个个人 GitHub 私有仓库。",
    ) +
    `<section class="panel wide-panel"><div class="section-head"><h2>学习记录</h2><button id="sync-now" class="button primary"${ui.syncing ? " disabled" : ""}>${icon("sync")} ${ui.syncing ? "正在同步…" : "立即同步"}</button></div><div class="status-lines"><div class="status-item"><h3>本地存储</h3><p class="sub">已保存 ${ui.events.length} 条记录，包含代码、评测、自评、题单标记、教程阅读与讨论。</p></div><div class="status-item"><h3>个人进度私库</h3><p class="sub">${sy.configured ? esc(sy.remote) + " · " + esc(sy.branch || "interview-progress") + " 分支" : sy.configured === false ? "当前仅保存在本机" : "正在读取本机配置…"}</p><p class="support">${esc(sy.message || (sy.configured === false ? "请用 node server/configure-sync.cjs OWNER/REPO 指定个人进度私库。" : "")).replace("node server/configure-sync.cjs OWNER/REPO", "<code>node server/configure-sync.cjs OWNER/REPO</code>")}</p>${sy.configured === false ? '<p class="support">在项目目录运行上面的命令，将 OWNER/REPO 替换为你的 GitHub 用户名和进度私库名称，然后刷新状态。</p>' : ""}</div><div class="status-item"><h3>上次同步</h3><p class="sub">${sy.lastSyncAt ? esc(new Date(sy.lastSyncAt).toLocaleString("zh-CN")) : "首次同步后显示时间。"}</p></div></div>${ui.syncMessage ? '<p class="notice sync-message" role="status">' + esc(ui.syncMessage) + "</p>" : ""}</section>${backupPanel()}<section class="panel wide-panel spaced"><div class="section-head"><h2>本机环境</h2><button id="refresh-status" class="button">刷新状态</button></div>${ui.statusError ? '<div class="error-box">' + esc(ui.statusError) + "</div>" : ""}<div class="status-lines"><div class="status-item"><h3>Python 评测</h3><p class="sub">${esc(st.python?.message || "正在读取解释器信息…")}</p></div><div class="status-item"><h3>Codex 对话</h3><p class="sub">${esc(st.codex?.message || "正在读取本机登录状态…")}</p></div></div></section>`;
}
async function refreshStatus() {
  try {
    ui.status = await api("status");
    ui.statusError = "";
  } catch (e) {
    ui.statusError = e.message;
  }
  if (ui.page === "sync") syncPage();
  else if (["problem", "tutorial"].includes(ui.page) && $("#ask")) {
    // Avoid resetting focus, selection or another question's code while status loads.
    const el = $("#ask");
    el.disabled =
      ui.status?.codex?.available === false || pendingChat.has(ui.id);
    const box = $("#chat .notice");
    if (box && ui.status?.codex) {
      if (ui.status.codex.available) box.remove();
      else
        box.textContent =
          ui.status.codex.message || "请完成本机 Codex 登录后刷新状态。";
    }
    const label = $("#chat .panel-head .small");
    if (label)
      label.textContent = ui.status?.codex?.available
        ? ui.page === "tutorial"
          ? "本机 Codex 已连接"
          : "本机已连接"
        : "本机 Codex";
  }
}
async function doSync() {
  if (ui.syncing) return;
  ui.syncing = true;
  ui.syncMessage = "";
  syncPage();
  try {
    await Promise.all([...unsaved.keys()].map(flushDraft));
    const out = await api("sync", {});
    replaceEvents((await api("events")).events || []);
    for (const id of workingDrafts.keys())
      if (!unsaved.has(id)) workingDrafts.delete(id);
    ui.syncMessage = out.message || "同步完成。";
    if (unsaved.size)
      ui.syncMessage +=
        " " + unsaved.size + " 份浏览器暂存的草稿仍需保存到本机。";
    await refreshStatus();
    toast(ui.syncMessage);
  } catch (e) {
    ui.syncMessage = e.message;
    toast(e.message);
  } finally {
    ui.syncing = false;
    render();
  }
}
async function submitCode() {
  const p = problem(ui.id);
  if (!p || pendingJudge.has(p.id)) return;
  if (pages && !pages.canJudge(p)) {
    $("#local-judge")?.focus();
    toast("请打开本机版评测这道题。");
    return;
  }
  const id = p.id,
    code = $("#editor").value;
  pendingJudge.add(id);
  const btn = $("#submit-code");
  btn.disabled = true;
  btn.textContent = pages ? "浏览器评测中…" : "正在评测…";
  if (pages)
    $("#feedback").textContent = "正在加载浏览器 Python 环境并运行本题用例…";
  setFailure("judge", id, "");
  try {
    const { event } = await api("judge", { problemId: id, code });
    addEvent(event);
    if (ui.page === "problem" && ui.id === id) {
      $("#feedback").innerHTML = feedback(event.result, p);
      updatePracticeProgress(p);
      if (ui.problemTab === "submissions")
        $("#problem-body").innerHTML = problemBody(p);
    }
    toast(p.title + " · " + (results[event.result?.status] || "评测完成"));
  } catch (e) {
    if (pages && ui.page === "problem" && ui.id === id)
      $("#feedback").innerHTML = feedback(last(id, "submission")?.result, p);
    setFailure("judge", id, e);
    toast(e.message);
  } finally {
    pendingJudge.delete(id);
    if (ui.page === "problem" && ui.id === id) {
      $("#submit-code").disabled = false;
      $("#submit-code").innerHTML =
        icon("play") + (pages ? " 浏览器评测" : " 提交评测");
    } else if (["home", "catalog", "review", "history"].includes(ui.page))
      render();
  }
}
async function ask() {
  const page = ui.page;
  const lesson = page === "tutorial" ? tutorialsById.get(ui.id) : null;
  const item = lesson || problem(ui.id);
  if (!item || pendingChat.has(item.id)) return;
  const id = item.id,
    message = $("#question").value.trim();
  if (!message) {
    $("#question").focus();
    return;
  }
  const kind = lesson ? "tutorial-chat" : "chat",
    name = lesson ? "GPT" : "Codex";
  const context = lesson ? { ...contextFor(id) } : null;
  const payload = lesson
    ? {
        tutorialId: id,
        message,
        ...(context.sourceUrl && { sourceUrl: context.sourceUrl }),
        ...(context.excerpt.trim() && { excerpt: context.excerpt.trim() }),
      }
    : { problemId: id, message, code: $("#editor").value };
  const onPage = () => ui.page === page && ui.id === id;
  pendingChat.add(id);
  $("#ask").disabled = true;
  $("#chat-status").textContent = name + " 正在回答…";
  setFailure(kind, id, "");
  try {
    const { event } = await api(kind, payload);
    addEvent(event);
    if ((chatInputs.get(id) || "").trim() === message) chatInputs.delete(id);
    if (
      lesson &&
      contextFor(id).excerpt === context.excerpt &&
      !chatInputs.get(id)
    )
      contextFor(id).excerpt = "";
    if (onPage()) {
      $("#chat-log").innerHTML = chatLog(id, kind);
      $("#question").value = chatInputs.get(id) || "";
      if (lesson) $("#tutorial-excerpt").value = contextFor(id).excerpt;
    }
    toast(item.title + " · " + name + " 已回复");
  } catch (e) {
    setFailure(kind, id, e);
    toast(e.message);
  } finally {
    pendingChat.delete(id);
    if (onPage()) {
      $("#ask").disabled = ui.status?.codex?.available === false;
      $("#chat-status").textContent = "";
    } else if (ui.page === "history") historyPage();
  }
}
async function record(data, el) {
  const key = data.type + ":" + data.problemId;
  if (locks.has(key)) return;
  locks.add(key);
  const controls =
    data.type === "review"
      ? [...document.querySelectorAll("[data-rubric]")]
      : [el];
  controls.forEach((c) => (c.disabled = true));
  try {
    const { event } = await api("events", data);
    addEvent(event);
    toast("练习记录已保存");
  } catch (e) {
    toast(e.message);
    if (el.isConnected) {
      if (data.type === "external") el.value = externalState(data.problemId);
      if (data.type === "study" || data.type === "tutorial-study")
        el.checked = !!last(data.problemId, data.type)?.done;
      if (data.type === "review")
        $("#problem-body").innerHTML = problemBody(problem(data.problemId));
    }
  } finally {
    locks.delete(key);
    controls.forEach((c) => (c.disabled = false));
    if (ui.page === "tutorials") libraryResults();
    if (ui.page === "catalog") filterExternal();
    if (ui.page === "review") reviewPage();
    if (ui.page === "history") historyPage();
    if (ui.page === "problem" && data.problemId === ui.id)
      updatePracticeProgress(problem(ui.id));
  }
}
function render() {
  drawShell();
  if (ui.loadError) {
    main.innerHTML =
      titlePage("读取练习数据") +
      '<p class="error-box">' +
      esc(ui.loadError) +
      '</p><button class="button spaced" data-reload>重新加载</button>';
    return;
  }
  (
    ({
      home,
      catalog,
      review: reviewPage,
      history: historyPage,
      resources,
      tutorials: tutorialLibrary,
      tutorial: tutorialPage,
      sync: syncPage,
      problem: practice,
    })[ui.page] || home
  )();
}
function readRoute() {
  const old = ui.id;
  const [route, query] = location.hash.slice(1).split("?");
  const parts = route.split("/");
  const params = new URLSearchParams(query);
  ui.from = [
    "home",
    "catalog",
    "review",
    "history",
    "tutorial",
    "resources",
    "problem",
  ].includes(params.get("from"))
    ? params.get("from")
    : "";
  ui.page = Object.hasOwn(nav, parts[0])
    ? parts[0]
    : ["problem", "tutorial"].includes(parts[0])
      ? parts[0]
      : "home";
  try {
    ui.id = ["problem", "tutorial"].includes(ui.page)
      ? decodeURIComponent(parts.slice(1).join("/"))
      : "";
  } catch {
    ui.id = "";
  }
  ui.lessonId = params.get("lesson") || "";
  ui.originProblem = params.get("pid") || "";
  if (ui.page === "home" || (ui.page === "problem" && ui.from === "home")) {
    ui.cat = params.get("cat") || "全部";
    ui.aiTrack = params.get("track") || "全部";
    ui.search = params.get("q") || "";
  }
  if (
    ui.page === "tutorials" ||
    ui.page === "tutorial" ||
    (ui.page === "problem" && ui.from === "tutorial")
  ) {
    ui.tutorialTrack = params.get("track") || "全部";
    ui.tutorialKind = params.get("kind") || "全部";
    ui.tutorialSearch = params.get("q") || "";
    ui.tutorialView = params.get("view") === "sources" ? "sources" : "lessons";
  }
  if (ui.page === "catalog" || (ui.page === "problem" && ui.from === "catalog"))
    catalogStateFromURL(params);
  if (old !== ui.id || ui.page !== "problem") ui.problemTab = "statement";
  if (old && old !== ui.id && unsaved.has(old)) void flushDraft(old);
  render();
  if (ui.page === "home" && ui.cat !== "全部" && $(".catalog"))
    $(".catalog").scrollIntoView({ block: "start" });
  else window.scrollTo(0, 0);
}
async function boot() {
  const settled = await Promise.allSettled([
    api("problems"),
    api("events"),
    api("catalog"),
    api("tutorials"),
  ]);
  const [p, e, c, lessons] = settled;
  if (lessons.status === "fulfilled")
    indexTutorials(lessons.value.tutorials || []);
  else ui.tutorialError = "教程读取失败。" + lessons.reason.message;
  if (p.status === "rejected" || e.status === "rejected")
    ui.loadError = (p.reason || e.reason).message;
  else {
    ui.problems = p.value.problems || [];
    ui.problems.forEach((item) => problemsById.set(item.id, item));
    replaceEvents(e.value.events || []);
  }
  if (c.status === "fulfilled") {
    ui.items = c.value.items || [];
    ui.items.forEach((item) => catalogById.set(item.id, item));
  } else ui.catalogError = c.reason.message;
  readRoute();
  void refreshStatus();
  for (const id of unsaved.keys()) if (problem(id)) void flushDraft(id);
}
main.addEventListener("click", (e) => {
  const el = e.target.closest("button,a,[data-open]");
  if (!el || el.disabled) return;
  if (el.id === "export-progress") {
    void transferProgress("export");
    return;
  }
  if (el.id === "choose-progress") {
    $("#progress-file")?.click();
    return;
  }
  if (el.id === "refresh-progress") {
    void transferProgress("refresh");
    return;
  }
  if (el.hasAttribute("data-copy-code")) {
    void copyHandoff($("#editor").value, "当前代码");
    return;
  }
  if (el.hasAttribute("data-copy-discussion")) {
    void copyHandoff(discussionText(), "讨论内容");
    return;
  }
  if (el.hasAttribute("data-reload")) {
    location.reload();
    return;
  }
  if (el.hasAttribute("data-survey-retry")) {
    ui.surveyError = "";
    resources();
    return;
  }
  if (el.dataset.libraryView) {
    ui.tutorialView = el.dataset.libraryView;
    tutorialLibrary();
    return;
  }
  if (el.id === "quote-selection" && selectedPassage?.id === ui.id) {
    const context = contextFor(ui.id);
    context.excerpt = selectedPassage.text;
    context.sourceUrl = selectedPassage.sourceUrl;
    $("#tutorial-source").value = context.sourceUrl;
    $("#tutorial-excerpt").value = context.excerpt;
    $("#tutorial-excerpt").closest("details").open = true;
    window.getSelection()?.removeAllRanges();
    $("#chat").scrollIntoView({ block: "start" });
    $("#question").focus({ preventScroll: true });
    return;
  }
  if (el.dataset.lessonJump) {
    document
      .getElementById(el.dataset.lessonJump)
      ?.scrollIntoView({ block: "start" });
    return;
  }
  if (el.dataset.sourceIndex !== undefined) {
    const l = tutorialsById.get(ui.id),
      r = lessonSources(l)[Number(el.dataset.sourceIndex)];
    if (r) {
      contextFor(ui.id).sourceUrl = r.url;
      $("#tutorial-source").value = r.url;
      $("#chat").scrollIntoView({ block: "start" });
      $("#question").focus({ preventScroll: true });
    }
    return;
  }
  if (el.dataset.lessonPrompt !== undefined) {
    const prompt = tutorialsById.get(ui.id)?.prompts?.[
      Number(el.dataset.lessonPrompt)
    ];
    if (prompt) {
      const box = $("#question");
      box.value = box.value.trim() ? box.value + "\n" + prompt : prompt;
      chatInputs.set(ui.id, box.value);
      box.focus();
    }
    return;
  }
  if (el.dataset.cat !== undefined) {
    ui.cat = el.dataset.cat;
    ui.aiTrack = "全部";
    home();
    return;
  }
  if (el.dataset.open !== undefined) {
    if (!e.target.closest("a")) location.hash = H(el.dataset.open);
    return;
  }
  if (el.dataset.reapply !== undefined) {
    const problemId = el.dataset.reapply;
    void record(
      { type: "external", problemId, state: externalState(problemId) },
      el,
    );
    return;
  }
  if (el.dataset.pager !== undefined) {
    ui.externalPage += Number(el.dataset.pager);
    filterExternal();
    $("#external-rows").scrollIntoView({ block: "start" });
    return;
  }
  if (el.dataset.tab !== undefined) {
    ui.problemTab = el.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((b) => {
      const on = b.dataset.tab === ui.problemTab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    $("#problem-body").innerHTML = problemBody(problem(ui.id));
    return;
  }
  if (el.dataset.section !== undefined) {
    const section = document.getElementById(
      "survey-section-" + el.dataset.section,
    );
    section?.scrollIntoView({ block: "start" });
    return;
  }
  if (el.dataset.prompt) {
    const p = problem(ui.id);
    const text =
      el.dataset.prompt === "hint"
        ? "给我一个提示，帮助我自己推导下一步。"
        : p.rubric?.length
          ? "请按本题评阅项模拟面试官点评当前代码，指出具体实现、边界条件和可改进之处。"
          : "请模拟面试官点评当前代码的正确性、复杂度、边界条件和表达清晰度。";
    const box = $("#question");
    box.value = box.value.trim() ? box.value + "\n" + text : text;
    chatInputs.set(ui.id, box.value);
    box.focus();
    return;
  }
  if (el.id === "submit-code") {
    void submitCode();
    return;
  }
  if (el.id === "ask") {
    void ask();
    return;
  }
  if (el.id === "save-draft") {
    const id = ui.id,
      code = $("#editor").value;
    if (!unsaved.has(id) && last(id, "draft")?.code === code) {
      toast("当前草稿已保存");
      return;
    }
    draftChanged(id, code);
    void flushDraft(id).then(() => {
      if (!unsaved.has(id)) toast("草稿已保存");
    });
    return;
  }
  if (el.id === "sync-now") {
    void doSync();
    return;
  }
  if (el.id === "refresh-status") {
    el.disabled = true;
    void refreshStatus();
    return;
  }
});
main.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "lesson-search") {
    ui.tutorialSearch = el.value;
    libraryResults();
    return;
  }
  if (el.id === "tutorial-excerpt") {
    contextFor(ui.id).excerpt = el.value;
    return;
  }
  if (el.id === "editor") {
    draftChanged(ui.id, el.value);
    return;
  }
  if (el.id === "question") {
    chatInputs.set(ui.id, el.value);
    return;
  }
  if (el.id === "local-search") {
    ui.search = el.value;
    homeRows();
    return;
  }
  if (el.id === "external-search") {
    ui.externalSearch = el.value;
    ui.externalPage = 1;
    filterExternal();
  }
});
main.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "progress-file" && el.files?.[0]) {
    void transferProgress("import", el.files[0]);
    return;
  }
  if (el.id === "ai-track") {
    ui.aiTrack = el.value;
    homeRows();
    return;
  }
  if (el.id === "lesson-track" || el.id === "source-kind") {
    ui[el.id === "lesson-track" ? "tutorialTrack" : "tutorialKind"] = el.value;
    libraryResults();
    return;
  }
  if (el.id === "tutorial-source") {
    contextFor(ui.id).sourceUrl = el.value;
    return;
  }
  if (el.id === "tutorial-read") {
    void record(
      { type: "tutorial-study", problemId: ui.id, done: el.checked },
      el,
    );
    return;
  }
  if (el.id === "collection" || el.id === "external-state") {
    ui[el.id === "collection" ? "collection" : "externalState"] = el.value;
    ui.externalPage = 1;
    filterExternal();
    return;
  }
  if (el.dataset.external !== undefined) {
    void record(
      { type: "external", problemId: el.dataset.external, state: el.value },
      el,
    );
    return;
  }
  if (el.id === "review-all") {
    ui.reviewAll = el.checked;
    reviewPage();
    return;
  }
  if (el.id === "history-filter") {
    ui.historyFilter = el.value;
    historyPage();
    return;
  }
  if (el.id === "mark-study") {
    void record({ type: "study", problemId: ui.id, done: el.checked }, el);
    return;
  }
  if (el.dataset.rubric !== undefined) {
    const p = problem(ui.id),
      checks = [...document.querySelectorAll("[data-rubric]:checked")].map(
        (b) => p.rubric[Number(b.dataset.rubric)],
      );
    void record({ type: "review", problemId: ui.id, checks }, el);
  }
});
main.addEventListener("keydown", (e) => {
  if (e.target.id !== "editor") return;
  const el = e.target;
  if (e.key === "Escape") {
    e.preventDefault();
    $("#save-draft").focus();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    void submitCode();
    return;
  }
  if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    el.setRangeText("    ", el.selectionStart, el.selectionEnd, "end");
    draftChanged(ui.id, el.value);
  }
});
// beforeinput also receives line breaks inserted by mobile keyboards.
main.addEventListener("beforeinput", (e) => {
  if (
    e.target.id !== "editor" ||
    e.inputType !== "insertLineBreak" ||
    e.isComposing ||
    !e.cancelable
  )
    return;
  const editor = e.target;
  const before = editor.value.slice(0, editor.selectionStart);
  const line = before.slice(before.lastIndexOf("\n") + 1);
  const indent = line.match(/^[ \t]*/)[0];
  // Preserve quoted # characters while checking for a block-opening colon.
  const code = line.replace(
    /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|#.*$/g,
    (token) => (token.startsWith("#") ? "" : token),
  );
  const blockIndent = code.trimEnd().endsWith(":")
    ? indent.includes("\t")
      ? "\t"
      : "    "
    : "";
  e.preventDefault();
  const newline = "\n" + indent + blockIndent;
  if (!document.execCommand("insertText", false, newline)) {
    editor.setRangeText(
      newline,
      editor.selectionStart,
      editor.selectionEnd,
      "end",
    );
    draftChanged(ui.id, editor.value);
  }
});
// Preserve a highlighted passage while the user activates its contextual action.
main.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#quote-selection")) e.preventDefault();
});
document.addEventListener("selectionchange", () => {
  if (ui.page !== "tutorial") return;
  const action = $("#quote-selection"),
    selection = window.getSelection();
  if (!action) return;
  const node =
    selection?.rangeCount && !selection.isCollapsed
      ? selection.getRangeAt(0).commonAncestorContainer
      : null;
  const element =
    node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  const block = element?.closest(
    "#tutorial-body,#tutorial-sources .source-row",
  );
  const text = block ? selection.toString().trim() : "";
  selectedPassage = text
    ? { id: ui.id, text, sourceUrl: block.dataset.resourceUrl || "" }
    : null;
  action.hidden = !selectedPassage;
});
document.querySelector(".skip").addEventListener("click", (e) => {
  e.preventDefault();
  main.focus();
});
window.addEventListener("hashchange", readRoute);
window.addEventListener("online", () => {
  for (const id of unsaved.keys()) void flushDraft(id);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) for (const id of unsaved.keys()) void flushDraft(id);
});
void boot();
