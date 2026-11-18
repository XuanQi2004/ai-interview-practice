'use strict';

const { createProgress } = require('./progress.cjs');

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) throw new Error('用法：node server/configure-sync.cjs OWNER/REPO 或 --off');
  const settings = await createProgress().configure(args[0] === '--off' ? null : args[0]);
  console.log(settings ? '已确认并保存专用私有仓库 ' + settings.repository + '，在本机页面点击「同步记录」即可合并进度。'
    : '本机保存的同步目的地已清除。');
  if (process.env.INTERVIEW_SYNC_REPOSITORY) console.log('已设置的 INTERVIEW_SYNC_REPOSITORY 环境变量优先于本机配置，取消该变量后使用上述设置。');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
