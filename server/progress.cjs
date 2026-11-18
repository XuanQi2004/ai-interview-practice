const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { createHash, randomUUID } = require('node:crypto')
const { execFile } = require('node:child_process')
const { promisify, isDeepStrictEqual } = require('node:util')

const execFileAsync = promisify(execFile)
const branch = 'interview-progress'
const branchRef = 'refs/heads/' + branch

function git(cwd, ...args) {
  const env = { ...process.env }
  // 使用独立工作树和固定 HTTPS 目标，忽略全局 insteadOf/pushInsteadOf 及外部配置注入。
  for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key]
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: os.devNull, GIT_ALLOW_PROTOCOL: 'https',
    GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GH_HOST: 'github.com',
    GH_PROMPT_DISABLED: '1', LC_ALL: 'C'
  })
  return execFileAsync('git', ['-c', 'core.hooksPath=' + os.devNull, '-c', 'init.templateDir=',
    '-c', 'credential.helper=!gh auth git-credential', '-c', 'http.followRedirects=false', ...args], {
    cwd,
    timeout: 90000,
    maxBuffer: 4 * 1024 * 1024,
    env
  })
}

function syncError(error) {
  if (error.stderr === undefined && error.code !== 'ENOENT') return error
  const output = error.stderr || ''
  if (error.code === 'ENOENT') return new Error('请安装 Git 并确认本机可以运行 git。')
  if (/authentication|permission denied|write access|403|could not read username|repository not found/i.test(output)) {
    return new Error('请运行 gh auth login --hostname github.com，使用可读写该私有仓库的账号登录，然后再次同步。')
  }
  if (/remote .*not found|no such remote|not a git repository/i.test(output)) {
    return new Error('请用 node server/configure-sync.cjs OWNER/REPO 指定个人进度私库，然后再次同步。')
  }
  return new Error('Git 同步遇到错误。请确认网络连接、远端仓库地址和分支写入权限，然后再次同步。本机练习记录已保留。')
}

// 用事件 ID 派生固定长度的文件名，支持中文 ID 和大小写敏感的 ID。
function eventFile(id) {
  return createHash('sha1').update(id).digest('hex') + '.json'
}

function checkEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event) ||
      typeof event.id !== 'string' || !event.id.trim() ||
      typeof event.type !== 'string' || !event.type.trim() ||
      (event.problemId != null && typeof event.problemId !== 'string') ||
      typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) {
    throw new Error('记录需要有效的事件 ID、类型和日期，题目 ID 使用字符串。')
  }
}

async function readEvents(directory) {
  let entries
  try {
    if (!(await fs.lstat(directory)).isDirectory()) throw new Error('练习记录目录格式异常，请检查文件类型。')
    entries = await fs.readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  const events = []
  for (const entry of entries) {
    if (!entry.name.endsWith('.json')) continue
    if (!entry.isFile()) throw new Error('练习记录需要保存为普通 JSON 文件。')
    let event
    try {
      event = JSON.parse(await fs.readFile(path.join(directory, entry.name), 'utf8'))
      checkEvent(event)
      if (entry.name !== eventFile(event.id)) throw new Error()
    } catch {
      throw new Error('记录文件 ' + entry.name + ' 的内容或事件 ID 异常，请从备份恢复该文件。')
    }
    events.push(event)
  }
  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id))
}

async function storeEvent(directory, event, useExistingTime = false) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 })
  const target = path.join(directory, eventFile(event.id))
  const temporary = path.join(directory, randomUUID() + '.tmp')
  await fs.writeFile(temporary, JSON.stringify(event) + '\n', { mode: 0o600, flag: 'wx' })
  try {
    // link 同时完成创建与发布。其他进程追加相同 ID 时会保留已写好的完整文件。
    await fs.link(temporary, target)
    return event
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    const existing = JSON.parse(await fs.readFile(target, 'utf8'))
    const next = useExistingTime ? { ...event, at: existing.at } : event
    if (!isDeepStrictEqual(existing, next)) throw new Error('相同事件 ID 对应了两条不同记录，请检查事件 ID。')
    return existing
  } finally {
    await fs.rm(temporary, { force: true })
  }
}

function defaultDataDir() {
  return path.resolve(process.env.INTERVIEW_DATA_DIR || path.join(__dirname, '..', '.interview-data'))
}

const setupHint = '学习记录已保存在本机。请用 node server/configure-sync.cjs OWNER/REPO 指定个人进度私库。'

function repositoryName(value) {
  if (typeof value !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,38})\/[a-z0-9_.-]+$/i.test(value)
      || /\/(?:\.|\.\.)$/.test(value)) {
    throw new Error('请使用 GitHub 仓库全名，例如 your-account/interview-progress。')
  }
  return value
}

async function verifyPrivate(repo) {
  repositoryName(repo)
  let stdout
  try {
    const result = await execFileAsync('gh', ['api', '--hostname', 'github.com', 'repos/' + repo], {
      env: { ...process.env, GH_HOST: 'github.com', GH_PROMPT_DISABLED: '1' },
      timeout: 20000, maxBuffer: 1024 * 1024,
    })
    stdout = result.stdout
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('请安装 GitHub CLI，运行 gh auth login --hostname github.com，然后重新配置同步。')
    throw new Error('GitHub 未能确认仓库信息。请检查仓库名、网络连接和 gh auth status --hostname github.com 的登录账号。')
  }
  let info
  try { info = JSON.parse(stdout) } catch { throw new Error('GitHub 仓库信息读取失败，请再次同步。') }
  if (info?.private !== true || info.visibility !== 'private') {
    throw new Error('学习记录仅支持同步到 visibility 为 private 的 GitHub 仓库。请创建专用私库后重新配置。')
  }
  if (typeof info.full_name !== 'string' || info.full_name.toLowerCase() !== repo.toLowerCase()
      || !Number.isSafeInteger(info.id) || info.id <= 0) {
    throw new Error('GitHub 返回的仓库身份已变化，请用当前完整仓库名重新配置。')
  }
  if (info.permissions?.push !== true && info.permissions?.admin !== true) {
    throw new Error('当前 GitHub 账号需要对此私库具备推送权限，请检查登录账号与仓库权限。')
  }
  return { repository: info.full_name, id: info.id }
}

function createProgress({ dataDir = defaultDataDir() } = {}) {
  const eventsDirectory = path.resolve(dataDir, 'events')
  const syncMetadata = path.resolve(dataDir, 'last-sync.json')
  const configPath = path.resolve(dataDir, 'sync-repository.json')
  let syncing

  async function readChoice() {
    if (process.env.INTERVIEW_SYNC_REPOSITORY) {
      return { repository: repositoryName(process.env.INTERVIEW_SYNC_REPOSITORY) }
    }
    try {
      const settings = JSON.parse(await fs.readFile(configPath, 'utf8'))
      return { repository: repositoryName(settings.repository), id: settings.id }
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw new Error('同步配置读取失败，请重新运行 node server/configure-sync.cjs OWNER/REPO。')
    }
  }

  async function configure(repository) {
    if (repository === null) {
      await fs.rm(configPath, { force: true })
      return null
    }
    const settings = await verifyPrivate(repository)
    await fs.mkdir(dataDir, { recursive: true, mode: 0o700 })
    const temp = path.resolve(dataDir, randomUUID() + '.tmp')
    try {
      await fs.writeFile(temp, JSON.stringify(settings), { flag: 'wx', mode: 0o600 })
      await fs.rename(temp, configPath)
    } finally {
      await fs.rm(temp, { force: true })
    }
    return settings
  }

  const list = () => readEvents(eventsDirectory)

  async function append(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('请提交练习事件对象。')
    const event = { ...input, id: input.id ?? randomUUID(), at: input.at ?? new Date().toISOString() }
    checkEvent(event)
    return storeEvent(eventsDirectory, event, input.at == null)
  }

  async function info() {
    let choice, configurationError
    try { choice = await readChoice() } catch (error) { configurationError = error.message }
    let lastSyncAt = null
    try {
      const state = JSON.parse(await fs.readFile(syncMetadata, 'utf8'))
      if (choice && state.repository?.toLowerCase() === choice.repository.toLowerCase()
          && (!choice.id || state.id === choice.id)) lastSyncAt = state.syncedAt
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    return { branch, remote: choice?.repository || '仅本机', configured: !!choice, lastSyncAt,
      message: configurationError || (choice ? '同步时向 GitHub 核实私有状态与仓库身份。' : setupHint),
      count: (await list()).length }
  }

  async function reconcile(root, downloadedIds, approved) {
    const exists = (await git(root, 'ls-remote', '--heads', 'origin', branchRef)).stdout.trim()
    if (exists) {
      await git(root, 'fetch', '--quiet', '--depth=1', '--no-tags', 'origin', branchRef)
      await git(root, 'reset', '--quiet', '--hard', 'FETCH_HEAD')
    }
    const remoteDirectory = path.join(root, 'events')
    const [localEvents, remoteEvents] = await Promise.all([list(), readEvents(remoteDirectory)])
    const local = new Map(localEvents.map(event => [event.id, event]))
    const published = new Set(remoteEvents.map(event => event.id))
    for (const event of remoteEvents) {
      if (local.has(event.id)) {
        if (!isDeepStrictEqual(local.get(event.id), event)) throw new Error('两台电脑的相同事件 ID 对应了不同的内容，请检查该记录。')
      } else {
        await storeEvent(eventsDirectory, event)
        downloadedIds.add(event.id)
      }
    }
    const pending = localEvents.filter(event => !published.has(event.id))
    if (pending.length) {
      for (const event of pending) await storeEvent(remoteDirectory, event)
      await git(root, 'add', '--force', '--', 'events')
      await git(root, '-c', 'user.name=Interview Practice', '-c', 'user.email=practice@localhost',
        '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', '同步面试练习记录')
      // Git 默认按快进规则推送。另一台电脑先推送时，调用方会重新读取并合并。
      const selected = await readChoice()
      if (selected?.repository.toLowerCase() !== approved.repository.toLowerCase()
          || (selected.id && selected.id !== approved.id)) {
        throw new Error('同步设置已改变。本机记录已保留，请按当前设置重新同步。')
      }
      const current = await verifyPrivate(approved.repository)
      if (current.id !== approved.id) throw new Error('目标仓库身份发生变化，请重新配置私人同步仓库。')
      await git(root, 'push', '--quiet', 'origin', 'HEAD:' + branchRef)
    }
    return { branch, count: remoteEvents.length + pending.length, uploaded: pending.length, downloaded: downloadedIds.size }
  }

  async function runSync() {
    const choice = await readChoice()
    if (!choice) throw new Error(setupHint)
    const approved = await verifyPrivate(choice.repository)
    if (choice.id && choice.id !== approved.id) throw new Error('目标仓库身份与本机设置不同，请重新配置私人同步仓库。')
    const remote = 'https://github.com/' + approved.repository + '.git'
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'interview-progress-'))
    try {
      await git(root, 'init', '--quiet', '-b', branch)
      await git(root, 'remote', 'add', '--', 'origin', remote)
      let finished
      const downloadedIds = new Set()
      for (let attempt = 0; attempt < 5; attempt++) {
        try { finished = await reconcile(root, downloadedIds, approved); break } catch (error) {
          if (!/\[rejected\]|non-fast-forward|fetch first|cannot lock ref/i.test(error.stderr || '')) throw error
          if (attempt === 4) throw new Error('远端正在接收其他电脑的记录。请再点一次同步，本机记录已保存。')
        }
      }
      const syncedAt = new Date().toISOString()
      await fs.mkdir(dataDir, { recursive: true, mode: 0o700 })
      const temp = path.resolve(dataDir, randomUUID() + '.tmp')
      await fs.writeFile(temp, JSON.stringify({ ...approved, syncedAt }), { mode: 0o600 })
      await fs.rename(temp, syncMetadata)
      return { ...finished, syncedAt }
    } finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  }

  function sync() {
    if (!syncing) syncing = runSync().catch(error => { throw syncError(error) }).finally(() => { syncing = null })
    return syncing
  }

  return { list, append, sync, info, configure }
}

module.exports = { createProgress, defaultDataDir }
