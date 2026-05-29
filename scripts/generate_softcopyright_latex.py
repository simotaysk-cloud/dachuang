

from __future__ import annotations



from datetime import datetime

from pathlib import Path





PROJECT_ROOT = Path(__file__).resolve().parents[1]

OUTPUT_DIR = PROJECT_ROOT / "output" / "doc"



TEXT_SOURCE = OUTPUT_DIR / "软著源码正文-60页.txt"

MANIFEST_SOURCE = OUTPUT_DIR / "软著源码抽取说明.md"



TEX_TARGET = OUTPUT_DIR / "软著源码文档-标准版.tex"

PDF_TARGET = OUTPUT_DIR / "软著源码文档-标准版.pdf"



SOFTWARE_NAME = "药途寻迹中药材全过程溯源管理系统"

SOFTWARE_VERSION = "V2.0"

DOCUMENT_DATE = datetime.now().strftime("%Y-%m-%d")

LINES_PER_PAGE = 50





def escape_tex(text: str) -> str:

    replacements = {

        "\\": r"\textbackslash{}",

        "{": r"\{",

        "}": r"\}",

        "$": r"\$",

        "&": r"\&",

        "#": r"\#",

        "%": r"\%",

        "_": r"\_",

        "^": r"\^{}",

        "~": r"\~{}",

    }

    return "".join(replacements.get(ch, ch) for ch in text)





def build_body_pages(lines: list[str]) -> str:

    chunks: list[str] = []

    for index, line in enumerate(lines, start=1):

        chunks.append(escape_tex(line) + r"\\")

        if index % LINES_PER_PAGE == 0 and index != len(lines):

            chunks.append(r"\newpage")

    return "\n".join(chunks)





def parse_manifest_stats(manifest_text: str) -> dict[str, str]:

    stats: dict[str, str] = {}

    for raw_line in manifest_text.splitlines():

        line = raw_line.strip()

        if line.startswith("- 软件版本："):

            stats["version"] = line.removeprefix("- 软件版本：")

        elif line.startswith("- 生成日期："):

            stats["date"] = line.removeprefix("- 生成日期：")

        elif line.startswith("- 纳入统计的源码文件数："):

            stats["files"] = line.removeprefix("- 纳入统计的源码文件数：")

        elif line.startswith("- 纳入统计的源码总行数："):

            stats["lines"] = line.removeprefix("- 纳入统计的源码总行数：")

        elif line.startswith("- 抽取正文行数："):

            stats["excerpt"] = line.removeprefix("- 抽取正文行数：")

    return stats





def build_tex_document(body: str, stats: dict[str, str]) -> str:

    version = escape_tex(stats.get("version", SOFTWARE_VERSION))

    date = escape_tex(stats.get("date", DOCUMENT_DATE))

    files = escape_tex(stats.get("files", ""))

    lines = escape_tex(stats.get("lines", ""))

    excerpt = escape_tex(stats.get("excerpt", "3000"))



    return rf"""\documentclass[11pt,a4paper]{ article}
\usepackage[a4paper,top=1.5cm,bottom=1.5cm,left=1.3cm,right=1.3cm]{ geometry}
\usepackage{ fontspec}
\pagestyle{ plain}
\setmainfont{ Songti SC}
\setsansfont{ Heiti SC}
\setmonofont{ Menlo}
\setlength{ \parindent} { 0pt}
\setlength{ \parskip} { 0pt}
\newfontfamily\titlefont{ Heiti SC}
\begin{ document}

\begin{ titlepage}
\centering
\vspace*{ 3cm}
{ \titlefont\fontsize{ 22pt} { 28pt} \selectfont {escape_tex(SOFTWARE_NAME)}\par}
\vspace{ 0.8cm}
{ \titlefont\fontsize{ 18pt} { 24pt} \selectfont 源代码文档\par}
\vspace{ 2cm}
\begin{ flushleft}
\fontsize{ 13pt} { 20pt} \selectfont
软件版本：{version}\par
\vspace{ 0.4cm}
整理日期：{date}\par
\vspace{ 0.4cm}
源码文件数：{files}\par
\vspace{ 0.4cm}
源码总行数：{lines}\par
\vspace{ 0.4cm}
抽取正文行数：{excerpt}\par
\vspace{ 0.4cm}
抽取规则：按相对路径排序，抽取前 30 页和后 30 页，每页 50 行\par
\vspace{ 0.4cm}
正文格式：文件编号:文件内行号\quad 源码内容\par
\vspace{ 0.4cm}
配套说明：同目录《软著源码抽取说明.md》\par
\end{ flushleft}
\vfill
\end{ titlepage}

\fontsize{ 8pt} { 10.5pt} \selectfont
{body}

\end{ document}
"""





def main() -> None:

    if not TEXT_SOURCE.exists():

        raise SystemExit(f"缺少正文文本文件：{TEXT_SOURCE}")



    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)



    text_lines = TEXT_SOURCE.read_text(encoding="utf-8").splitlines()

    manifest_text = MANIFEST_SOURCE.read_text(encoding="utf-8") if MANIFEST_SOURCE.exists() else ""

    stats = parse_manifest_stats(manifest_text)

    body = build_body_pages(text_lines)

    TEX_TARGET.write_text(build_tex_document(body, stats), encoding="utf-8")

    print(f"已生成：{TEX_TARGET}")





if __name__ == "__main__":

    main()
