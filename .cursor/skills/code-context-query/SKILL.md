---
name: code-context-query
description: >-
  通过 SSH 连接中心机上的 code-context 服务，对远端已挂载的代码仓库执行 list/overview/read/search。
  当用户需要从服务器侧代码镜像中摘录片段、核对 API、或按关键词定位实现时使用。
  典型场景：单次查询后将 stdout 粘贴到指定文档；不依赖 Cookit 迭代上下文或 _context.md。
---

# 远程代码查询（code-context）

本 Skill **自包含**：`config/`、`env/`、`lib/ssh.js`、`scripts/code_query.js` 均在同一目录树下，可整体复制到其他项目使用。

远端行为与 Cookit `server/code-context/scripts/remote_code_query.js` 一致（`list` / `overview` / `read` / `search`）。

## 路径占位符

**`<code-query-path>`** = 本 Skill 根目录（与 `SKILL.md` 同级，内含 `scripts/`、`config/`、`env/`）。

在 Claude Code Plugin 中若已注册本 Skill，可用安装根下相对路径；在终端中请换成本机绝对路径。

## 环境准备

1. 编辑 `config/ssh-config.json`，确认 `code-context` 的 `host` 与 `remote_dir` 与运维部署一致。
2. `cp env/user-env.example.json env/user-env.json`，填写 `ssh_user`、`ssh_identity`（密钥需能登录该 host）。

## 调用方式

在仓库内执行（零额外依赖，仅需 Node.js）：

```bash
node <code-query-path>/scripts/code_query.js list
node <code-query-path>/scripts/code_query.js overview <project_id>
node <code-query-path>/scripts/code_query.js read <project_id> <仓库内相对路径>
node <code-query-path>/scripts/code_query.js search "<关键词>" --project <project_id> [--limit 50]
```

## 推荐单次工作流（摘录到文档）

1. 若不知道 `project_id`：先 `list`，从 JSON 中选项目标识。
2. 定位：执行 `overview <project_id>` 浏览 code-map，或 `search` 用业务关键词缩小文件范围。
3. 精读：对目标文件 `read <project_id> <path>`，将终端输出中的 `content` 或整段 stdout 复制到目标文档（注明项目、路径、日期）。

## 约束

- **MUST NOT** 将 `env/user-env.json` 提交到公开仓库。
- SSH 不可用时脚本退出码非 0；错误信息见 stderr。
- `read` 返回超长内容时远端可能截断（与中心服务配置一致）。

## 与 Cookit iteration-context 的关系

Cookit S5 使用仓库根下 `shared/scripts/ssh.js` + `skills/iteration-context/scripts/code_query.js`。本 Skill 为**独立副本**，便于其他工程单独安装；逻辑等价，配置在 Skill 目录内完成。
