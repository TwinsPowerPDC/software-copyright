# 产品线 / 产品端 → 远端代码查询映射

与主流程 **阶段一** 配合使用：用户声明 **产品线**（`TP` / `TPR`）与 **产品端**（下表「产品端」列之一）后，按本表确定 `project_id` 与检索范围，再通过 **code-context-query**（`list` / `overview` / `search` / `read`）拉取代码。

**`<code-query-path>`**：`code-context-query` Skill 根目录（与 `software-copyright` 同级时一般为 `.cursor/skills/code-context-query/`），内含 `scripts/code_query.js`。调用前须已按该 Skill 配置 `config/ssh-config.json` 与 `env/user-env.json`。

---

## 一、`project_id` 解析规则

1. 执行 `node <code-query-path>/scripts/code_query.js list`，从返回的 JSON 中取得远端注册的 `project_id` 列表。
2. 下表已与 **`list` 实测结果**对齐（与远端 `description` / `path` 一致）；若日后服务端增删项目，**以最新 `list` 为准**并回写本表。
3. 若同一产品线 + 端在业务上对应多个仓库（本表未覆盖），向用户确认本次软著针对哪一个 `project_id`。

---

## 二、映射表（与 code-context `list` 一致）

| 产品线 | 产品端     | `project_id` | 远端说明（来自 `list`） |
|--------|------------|--------------|-------------------------|
| TP     | 管理后台   | `tp_web_frontend` | TP Web 前端，`/tp_code/tp_web_frontend` |
| TPR    | 管理后台   | `tpr_web_frontend` | TPR Web 前端，`/tp_code/tpr_web_frontend` |
| TP     | 顾客小程序 | `customer_mini_program_frontend` | 顾客小程序前端（TP/TPR 共用同一仓库 id） |
| TPR    | 顾客小程序 | `customer_mini_program_frontend` | 同上 |
| TP     | 商管云     | `business_management_cloud_frontend` | 商管云小程序前端（TP/TPR 共用同一仓库 id） |
| TPR    | 商管云     | `business_management_cloud_frontend` | 同上 |
| TP     | 运维后台   | `tp_ops_web_frontend` | TP 运维后台前端 |
| TPR    | 运维后台   | `tpr_ops_web_frontend` | TPR 运维后台前端 |

**可选：后端仓库**（不在「四端」内；设计文档/接口章节需要时再查）

| 产品线 | 用途     | `project_id`   | 远端说明 |
|--------|----------|----------------|----------|
| TP     | 后端服务 | `tp_backend`   | TP 后端，`/tp_code/tp_backend` |
| TPR    | 后端服务 | `tpr_backend`  | TPR 后端，`/tp_code/tpr_backend` |

**无效组合**：若业务上不存在某「产品线 + 产品端」，在对话中直接告知用户并停止，勿猜测仓库。

---

## 三、检索策略（替代本机 Glob）

1. **`overview <project_id>`**：先扫 code-map / 目录树，锁定业务源码目录（避开 `node_modules`、`dist`、`build`、`target`、`.git`）。
2. **`search "<关键词>" --project <project_id> --limit 50`**：用模块名、领域词、路由片段等多轮缩小文件集合；关键词可从用户 PRD、菜单名、表名推断。
3. **`read <project_id> <仓库内相对路径>`**：仅对**已选定纳入软著**的路径精读；**禁止**在对话中整文件 dump 超长内容（防上下文溢出）。

---

## 四、与本机汇编脚本的衔接

`scripts/build_source_doc.py` 只读取**本机路径**。因此：

- 对每个待纳入的远端相对路径，执行 `read` 后将正文写入本机临时目录（例如 `/tmp/软著_mirror_{软件简称}/<相对路径>`），保持相对路径层级，`mkdir -p` 父目录。
- `/tmp/source_files_*.txt` 与 `/tmp/all_source_files_*.txt` 中填写上述**本机绝对路径**。
- **总行数**：若无法在远端枚举全仓库所有源文件，可将 `--all-files-from` 列为「本次已镜像的全部源文件路径清单」；此时备注行中的「本系统代码总行数」表示**本次可统计范围内**的行数（与镜像清单一致时走「已全部放入本文档」逻辑）。若用户另行提供官方行数口径，以用户确认为准写入备注表述。
