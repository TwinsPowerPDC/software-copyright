# 软著申请材料 · Cursor Skills

本仓库提供 **中国软件著作权登记** 相关 Cursor Agent Skill，以及可选的 **远端代码查询** skill。

## 包含的 Skills

| Skill | 路径 | 用途 |
|--------|------|------|
| **software-copyright** | `.cursor/skills/software-copyright/` | 设计文档（软件说明书）、源代码 Word 汇编、申请表模板与填写指引 |
| **code-context-query** | `.cursor/skills/code-context-query/` | 经 SSH 连接中心机上的 code-context 服务，对远端挂载仓库做 `list` / `overview` / `read` / `search`（摘录片段、核对 API 等） |

### software-copyright 目录一览

| 内容 | 路径 |
|------|------|
| 主说明 | `SKILL.md` |
| 写作/格式参考 | `references/` |
| Python 脚本 | `scripts/` |
| 申请表 `.doc` 模板 | `assets/application_form_template.doc` |

### code-context-query 快速准备

1. 编辑 `config/ssh-config.json`（`host`、`remote_dir` 与部署一致）。
2. `cp env/user-env.example.json env/user-env.json`，填写 `ssh_user`、`ssh_identity`。  
   **`user-env.json` 已被 `.gitignore` 忽略，勿把私钥路径提交到仓库。**

调用示例（需 Node.js，路径换成本机 skill 根目录）：

```bash
node .cursor/skills/code-context-query/scripts/code_query.js list
```

详见该目录下 `SKILL.md`。

## 使用（软著主流程）

1. 在 Cursor 中打开本仓库（或已复制 `.cursor/skills/` 的项目）。
2. 对话里 **`@software-copyright`** 加载 skill，按 `SKILL.md` 中的阶段执行；跑脚本前请在终端 **`cd` 到** `.cursor/skills/software-copyright/`，或使用该目录的绝对路径。

合规约束（零标注、零占位符、先确认后写入等）以 `software-copyright/SKILL.md` 正文为准。
