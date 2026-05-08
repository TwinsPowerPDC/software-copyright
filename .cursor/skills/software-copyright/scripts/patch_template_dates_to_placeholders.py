#!/usr/bin/env python3
"""将申请表 docx 中「开发完成日期」「首次发表日期」格内的固定年月日 runs 替换为单个 {变量}。

由 fill_application_form.py 按上下文关键词填充。本脚本用于从版权中心母版生成的
LibreOffice docx 做一次性格式修补；若母版结构大变，需同步调整下方正则。

用法：
  python3 scripts/patch_template_dates_to_placeholders.py \\
    --input path/to/application_form_template.docx \\
    --output path/to/application_form_template_patched.docx
"""

import argparse
import re
import sys
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    p.add_argument('--input', required=True, type=Path, help='LibreOffice 转换得到的 .docx')
    p.add_argument('--output', required=True, type=Path, help='写出带 {变量} 的 .docx')
    return p.parse_args()


# 开发完成日期格：无下划线的 rPr，自 <w:t>202</w:t> 起至「日」止（与首次发表区分）
RE_DEV_DATE_BLOCK = re.compile(
    r'<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    r'<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>202</w:t></w:r>'
    r'(?:<w:r>.*?</w:r>)*?'
    r'<w:r><w:rPr>.*?</w:rPr><w:t>日</w:t></w:r>',
    re.DOTALL,
)

# 首次发表日期格：带 w:u single 的日期 runs
RE_PUB_DATE_BLOCK = re.compile(
    r'<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    r'<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr>'
    r'<w:t>202</w:t></w:r>'
    r'(?:<w:r>.*?</w:r>)*?'
    r'<w:r><w:rPr>.*?</w:rPr><w:t>日[\s\u00a0]*</w:t></w:r>',
    re.DOTALL,
)

# 与模板中软件名称等字段一致：{ / 变量 / } 分三个 w:r，便于 fill_application_form.py 的 XML 路径识别
RUN_DEV_PLACEHOLDER = (
    '<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{</w:t></w:r>'
    '<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>变量</w:t></w:r>'
    '<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>}</w:t></w:r>'
)

RUN_PUB_PLACEHOLDER = (
    '<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr>'
    '<w:t>{</w:t></w:r>'
    '<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr>'
    '<w:t>变量</w:t></w:r>'
    '<w:r><w:rPr><w:rFonts w:cs="宋体;SimSun" w:ascii="宋体;SimSun" w:hAnsi="宋体;SimSun"/>'
    '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr>'
    '<w:t>}</w:t></w:r>'
)


def main():
    args = parse_args()
    if not args.input.exists():
        print(f'错误：找不到输入文件 {args.input}', file=sys.stderr)
        sys.exit(1)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    import zipfile

    with zipfile.ZipFile(args.input, 'r') as zin:
        xml = zin.read('word/document.xml').decode('utf-8')
        others = [(n, zin.read(n)) for n in zin.namelist() if n != 'word/document.xml']

    m_dev = RE_DEV_DATE_BLOCK.search(xml)
    if not m_dev:
        print('错误：未匹配到「开发完成日期」格内的日期 runs，母版可能已变更', file=sys.stderr)
        sys.exit(2)
    xml, n_dev = RE_DEV_DATE_BLOCK.subn(RUN_DEV_PLACEHOLDER, xml, count=1)
    if n_dev != 1:
        print('错误：开发完成日期替换次数异常', file=sys.stderr)
        sys.exit(2)

    m_pub = RE_PUB_DATE_BLOCK.search(xml)
    if not m_pub:
        print('错误：未匹配到「首次发表日期」格内的日期 runs，母版可能已变更', file=sys.stderr)
        sys.exit(2)
    xml, n_pub = RE_PUB_DATE_BLOCK.subn(RUN_PUB_PLACEHOLDER, xml, count=1)
    if n_pub != 1:
        print('错误：首次发表日期替换次数异常', file=sys.stderr)
        sys.exit(2)

    var_count = xml.count('<w:t>变量</w:t>')
    if var_count != 6:
        print(
            f'错误：document.xml 中 <w:t>变量</w:t> 出现 {var_count} 次，预期 6（4 个原有 + 2 个日期）',
            file=sys.stderr,
        )
        sys.exit(3)

    with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED) as zout:
        zout.writestr('word/document.xml', xml.encode('utf-8'))
        for name, data in others:
            zout.writestr(name, data)

    print(str(args.output), file=sys.stderr)


if __name__ == '__main__':
    main()
