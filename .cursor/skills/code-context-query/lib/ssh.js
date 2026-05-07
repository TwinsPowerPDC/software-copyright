#!/usr/bin/env node

// code-context-query Skill 专用 SSH 桥接（自包含，不依赖 Cookit 根目录 shared/）
//
// 配置分两层：
//   config/ssh-config.json  — 团队共享（服务器地址、code-context 服务路径）
//   env/user-env.json         — 个人（SSH 用户名、密钥路径）

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Skill 包根目录（本文件位于 lib/ssh.js）
const SKILL_ROOT = path.resolve(__dirname, '..');
const SSH_CONFIG_PATH = path.join(SKILL_ROOT, 'config', 'ssh-config.json');
const USER_ENV_PATH = path.join(SKILL_ROOT, 'env', 'user-env.json');

function shellEscape(arg) {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

function expandHome(p) {
  if (p && p.startsWith('~/')) {
    return path.join(process.env.HOME, p.slice(2));
  }
  return p;
}

function loadSSHConfig() {
  try {
    return JSON.parse(fs.readFileSync(SSH_CONFIG_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function loadUserEnv() {
  try {
    return JSON.parse(fs.readFileSync(USER_ENV_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function isConfigured() {
  const sshConfig = loadSSHConfig();
  if (!sshConfig) {
    return { ok: false, reason: 'SSH 服务器配置缺失（config/ssh-config.json）' };
  }

  const userEnv = loadUserEnv();
  if (!userEnv) {
    return { ok: false, reason: 'SSH 用户环境未配置（env/user-env.json 不存在）' };
  }

  if (!userEnv.ssh_user) {
    return { ok: false, reason: 'SSH 用户名未配置（env/user-env.json 中 ssh_user 为空）' };
  }

  if (!userEnv.ssh_identity) {
    return { ok: false, reason: 'SSH 密钥路径未配置（env/user-env.json 中 ssh_identity 为空）' };
  }

  const identityPath = expandHome(userEnv.ssh_identity);
  if (!fs.existsSync(identityPath)) {
    return { ok: false, reason: `SSH 密钥文件不存在：${userEnv.ssh_identity}` };
  }

  return { ok: true };
}

function getSetupGuide() {
  const sshConfig = loadSSHConfig();
  const hostInfo = sshConfig
    ? Object.values(sshConfig.services || {}).map(s => s.host).filter(Boolean)[0] || '<服务器地址>'
    : '<服务器地址>';

  return [
    '',
    '═══════════════════════════════════════════════',
    '  code-context-query — SSH 未就绪',
    '═══════════════════════════════════════════════',
    '',
    '1. 确认 config/ssh-config.json 存在且含 code-context 服务。',
    '',
    '2. 复制并填写个人环境：',
    `   cp env/user-env.example.json env/user-env.json`,
    '',
    '   {',
    '     "ssh_user": "你的服务器用户名",',
    '     "ssh_identity": "~/.ssh/你的密钥文件名"',
    '   }',
    '',
    `   服务器示例：${hostInfo}`,
    '',
    '═══════════════════════════════════════════════',
    '',
  ].join('\n');
}

function getConfig(serviceName) {
  const sshConfig = loadSSHConfig();
  if (!sshConfig) {
    throw new Error('SSH 服务器配置缺失（config/ssh-config.json）');
  }

  const service = sshConfig.services && sshConfig.services[serviceName];
  if (!service) {
    throw new Error(`未知的远程服务：${serviceName}（检查 config/ssh-config.json）`);
  }

  const userEnv = loadUserEnv();
  if (!userEnv || !userEnv.ssh_user || !userEnv.ssh_identity) {
    console.error(getSetupGuide());
    throw new Error('SSH 环境未配置');
  }

  return {
    host: service.host,
    user: userEnv.ssh_user,
    identity: expandHome(userEnv.ssh_identity),
    remoteDir: service.remote_dir,
  };
}

function buildSSHCmd(config, remoteCmd) {
  const target = `${config.user}@${config.host}`;
  return `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -o BatchMode=yes -i ${shellEscape(config.identity)} ${shellEscape(target)} ${shellEscape(remoteCmd)}`;
}

function exec(serviceName, remoteCmd, options = {}) {
  const config = getConfig(serviceName);
  const sshCmd = buildSSHCmd(config, remoteCmd);

  try {
    const execOpts = {
      encoding: 'utf-8',
      timeout: options.timeout || 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    };
    if (options.input) {
      execOpts.input = options.input;
    }

    const result = execSync(sshCmd, execOpts);
    return { success: true, stdout: result };
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : '';
    const stdout = err.stdout ? err.stdout.toString().trim() : '';

    if (err.status !== null && err.status !== 255) {
      return { success: false, stdout, stderr, isRemoteError: true };
    }
    return { success: false, stdout: '', stderr, isRemoteError: false };
  }
}

function execRaw(serviceName, remoteCmd, options = {}) {
  const config = getConfig(serviceName);
  const sshCmd = buildSSHCmd(config, remoteCmd);

  const execOpts = {
    encoding: 'utf-8',
    timeout: options.timeout || 30000,
    stdio: ['pipe', 'pipe', 'pipe'],
  };
  if (options.input) {
    execOpts.input = options.input;
  }

  return execSync(sshCmd, execOpts);
}

module.exports = {
  isConfigured,
  getSetupGuide,
  getConfig,
  exec,
  execRaw,
  shellEscape,
  SKILL_ROOT,
};
