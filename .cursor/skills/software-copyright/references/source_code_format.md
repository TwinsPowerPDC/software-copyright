# 源代码文档格式规范

本文档基于真实软著申请材料（4份源代码示例）分析整理，为生成符合提交要求的源代码文档提供精确规范。

---

## 一、页面规格

| 项目 | 规格 |
|------|------|
| 纸张 | A4（210mm × 297mm） |
| 每页行数 | 约 40-44 行（空行和代码行均计） |
| 平均行宽 | 约 47 字符（含缩进空格） |
| 页眉 | ❌ 无页眉 |
| 页脚 | ❌ 无页脚 |
| 页码 | ❌ 无页码 |

---

## 二、代码格式规范

| 项目 | 规范 |
|------|------|
| 行号 | ❌ 无行号（与开发工具中的显示不同） |
| 语法高亮 | ❌ 无语法着色，纯黑色文本 |
| 字体 | 微软雅黑 Light（文件标识行和代码内容统一使用，黑色文字） |
| 缩进 | 保留原始代码缩进（通常为2或4个空格） |
| 空行 | 保留原始代码中的空行 |
| 注释 | 保留所有注释（中英文均保留） |

---

## 三、文件组织规范

### 3.1 文件标识行

每个源代码文件开头，使用**单独一行**作为文件标识，格式为文件路径或文件名：

```
SalesClueQueryServiceImpl.java
```

或（含相对路径）：

```
src/main/java/com/example/service/impl/SalesClueQueryServiceImpl.java
```

或前端文件：

```
components/ClueList/index.tsx
```

**规范说明**：
- 文件标识与代码内容之间**不加分隔符**（不用 `---` 或 `===`）
- 文件标识行本身使用常规字体（非代码字体），居左显示
- 文件标识行后**直接**跟代码内容，不加空行（或加一个空行分隔）

### 3.2 文件顺序

**推荐顺序**（从后端核心层到前端，由内而外）：

**后端（Java/Node.js）**：
1. 核心 Service 接口及实现类（业务逻辑层）
2. Repository/DAO/Mapper 层（数据访问层）
3. Controller 层（接口层）
4. 实体类/DTO/VO（数据对象）
5. 工具类/配置类

**前端（React/Vue）**：
6. 页面入口组件（主要页面）
7. 核心业务组件
8. API 调用层（service/api 目录）
9. 工具函数/hooks

**微信小程序**：
10. app.js + app.json（全局配置）
11. 核心页面（pages 目录）
12. 自定义组件（components 目录）

### 3.3 排除规则

以下文件/目录**不得**包含在源代码文档中：

| 排除类型 | 示例 |
|----------|------|
| 依赖目录 | `node_modules/`、`.m2/` |
| 构建产物 | `dist/`、`build/`、`target/` |
| 版本控制 | `.git/`、`.gitignore` |
| 图片/字体/二进制 | `*.png`、`*.jpg`、`*.ttf`、`*.woff` |
| 配置文件（非核心） | `*.config.js`、`webpack.config.js`、`jest.config.js` |
| 测试文件（可选排除） | `*.test.ts`、`*.spec.js`、`__tests__/` |
| 环境配置 | `.env`、`.env.local` |
| 锁文件 | `package-lock.json`、`yarn.lock`、`pom.xml` |

---

## 四、提交体量说明

### 4.1 截取目标

截取代码行数目标 **≥ 3500 行**（42行/页 × 84页 ≈ 3528，取整 3500）。若项目总行数不足 3500 则全部放入。

> 「代码总行数」口径：排除 node_modules、dist、.git 等无关文件后的源代码行数。

**参考体量**（基于真实案例）：
- 一个中型 Web 管理系统（Java 后端 + React 前端）：约 90-131 页
- 每页约 40 行代码，即约 3600-5240 行核心代码

### 4.2 超大型项目

**判断标准**：核心源文件数量 ≥ 200 个

**提交方式**：遵循官方要求，**前后各30页**

- 前30页：按文件顺序从头取，完整取若干个文件（不截断文件中间）
- 后30页：从最后向前取若干个文件（不截断文件中间）
- 中间部分省略，可在省略处加一行说明："[…省略中间部分代码…]"

**每页行数参考**：约 40-44 行，共约 1200-1320 行（前后合计）

---

## 五、输出格式

**生成时**：使用 Markdown 代码块格式输出，便于查看和复制：

````markdown
SalesClueQueryServiceImpl.java

```java
package com.example.service.impl;

import com.example.entity.SalesClue;
// ... 其余代码
```

SalesClueMapper.java

```java
package com.example.mapper;
// ... 其余代码
```
````

**提交时**：用户需将代码内容粘贴到 Word 文档，设置等宽字体（Courier New），字号8-10pt，以符合A4纸每页40-44行的密度要求。

---

## 六、实际文档示例（结构参考）

以下展示3个文件的标识和结构（内容省略，仅示意格式）：

```
SalesClueQueryServiceImpl.java

package com.slm.sales.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.slm.sales.entity.SalesClue;
import com.slm.sales.mapper.SalesClueMapper;
import com.slm.sales.service.SalesClueQueryService;
import com.slm.sales.vo.SalesClueQueryVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 销售线索查询服务实现类
 */
@Slf4j
@Service
public class SalesClueQueryServiceImpl implements SalesClueQueryService {

    @Autowired
    private SalesClueMapper salesClueMapper;

    @Override
    public Page<SalesClue> queryPage(SalesClueQueryVO queryVO) {
        Page<SalesClue> page = new Page<>(queryVO.getPage(), queryVO.getSize());
        QueryWrapper<SalesClue> wrapper = new QueryWrapper<>();
        if (StringUtils.hasText(queryVO.getKeyword())) {
            wrapper.like("company_name", queryVO.getKeyword())
                   .or()
                   .like("contact_name", queryVO.getKeyword());
        }
        if (queryVO.getStatus() != null) {
            wrapper.eq("status", queryVO.getStatus());
        }
        wrapper.orderByDesc("create_time");
        return salesClueMapper.selectPage(page, wrapper);
    }
}

SalesClueMapper.java

package com.slm.sales.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.slm.sales.entity.SalesClue;
import org.apache.ibatis.annotations.Mapper;

/**
 * 销售线索数据访问接口
 */
@Mapper
public interface SalesClueMapper extends BaseMapper<SalesClue> {
}

components/ClueList/index.tsx

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getClueList } from '@/api/clue';
import type { SalesClue } from '@/types/clue';

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待分配', color: 'default' },
  1: { label: '跟进中', color: 'processing' },
  2: { label: '已成单', color: 'success' },
  3: { label: '已放弃', color: 'error' },
};

const ClueList: React.FC = () => {
  const [data, setData] = useState<SalesClue[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getClueList({ page, size: 10 });
      setData(res.data.records);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };
  // ... 其余组件代码
};

export default ClueList;
```

---

## 八、文档头部备注

源代码文档的**第一行**为备注行，说明系统代码总行数和当前文档截取的代码行数。备注后空一行，再开始代码内容。

**两种场景**：

| 场景 | 备注内容 |
|------|---------|
| 项目总行数 ≥ 3500，截取 ≥ 3500 行 | `本系统代码总行数：{total_lines} 行；本文档截取代码行数：{doc_lines} 行。` |
| 项目总行数 < 3500，全部放入 | `本系统代码总行数：{total_lines} 行；已全部放入本文档。` |

**格式**：微软雅黑 Light，10pt，黑色（与文件标识行一致）。

---

## 七、文件选取策略（供 AI 参考）

**代码来源**：默认通过 **code-context-query**（远端 `list` / `overview` / `search` / `read`）按用户声明的产品线（TP/TPR）与产品端定位仓库与路径；详细流程与 `project_id` 映射见主 Skill `references/code_context_product_map.md` 与阶段 4.2。选取完成后将内容镜像到本机再调用 `build_source_doc.py`，**不要用本机 Glob 替代**对远端仓库的检索（除非用户明确要求仅以某本地目录为准，则须在对话中记录该例外）。

读取（或镜像后的）项目源代码时，按以下策略选取文件：

1. **后端 Service 层**：选取业务最复杂的3-5个 Service 实现类（通常是核心模块的）
2. **后端 Mapper/Repository**：与选中的 Service 对应的 Mapper 接口
3. **后端 Controller**：选取接口数量最多的2-3个 Controller
4. **后端实体类**：选取最重要的3-5个实体类（对应核心业务对象）
5. **前端页面**：选取功能最复杂的3-5个页面组件
6. **前端 API 层**：所有 API 调用文件（通常较短，全部包含）
7. **小程序核心页面**：选取2-3个功能页面

**估算页数**：每个 Service 实现类约2-5页，每个 Controller 约2-3页，每个前端组件约2-4页。提前估算总页数，调整文件数量以满足体量要求。
