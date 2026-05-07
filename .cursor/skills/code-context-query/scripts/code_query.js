#!/usr/bin/env node

// 远程 code-context 查询（SSH 桥接到服务器上的 remote_code_query.js）
//
// 用法：
//   node code_query.js list
//   node code_query.js overview <project>
//   node code_query.js read <project> <relative_path>
//   node code_query.js search <keyword> --project <P> [--limit N]

const ssh = require('../lib/ssh');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('用法：');
  console.log('  node code_query.js list');
  console.log('  node code_query.js overview <project>');
  console.log('  node code_query.js read <project> <relative_path>');
  console.log('  node code_query.js search <keyword> --project <P> [--limit N]');
  process.exit(0);
}

const check = ssh.isConfigured();
if (!check.ok) {
  console.error(ssh.getSetupGuide());
  process.exit(1);
}

try {
  const config = ssh.getConfig('code-context');
  const escapedArgs = args.map(ssh.shellEscape).join(' ');
  const remoteCmd = `node ${config.remoteDir}/scripts/remote_code_query.js ${escapedArgs}`;
  const result = ssh.execRaw('code-context', remoteCmd);
  process.stdout.write(result);
} catch (err) {
  const msg = err.stderr ? err.stderr.toString().trim().split('\n')[0] : err.message;
  console.error(`错误：无法连接代码查询服务（SSH）${msg ? '——' + msg : ''}`);
  process.exit(1);
}
