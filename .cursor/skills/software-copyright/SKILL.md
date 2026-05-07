---
name: software-copyright
description: >-
  Generates China software copyright (软著) registration materials: design specification
  (软件说明书), source code Word assembly, and application form filling from the bundled
  template. Use when the user mentions 软著, 软件著作权, 软件版权, 版权登记, 申请版权,
  软著材料, 源代码文档, 设计文档, or CCPC / 中国版权保护中心 submission.
disable-model-invocation: true
---

# 软件著作权申请材料生成 Skill

## Cursor：布局与路径

- 本条目为 **项目级** Cursor Agent Skill，目录为 `.cursor/skills/software-copyright/`，与 `SKILL.md` 同级包含 `references/`、`scripts/`、`assets/`。
- **skill 根目录**：即本 `SKILL.md` 所在目录。文中所有 `references/`、`scripts/`、`assets/` 均相对于该根目录。
- 在 Shell 中执行 `python3 scripts/...` 或向 LibreOffice 传入 `assets/application_form_template.doc` 时：**先 `cd` 到 skill 根目录**，或把这些路径换成由 skill 根目录展开的**绝对路径**（避免在用户项目根目录误跑脚本）。
- 加载方式：在对话中 `@software-copyright`，或依赖上方 `description` 中的触发词由模型拉取本 skill。

## 概述

本 Skill 协助用户生成中国软件著作权登记所需的全套申请材料，支持各类技术栈的软件项目（Web 应用、微信小程序、移动 App、桌面应用等）。用户提供源代码目录、README、已有草稿等材料，AI 全程协助生成：

1. **设计文档**（软件说明书）——结构化表格形式
2. **源代码文档**——前后各30页或完整源码汇编
3. **申请表填写指引**——逐字段填写说明

**参考文档**（按需加载）：
- `references/design_doc_guide.md` — 设计文档章节写作规范与指南
- `references/application_form_guide.md` — 申请表全字段填写指南
- `references/source_code_format.md` — 源代码文档格式规范
- `references/material_checklist.md` — 项目材料完整性检查清单

## 核心原则：文档审核安全性

**三份最终交付文档（设计文档、源代码文档、申请表）是直接提交给中国版权保护中心审核的正式材料。**

必须遵守以下铁律：

1. **零标注**：最终文档中严禁出现任何待修订标注，包括但不限于：`（推断值，请核实）`、`（建议值，可修改）`、`⚠️ 待补充`、`TODO`、`FIXME`、`[待确认]`、`___`（空白占位）等。审核人员看到此类标注会直接退回申请。
2. **零占位符**：最终文档中不得残留任何 `{变量}`、`{{xxx}}`、`<待填写>` 等模板占位符。
3. **零对话痕迹**：最终文档中不得出现任何 AI 对话痕迹（如"根据您的描述"、"建议您确认"等措辞）。
4. **先确认后写入**：对于任何不确定的信息（推断的业务含义、模糊的技术细节、缺失的字段说明等），**必须在生成文档之前通过对话向用户确认**，确认后以确定的内容写入文档。绝不允许将不确定性"传递"到文档中让用户事后修改。
5. **宁可追问不猜测**：当推断置信度不足时，暂停生成、向用户提问，而非在文档中留下标注。每次追问控制在 1-3 个问题。

---

## 阶段一：读取并盘点现有材料

按以下优先级顺序读取用户提供的材料：

1. **已有草稿**：了解哪些章节已完成、哪些有缺漏，避免重复劳动
2. **产品需求文档 / PRD**：提取功能模块描述和业务场景
3. **已有设计文档**：了解现有描述口径，保持一致性
4. **核心源代码文件**：理解模块结构、技术实现、接口设计
5. **配置文件**：`package.json`、`pom.xml`、`app.json`——获取技术栈和版本
6. **README 和其他说明文件**：补充背景信息

**读取策略**：
- 大型项目不必读取每个文件，优先读取代表性文件（各层各1-2个）
- 重点关注：函数签名、类名、接口路径、注释说明
- 读取完成后，在内部整理出：功能模块列表、技术栈、主要数据对象、核心接口

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

需要向用户收集的字段（共 4 个）：

| 字段 | 说明 | 处理方式 |
|------|------|---------|
| 软件全称 | **MUST** 以"影能科技"为前缀，不含版本号，如"影能科技智慧园区管理系统" | 向用户询问，生成的候选名称必须以"影能科技"开头 |
| 软件简称 | 3-10字，不能与全称完全相同，**MUST NOT** 包含"影能科技" | 向用户询问，若用户提供的简称含"影能科技"则提醒修改 |
| 软件的主要功能 | 100-300字，按模块列点描述实现了什么 | 根据代码和设计文档生成草稿，告知用户确认 |
| 软件的技术特点 | 50-150字，列举3-5个技术亮点 | 根据代码和设计文档生成草稿，告知用户确认 |

→ 模板内置值字段详情见 `references/application_form_guide.md`

---

## 输出目录确定规则

在生成任何文件之前，确定统一输出目录：

1. 取用户提供的**第一个/主要材料路径**所在目录作为根目录
   - 若用户提供 `/path/to/project/src`，则根目录为 `/path/to/project/src`
   - 若用户提供 `/path/to/project`，则根目录为 `/path/to/project`
2. 在根目录下创建子文件夹：`软著材料_{软件简称}/`（简称由阶段三确定后填入）
   - 示例：`/path/to/project/软著材料_MySys/`
3. 使用 Bash 创建目录：
   ```bash
   mkdir -p "/path/to/project/软著材料_MySys"
   ```
4. 三份文件均保存至此目录：
   - `{软件全称}-设计文档.docx`
   - `{软件全称}-源代码.docx`
   - `{软件全称}-著作权登记申请表.docx`

> 注：软件简称在阶段三收集完毕后才能确定，确定后立即创建输出目录。

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

**⚠️ 重要：采用脚本生成法，禁止将源代码内容直接输出到对话（避免上下文溢出）**

**执行步骤**：

**第一步：使用 Glob 工具列出目录结构（只看文件清单，不读文件内容）**

使用 `Glob` 工具扫描项目目录，获取所有源代码文件路径清单（排除 node_modules、.git、dist/build、图片/字体/二进制、*.config.js）。

将 Glob 扫描得到的**所有**源代码文件路径写入 `/tmp/all_source_files_${short_name}.txt`（每行一个绝对路径），用于脚本统计项目代码总行数。

**第二步：根据清单决定纳入文件**

按 `references/source_code_format.md` 中的选取策略和文件顺序规范，构建有序的 `files_to_include` 列表。目标总行数 ≥ 3500 行；若项目源代码不足 3500 行则全部选入。

**第三步：调用脚本生成 Word 文档**

先将选定的文件列表写入临时文件（每行一个绝对路径）：
通过 Write 工具写入 `/tmp/source_files_${short_name}.txt`

然后执行：
```bash
python3 scripts/build_source_doc.py \
  --files-from /tmp/source_files_${short_name}.txt \
  --all-files-from /tmp/all_source_files_${short_name}.txt \
  --output "{output_dir}/${full_name}-源代码.docx"
```
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

检测 LibreOffice：
```bash
which libreoffice || which soffice
```
- **可用** → 执行转换：
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
  --output "{output_dir}/${full_name}-著作权登记申请表.docx"
```
（当前工作目录须为 skill 根目录。）

执行后确认输出"共替换 4 个 {变量} 占位符（预期为 4 个）"；若数量不符，进入下方处置流程。

**🔴 替换数量不符时的处置流程（脚本逻辑失败）**

若脚本输出替换数量 ≠ 4：

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
- [ ] 是否排除了 node_modules、dist 等无关文件
- [ ] 是否标注了提交体量说明（完整/前后各30页）

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
我需要为一个 Spring Boot + React 的企业管理系统申请软著。
项目源码在 /path/to/project，已有 README 说明文档。
帮我生成全套软著申请材料。
```

或：
```
帮我生成软著的源代码文档，项目是微信小程序+Node.js后端。
代码目录：/path/to/miniprogram
```
