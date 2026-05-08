---
name: software-copyright
description: >-
  Generates China software copyright (软著) registration materials: design specification
  (软件说明书), source code Word assembly, and application form filling from the bundled
  template. Code discovery uses the sibling skill code-context-query (SSH code-context:
  list/overview/search/read) scoped by product line TP/TPR and product surface
  (管理后台/顾客小程序/商管云/运维后台), not a fixed local source tree. Code discovery runs
  in batch with implicit user approval (no per-command confirmation). Use when the user
  mentions 软著, 软件著作权, 软件版权, 版权登记, 申请版权, 软著材料, 源代码文档, 设计文档,
  TP, TPR, or CCPC / 中国版权保护中心 submission.
disable-model-invocation: true
---

# 软件著作权申请材料生成 Skill

## Cursor：布局与路径

- 本条目为 **项目级** Cursor Agent Skill，目录为 `.cursor/skills/software-copyright/`，与 `SKILL.md` 同级包含 `references/`、`scripts/`、`assets/`。
- **skill 根目录**：即本 `SKILL.md` 所在目录。文中所有 `references/`、`scripts/`、`assets/` 均相对于该根目录。
- 在 Shell 中执行 `python3 scripts/...` 或向 LibreOffice 传入 `assets/application_form_template.doc` 时：**先 `cd` 到 skill 根目录**，或把这些路径换成由 skill 根目录展开的**绝对路径**（避免在用户项目根目录误跑脚本）。
- 加载方式：在对话中 `@software-copyright`，或依赖上方 `description` 中的触发词由模型拉取本 skill。

## 概述

本 Skill 协助用户生成中国软件著作权登记所需的全套申请材料，支持各类技术栈的软件项目（Web 应用、微信小程序、移动 App、桌面应用等）。**源码与结构信息不再依赖用户指定的固定本机源码目录**，而是由用户声明 **产品线**（`TP` / `TPR`）与 **产品端**（`管理后台` / `顾客小程序` / `商管云` / `运维后台`），AI 通过 **code-context-query** Skill（远端 code-context：`list` / `overview` / `search` / `read`）检索、摘录后再生成本地汇编用的临时文件。用户另可提供 README、PRD、已有草稿等材料，AI 全程协助生成：

1. **设计文档**（软件说明书）——结构化表格形式
2. **源代码文档**——前后各30页或完整源码汇编
3. **申请表填写指引**——逐字段填写说明

**参考文档**（按需加载）：
- `references/design_doc_guide.md` — 设计文档章节写作规范与指南
- `references/application_form_guide.md` — 申请表全字段填写指南
- `references/source_code_format.md` — 源代码文档格式规范
- `references/material_checklist.md` — 项目材料完整性检查清单
- `references/code_context_product_map.md` — 产品线/产品端 → `project_id` 与远端检索策略；与 **code-context-query** 联用

**关联 Skill（代码来源，必用）**：
- 路径：与 `software-copyright` 同级目录下的 **code-context-query**（`<code-query-path>`，内含 `scripts/code_query.js`）。
- 执行任何 `node .../code_query.js ...` 前，**必须先阅读**该 Skill 的 `SKILL.md`（环境变量、SSH、`list/overview/read/search` 用法与约束）。

## 核心原则：文档审核安全性

**三份最终交付文档（设计文档、源代码文档、申请表）是直接提交给中国版权保护中心审核的正式材料。**

必须遵守以下铁律：

1. **零标注**：最终文档中严禁出现任何待修订标注，包括但不限于：`（推断值，请核实）`、`（建议值，可修改）`、`⚠️ 待补充`、`TODO`、`FIXME`、`[待确认]`、`___`（空白占位）等。审核人员看到此类标注会直接退回申请。
2. **零占位符**：最终文档中不得残留任何 `{变量}`、`{{xxx}}`、`<待填写>` 等模板占位符。
3. **零对话痕迹**：最终文档中不得出现任何 AI 对话痕迹（如"根据您的描述"、"建议您确认"等措辞）。
4. **先确认后写入**：对于任何不确定的信息（推断的业务含义、模糊的技术细节、缺失的字段说明等），**必须在生成文档之前通过对话向用户确认**，确认后以确定的内容写入文档。绝不允许将不确定性"传递"到文档中让用户事后修改。
5. **宁可追问不猜测**：当推断置信度不足时，暂停生成、向用户提问，而非在文档中留下标注。每次追问控制在 1-3 个问题。

### 代码检索与 Shell：批次执行、默认通过

用户已通过 `@software-copyright` 或触发词加载本技能，并给出有效的 **产品线 + 产品端**（及可选输出目录、材料路径）时，适用本节；**与上条铁律 4–5 不冲突**（见下「边界」）。

1. **一次性跑完、中间不征求「是否继续」**  
   阶段一与阶段四中所有 **code-context-query** 调用（`list` → 对齐 `project_id` → `overview` → 多轮 `search` → 全部 `read` 与镜像写入），以及依赖检测、`pip install`、`libreoffice`、`pandoc`、`python3 scripts/...` 等 Shell，均视为用户**已对本会话预先授权**。  
   **禁止**：在每条 `search`/`read`、每次 `node .../code_query.js` 或每条 Shell 前后插入「是否执行下一步」「确认运行吗」等对话式确认。应**尽快连续发起**工具调用，直至该阶段完成或命中本 skill 已定义的**阻断条件**（`project_id` 无法唯一匹配、PDF 三步失败、LibreOffice/python 安装失败、占位符替换数不符且无法修复等）。

2. **与铁律 4–5 的边界**  
   「先确认后写入」「宁可追问」仅约束**写入三份交付 Word 的业务事实**（软件全称/简称、主要功能与技术特点的定稿、低置信度业务推断等）。**不**适用于：远端检索、镜像写入、行数统计、格式转换与脚本汇编——这些按第 1 条直接执行，**默认通过**。

3. **`project_id` 唯一性**  
   仅在 `list` 与 `references/code_context_product_map.md` 无法唯一对齐时停顿，**最多 3 个问题**请用户选定 `project_id`；用户选定或默认规则可解后，**立即**执行后续全部 `overview`/`search`/`read`/镜像，**不得**再问「是否开始检索」。

4. **减少 Cursor「Run」弹窗（客户端）**  
   若 IDE 对每条终端命令单独弹出 Run：技能侧仍应按第 1 条一次排定序列并连续发出；用户可在 Cursor 中为该工作区开启终端自动批准，或由 Agent 在**同一轮次内**串联多条命令（安全时使用 `&&`），以降低打断次数。

5. **检索编排（减少无效往返）**  
   先根据 `code_context_product_map.md` 与 PRD/模块名**一次性列出**本轮 `search` 关键词与待 `read` 的相对路径清单，再按清单连续执行；避免「搜一个词 → 停下来问 → 再搜」的交互模式。

---

## 阶段一：读取并盘点现有材料

### 1.0 必备输入：产品线 + 产品端

- **产品线**：`TP` 或 `TPR`（大小写不敏感，规范化为大写）。
- **产品端**：必须是以下之一：`管理后台`、`顾客小程序`、`商管云`、`运维后台`。
- 若用户未给出或组合无效，**先追问补齐**，不要默认假设仓库。

### 1.1 通过 code-context-query 获取代码侧信息

1. 读取 **code-context-query** 的 `SKILL.md`，确认 `<code-query-path>` 与 `env/user-env.json` 已配置。
2. 执行 `node <code-query-path>/scripts/code_query.js list`，将返回的 `project_id` 与 `references/code_context_product_map.md` 中对应行对齐；**以 `list` 实际标识为准**。若无法唯一匹配，**最多 3 个问题**请用户选定 `project_id`。
3. 在同一 `project_id` 上依次使用 `overview`、`search`（可多轮关键词）定位候选源文件路径；精读时使用 `read <project_id> <仓库内相对路径>`。**以上步骤按上文「批次执行、默认通过」连续做完**，不在每步征求用户同意。
4. **禁止**在对话中输出完整大文件内容；摘录用于写设计文档时只引必要片段，**整文件内容**通过写入本机临时镜像供阶段 4.2 脚本使用（见下文）。

### 1.2 其他材料（与代码检索并行）

按以下优先级读取用户提供的本地/附件材料：

1. **已有草稿**：了解哪些章节已完成、哪些有缺漏，避免重复劳动
2. **产品需求文档 / PRD**：提取功能模块描述和业务场景（`search` 关键词优先从这里取）
3. **已有设计文档**：了解现有描述口径，保持一致性
4. **配置文件**（若用户随项目提供）：`package.json`、`pom.xml`、`app.json`——获取技术栈和版本；若仅有远端代码，则从 `read` 的配置类文件中获取
5. **README 和其他说明文件**：补充背景信息

**读取策略**：
- 大型项目不必 `read` 每个文件，优先代表性路径（各层各 1–2 个）
- 重点关注：函数签名、类名、接口路径、注释说明
- 整理出：功能模块列表、技术栈、主要数据对象、核心接口

→ 产品线/端与 `project_id` 对照、检索顺序见 `references/code_context_product_map.md`  
→ 材料优先级详表和各层读取顺序见 `references/material_checklist.md`

**PDF 文件处理（三步决策树）**：

遇到 `.pdf` 文件时，依次尝试以下步骤，成功即停止：

**第1步：Read 工具直接读取**
使用 Read 工具读取（超过10页需指定 `pages` 参数，如 `pages: "1-10"`）。
- 成功 → 继续流程
- 失败（提示 `pdftoppm is not installed`）→ 进入第2步

**第2步：Python pdfminer 提取**
先检测 pdfminer 是否已可用：
```bash
python3 -c "from pdfminer.high_level import extract_text; print('ok')"
```
- **已可用（输出 ok）** → 直接提取：
  ```bash
  python3 -c "from pdfminer.high_level import extract_text; print(extract_text('完整文件路径'))"
  ```
  成功 → 继续流程
- **不可用（ImportError）** → 自动安装后提取：
  ```bash
  python3 -m pip install pdfminer.six
  ```
  若提示 `externally-managed-environment` 错误，则加 `--break-system-packages` 重试：
  ```bash
  python3 -m pip install --break-system-packages pdfminer.six
  ```
  安装成功后提取：
  ```bash
  python3 -c "from pdfminer.high_level import extract_text; print(extract_text('完整文件路径'))"
  ```
  - 成功 → 继续流程
  - 失败（无 python3 / pip 不可用）→ 进入第3步

**第3步：全部失败时阻断任务**
- 告知用户所有自动安装方式均失败
- **停止执行所有后续步骤**
- 要求用户二选一后重新启动对话：
  - 选项 A：手动安装 Python 和 pdfminer.six（`pip install pdfminer.six`）
  - 选项 B：将 PDF 另存为 Word（.docx）或纯文本（.txt）后重新提供路径
- **不降级为代码推断**（PRD 是必须材料，静默降级会使输出质量下降且用户无法察觉）

---

## 阶段二：分析并识别材料缺口

对照 `references/material_checklist.md` 中的检查清单进行材料盘点。

→ 盘点输出模板和推断策略见 `references/material_checklist.md`

**处理原则**：
- 能从代码高置信度推断的信息，直接采用，无需标注
- 推断置信度不足的信息，**必须在对话中向用户确认后再写入文档**，而非在文档中标注"请核实"——最终文档不允许出现任何待修订标记
- 每次向用户提问不超过 3 个问题，避免问卷式询问
- 优先保证材料完整性，宁可有轻微误差也不留空白章节

---

## 阶段三：收集申请表必填信息

申请表 Word 模板已内置了大部分字段的填写值，模板中只有以 `{变量}` 标记的位置才需要填充。

需要向用户收集的字段（共 6 个）：

| 字段 | 说明 | 处理方式 |
|------|------|---------|
| 软件全称 | **MUST** 以"影能科技"为前缀，不含版本号，如"影能科技智慧园区管理系统" | 向用户询问，生成的候选名称必须以"影能科技"开头 |
| 软件简称 | 3-10字，不能与全称完全相同，**MUST NOT** 包含"影能科技" | 向用户询问，若用户提供的简称含"影能科技"则提醒修改 |
| 开发完成日期 | 与纸质/在线申请表一致，常见为 `YYYY年M月D日`；须晚于公司成立日、不晚于填表日 | **必须询问用户**，不得用模板旧日期或猜测值写入 |
| 首次发表日期 | 与申请表一致；须晚于开发完成日期；未发表等口径由用户选定后**原样**填入 | **必须询问用户** |
| 软件的主要功能 | 100-300字，按模块列点描述实现了什么 | 根据代码和设计文档生成草稿，告知用户确认 |
| 软件的技术特点 | 50-150字，列举3-5个技术亮点 | 根据代码和设计文档生成草稿，告知用户确认 |

收集日期时顺带核对：成立日期 < 开发完成日期 ≤ 首次发表日期（或未发表口径）、且与设计/源码材料时间线无矛盾。可拆成两轮提问以遵守「每次不超过 3 个问题」。

→ 模板占位与内置字段划分见 `references/application_form_guide.md`  
→ 若从版权中心更换新母版 `.doc`，需重新跑 `scripts/patch_template_dates_to_placeholders.py`（见该脚本说明）将固定日期改为 `{变量}` 后再回填仓库中的 `assets/application_form_template.doc`

---

## 输出目录确定规则

在生成任何文件之前，确定统一输出目录：

1. **优先**：用户明确指定的**输出根目录**（任意本机可写绝对路径）。
2. **否则**：用户随对话提供的**第一个本地材料文件**（PRD/README/草稿等）所在目录作为根目录。
3. **若仅有远端代码、无任何本机材料路径**：使用当前 Cursor **工作区根目录**作为根目录，并在对话中告知用户；若工作区不可用则追问用户给一个本机输出路径。
4. 在根目录下创建子文件夹：`软著材料_{软件简称}/`（简称由阶段三确定后填入）
   - 示例：`/path/to/output/软著材料_MySys/`
5. 使用 Bash 创建目录：
   ```bash
   mkdir -p "/path/to/output/软著材料_MySys"
   ```
6. 三份文件均保存至此目录：
   - `{软件全称}-设计文档.docx`
   - `{软件全称}-源代码.docx`
   - `{软件全称}-著作权登记申请表.docx`

7. **远端 `read` 内容的本机镜像目录**（供 `build_source_doc.py` 读取）：建议使用 `/tmp/软著_mirror_{软件简称}/`（与输出目录独立）；若用户禁止写 `/tmp`，改用输出根下的 `软著材料_{软件简称}/.mirror/`。

> 注：软件简称在阶段三收集完毕后才能确定，确定后立即创建输出目录与镜像目录（若需要）。

---

## 阶段四：生成三份材料

### 4.1 设计文档（软件说明书）

按六章结构（需求背景、核心业务对象、功能模块设计、技术架构、接口说明、运行环境）生成设计文档。

→ 加载 `references/design_doc_guide.md` 获取六章模板结构、格式要求和写作示例

**【设计文档 Word 化步骤】**

第1步：将生成的设计文档内容写入临时 Markdown 文件：
```bash
# 通过 Write 工具写入 /tmp/design_doc_${short_name}.md
```

第2步：尝试用 pandoc 转换（质量最佳，支持表格）：
```bash
pandoc /tmp/design_doc_${short_name}.md -o "${output_dir}/${full_name}-设计文档.docx"
```
- 成功 → 进入第2a步（后处理）
- 失败（pandoc 未安装）→ 进入第3步

第2a步：对 pandoc 生成的 docx 进行后处理（统一字体为微软雅黑 Light 黑色 + 表格添加黑色细线边框）：
```bash
python3 scripts/postprocess_design_doc.py \
  --input "${output_dir}/${full_name}-设计文档.docx"
```
（当前工作目录须为 skill 根目录。）
- 成功 → 完成，告知保存路径

第3步：尝试用 python-docx 创建 Word 文档（逐段写入，标题用 Heading 样式，表格用 add_table）：
```python
import docx
from docx.shared import Pt

doc = docx.Document()
# 逐段写入：标题用 doc.add_heading()，正文用 doc.add_paragraph()
# 表格用 doc.add_table(rows=..., cols=...)
doc.save(f"{output_dir}/{full_name}-设计文档.docx")
```
- 成功 → 进入第3a步（后处理）
- 失败 → 将 .md 文件复制至输出目录，告知用户手动转换

第3a步：对 python-docx 生成的 docx 进行后处理（与第2a步相同，统一字体为微软雅黑 Light 黑色 + 表格添加黑色细线边框）：
```bash
python3 scripts/postprocess_design_doc.py \
  --input "${output_dir}/${full_name}-设计文档.docx"
```
（当前工作目录须为 skill 根目录。）
- 成功 → 完成，告知保存路径

---

### 4.2 源代码文档（代码汇编）

→ 页面规格、格式规范和文件选取策略见 `references/source_code_format.md`  
→ 产品线/端、`project_id`、`search` 与镜像规则见 `references/code_context_product_map.md`

**⚠️ 重要：采用脚本生成法，禁止将源代码内容直接输出到对话（避免上下文溢出）**

**执行步骤**：

**第一步：用 code-context-query 列出候选源文件（禁止依赖本机固定源码树 Glob）**

1. 已解析的 `project_id`（阶段一）上执行 `overview`，必要时多轮 `search "<关键词>" --project <project_id> --limit 50`（关键词来自 PRD/模块名/路由），得到**仓库内相对路径**列表。
2. 按 `references/source_code_format.md` 的排除规则与选取策略，筛出「可能纳入」与「用于总行数统计」的路径集合；路径均为**远端相对路径**。

**第二步：将选定文件镜像到本机**

对每个待纳入（及计入总行数）的远端相对路径：

1. 执行 `node <code-query-path>/scripts/code_query.js read <project_id> <相对路径>` 获取正文（遵守 code-context-query 关于截断的说明）。
2. 将正文写入本机镜像根目录（见「输出目录确定规则」第 7 条），例如：`/tmp/软著_mirror_{简称}/<相对路径>`，父目录 `mkdir -p`。

**第三步：生成本机路径清单**

- `/tmp/all_source_files_${short_name}.txt`：每行一个**本机镜像绝对路径**，对应「用于统计总行数」的集合；若无法枚举远端全仓库，则与本次已镜像文件集合一致（详见 `references/code_context_product_map.md` 第四节备注行口径）。
- 按 `source_code_format.md` 决定最终纳入顺序与前后端拆分后，写入 `/tmp/source_files_${short_name}.txt`（及可选的 `--frontend-files-from` 列表，规则同 `source_code_format.md` / 脚本参数）。

**第四步：调用脚本生成 Word 文档**

```bash
python3 scripts/build_source_doc.py \
  --files-from /tmp/source_files_${short_name}.txt \
  --all-files-from /tmp/all_source_files_${short_name}.txt \
  --output "{output_dir}/${full_name}-源代码.docx"
```

若需单独的前端列表，按脚本既有参数增加 `--frontend-files-from` 等（见 `build_source_doc.py --help`）。

（当前工作目录须为 skill 根目录。）

执行成功后告知用户文件保存路径。

---

### 4.3 申请表（Word 模板填充）

使用内置模板 `assets/application_form_template.doc` 生成成品申请表文件。

---

#### 依赖准备决策树

按以下步骤准备运行环境，**全部失败时阻断任务**：

**第1步：检测 python-docx（跨平台，无需 sudo）**
```bash
python3 -c "import docx; print('ok')"
```
- 成功 → 进入第2步（格式转换）
- 失败 → 执行：`python3 -m pip install --quiet python-docx`
  - 安装成功 → 进入第2步
  - 失败（无 python3 / pip 报错）→ 尝试第1a步

**第1a步：安装 python3（先 `uname -s` 检测 OS）**
- macOS：`brew install python3`
- Ubuntu/Debian：`sudo apt-get install -y python3-pip`
- CentOS/RHEL：`sudo yum install -y python3-pip`
- Fedora：`sudo dnf install -y python3-pip`

安装后重新执行第1步；失败则进入 **阻断**。

**第2步：`.doc` → `.docx` 格式转换（LibreOffice）**

**禁止**：在 macOS 上使用 `textutil -convert docx` 处理 `assets/application_form_template.doc`。`textutil` 会把复杂表格的 `.doc` 压成极简 OOXML（成品 `.docx` 体积远小于正常转换结果，且缺少 `word/styles.xml`、`word/numbering.xml` 等），与版权中心原始模板**版式完全不一致**；占位符也可能与填充脚本预期不符。

检测 LibreOffice：
```bash
which libreoffice || which soffice
```
- **可用** → 执行转换（macOS Homebrew 常见为 `soffice`，与 `libreoffice` 等价）：
  ```bash
  libreoffice --headless --convert-to docx --outdir "${output_dir}" 'assets/application_form_template.doc 的绝对路径'
  ```
  使用 `${output_dir}/application_form_template.docx` 作为填充目标，进入填充流程。完成后删除该临时文件。
- **不可用** → 尝试安装（先 `uname -s` 检测 OS）：
  - macOS：`brew install --cask libreoffice`
  - Ubuntu/Debian：`sudo apt-get install -y libreoffice`
  - CentOS/RHEL：`sudo yum install -y libreoffice`
  - Fedora：`sudo dnf install -y libreoffice`

  安装成功后重新转换；失败则进入 **阻断**。

**🔴 阻断（所有安装均失败时）**
- 告知用户依赖安装失败，列出手动安装命令
- **停止所有后续步骤**
- 要求用户手动安装后重新启动对话：
  - 选项 A：安装 python-docx（`pip install python-docx`）+ LibreOffice
  - 选项 B：自行将 `.doc` 模板转换为 `.docx`，并提供转换后文件路径（将来版本直接支持）

---

#### 填充流程

依赖准备成功后，调用填充脚本：
```bash
python3 scripts/fill_application_form.py \
  --template ${output_dir}/application_form_template.docx \
  --name "实际软件全称" \
  --short-name "实际软件简称" \
  --features "实际主要功能文本" \
  --tech "实际技术特点文本" \
  --dev-complete-date "实际开发完成日期" \
  --first-publish-date "实际首次发表日期" \
  --output "{output_dir}/${full_name}-著作权登记申请表.docx"
```
（当前工作目录须为 skill 根目录。）

执行后确认输出"共替换 6 个 {变量} 占位符（预期为 6 个）"；若数量不符，进入下方处置流程。

**🔴 替换数量不符时的处置流程（脚本逻辑失败）**

若脚本输出替换数量 ≠ 6：

1. **禁止绕过模板**：绝对不得放弃模板从零创建新文档。模板的排版格式是申请的硬性要求，自行创建的文档格式必然不符。
1a. **禁止修改模板样式**：填充脚本仅替换 `{变量}` 文本内容，绝对不得修改模板的任何格式属性（包括但不限于：表格边框样式、字体、字号、段落间距、单元格边距）。模板的样式由版权中心规定，任何"修复"或"美化"操作都会破坏合规性。
2. **诊断根因**：通过 Python 解压 .docx 检查 XML，搜索 `变量` 关键字确认占位符是否存在但因跨 run 拆分或嵌套表格导致脚本无法识别
3. **XML 层面修复**：若确认占位符存在于 XML 中，直接操作 docx 的 XML 完成替换（解压 .docx → 正则定位每个 `<w:t>变量</w:t>` → 连同前后的 `{` `}` run 一并替换 → 重新打包为 .docx）
4. **替换后验证**：在替换后的 XML 中确认替换值已写入且无残留 `变量` 文本
5. **若 XML 中也找不到占位符**：阻断任务，告知用户模板可能已损坏，要求提供新模板

---

## 阶段五：自检与交付

生成完成后，执行以下自检：

**设计文档自检**：
- [ ] 是否包含全部 6 个章节（需求背景、业务对象、功能模块、技术架构、接口说明、运行环境）
- [ ] 业务对象是否全部用表格定义（而非段落描述）
- [ ] 功能模块是否包含5个子节（入口、展示、字段、操作、事务逻辑）
- [ ] 接口说明是否包含请求/响应参数表格

**源代码文档自检**：
- [ ] 文件标识是否清晰（每个文件开头有路径/名称）
- [ ] 文件顺序是否合理（后端核心层优先）
- [ ] 是否排除了 node_modules、dist 等无关文件（检索阶段即排除，不镜像）
- [ ] 是否标注了提交体量说明（完整/前后各30页）
- [ ] 源码是否来自用户确认的 `project_id` + 产品线/端，而非未声明的本机目录

**申请表自检**：
- [ ] 日期逻辑验证：完成日期 < 发表日期，两者均在公司成立日期之后
- [ ] 软件全称与简称不同
- [ ] 著作权人信息完整
- [ ] 成品 `.docx` 文件已保存，未匹配字段已列出并告知用户

**交付说明**：
- 三份文件均已自动保存至 `软著材料_{软件简称}/` 文件夹，输出完整路径：
  ```
  📁 {output_dir}/
  ├── {软件全称}-设计文档.docx
  ├── {软件全称}-源代码.docx
  └── {软件全称}-著作权登记申请表.docx
  ```
- 提醒用户：申请表最终需通过中国版权保护中心官网（www.ccopyright.com.cn）在线提交，三份 Word 文件直接上传即可

---

## 使用示例

用户可这样启动：

```
软著全套。产品线 TPR，产品端 管理后台。
PRD 在 /path/to/PRD.docx，输出目录 /path/to/交付物。
```

或：

```
只要源代码 Word。产品线 TP，顾客小程序。
输出到当前工作区。
```

（Agent 应：`list` → 对齐 `code_context_product_map.md` → `overview`/`search`/`read` → 镜像 → `build_source_doc.py`，**全程默认授权、连续执行**，仅在 `project_id` 歧义或环境阻断时停顿。）
