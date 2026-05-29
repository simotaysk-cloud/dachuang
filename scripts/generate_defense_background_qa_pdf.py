from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUT_DIR / "答辩背景与需求分析评委问答.pdf"


pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def p(text: str, style: ParagraphStyle):
    return Paragraph(text.replace("\n", "<br/>"), style)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CNTitle",
        fontName="STSong-Light",
        fontSize=24,
        leading=32,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#163B2F"),
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="CNSubtitle",
        fontName="STSong-Light",
        fontSize=11.5,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#5F6F67"),
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        fontName="STSong-Light",
        fontSize=15,
        leading=22,
        textColor=colors.HexColor("#163B2F"),
        spaceBefore=14,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCN",
        fontName="STSong-Light",
        fontSize=10.5,
        leading=17,
        alignment=TA_JUSTIFY,
        firstLineIndent=0,
        textColor=colors.HexColor("#24352E"),
    )
)
styles.add(
    ParagraphStyle(
        name="SmallCN",
        fontName="STSong-Light",
        fontSize=9.2,
        leading=14,
        textColor=colors.HexColor("#516158"),
    )
)
styles.add(
    ParagraphStyle(
        name="Question",
        fontName="STSong-Light",
        fontSize=11.5,
        leading=17,
        textColor=colors.HexColor("#12362B"),
        spaceBefore=7,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="Answer",
        fontName="STSong-Light",
        fontSize=10.2,
        leading=16,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#2D3A35"),
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        fontName="STSong-Light",
        fontSize=9.5,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.white,
    )
)
styles.add(
    ParagraphStyle(
        name="TableBody",
        fontName="STSong-Light",
        fontSize=9.1,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#24352E"),
    )
)


questions = [
    (
        "为什么选择中药材溯源这个方向？是不是需求太窄？",
        "中药材不是普通农产品，它同时涉及产地、种植、加工、质检、流通和消费者信任。传统纸质台账和普通二维码只能展示信息，但很难证明数据有没有被改过，也难以支持多角色协同。我们选择这个方向，是因为中药材产业链长、主体多、质量信任要求高，正好适合用移动端采录、标准编码和链上存证来解决。",
    ),
    (
        "政策背景和系统有什么直接关系？",
        "政策背景说明的是产业升级方向，不是说政策本身等于需求。我们的系统对应的是政策落地中的具体工具：帮助种植、加工、质检、物流环节形成标准化数据；让监管或企业能追踪批次；让消费者扫码看到可信信息，从而服务区域品牌建设和农户增收。",
    ),
    (
        "PPT 里有“500 个基地、覆盖率不足 25%”，这个数据可靠吗？",
        "这部分 PPT 已标注“非官方认证”，主要作为调研背景参考，不作为系统成败的硬性统计依据。我们真正想说明的是：中药材种植主体多、分散度高、标准化采录不足，这个痛点在实际产业中普遍存在。答辩中应强调需求逻辑，不把这个数字作为官方结论。",
    ),
    (
        "已有很多二维码溯源系统，你们和普通扫码查询有什么区别？",
        "普通二维码更多是把已有信息展示出来，核心问题是信息来源和后续修改难以验证。我们的差异在三点：第一，B/G 端从种植、加工、质检、物流环节采集批次数据；第二，采用 GS1-128 标准化编码，避免私有码不互通；第三，关键数据提取哈希摘要后上链，消费者或监管端可以做链上链下校验。所以二维码只是入口，背后是批次数据闭环。",
    ),
    (
        "为什么一定要区块链？数据库加权限不够吗？",
        "数据库负责业务管理，区块链负责防篡改证明，两者作用不同。数据库可以被管理员或系统权限修改，所以我们不是把所有业务数据都放到链上，而是把关键数据生成 Hash 摘要并上链。后续只要链下数据被改动，重新计算的 Hash 就对不上链上记录。这样成本更低，也避免隐私和大数据量上链问题。",
    ),
    (
        "你们能保证源头数据绝对真实吗？比如农户一开始就填假数据怎么办？",
        "系统不能替代现实中的监管和抽检，也不能保证人一开始不造假。我们的目标是降低造假空间、提高追责能力：通过角色权限、时间戳、定位采集、质检报告上传、批次流转记录和链上哈希锁定，让数据一旦进入系统后更难被无痕修改。也就是说，我们解决的是过程可信和事后可核验，而不是宣称完全消灭人为造假。",
    ),
    (
        "PPT 里写“强制 GPS 地理围栏”，真的能防止异地伪造吗？",
        "更准确地说，目前实现的是关键操作的定位采集和定位取证，通过微信定位权限获取经纬度并随记录保存。它能增强产地记录可信度，但严格的地理围栏，比如半径边界、多边形区域和越界拦截，是后续可以扩展的能力。答辩时应表述为“GPS 定位取证”，避免说成已经完整实现地理围栏监管。",
    ),
    (
        "为什么要分 C 端和 B/G 端两个小程序？一个系统不行吗？",
        "两类用户的使用场景完全不同。消费者只需要扫码、看溯源、问 AI，界面要轻；生产管理端则要录入表单、管理批次、质检、物流、上链，权限和流程更复杂。如果混在一个端里，会让消费者使用门槛变高，也会让企业端权限混乱。所以我们采用双端分离，但后端数据统一。",
    ),
    (
        "你们的真实用户是谁？谁会愿意用？",
        "系统面向两类用户：B/G 端包括药农、合作社、加工厂、质检人员、物流人员和监管方，他们需要规范采录和管理批次；C 端是消费者，需要扫码了解来源、质检和使用建议。真正付费或部署主体更可能是中药材企业、合作社、地方产业园或监管/示范项目，因为他们有品牌建设、质量追溯和标准化管理的需求。",
    ),
    (
        "AI 问答是不是为了炫技？和溯源需求有什么关系？",
        "AI 不是项目的核心可信机制，核心仍然是溯源数据和防篡改。AI 的作用是把冷冰冰的溯源数据转化为消费者能理解的药材科普和使用建议，例如结合当前批次、产地、品类回答怎么食用、注意什么。我们不会把它定位成医疗诊断，而是定位为药材科普与消费咨询助手。",
    ),
    (
        "你们说“道地药材”，系统怎么证明它是道地的？",
        "系统本身不直接给出“道地”结论，而是提供支撑判断的证据链，包括产地、种植记录、加工质检、物流、批次编码和链上存证。真正的道地认定还需要地方标准、企业资质、检测报告或监管背书。我们的价值是把这些证据结构化、可追溯、可验证地呈现出来。",
    ),
    (
        "需求分析里最大的痛点到底是哪一个？",
        "可以概括成三个痛点：第一，生产端数据分散，纸质或孤岛系统导致协同效率低；第二，消费者端信任弱，扫码看到的信息难以证明没有被改；第三，编码和数据标准不统一，后续监管、品牌化和跨企业流通困难。系统分别用双端协同、链上哈希存证和 GS1 标准赋码来回应这三个痛点。",
    ),
]

safe_wording = [
    ("不要说", "更稳的说法"),
    ("绝对防伪、彻底杜绝造假", "提高篡改成本和核验能力"),
    ("AI 问诊、医疗诊断", "AI 药材科普与消费咨询"),
    ("链上密文、所有业务数据上链", "链上哈希锚定，链下保存业务明文"),
    ("完整微服务架构、微服务网关", "模块化 Spring Boot 后端，预留微服务拆分空间"),
    ("强制 GPS 地理围栏已经实现", "关键节点 GPS 定位取证"),
]


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("STSong-Light", 8.5)
    canvas.setFillColor(colors.HexColor("#6B756F"))
    canvas.drawString(18 * mm, 12 * mm, "药途寻迹 - 答辩背景与需求分析问答")
    canvas.drawRightString(192 * mm, 12 * mm, f"{doc.page}")
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#F3F7F2"))
    canvas.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#163B2F"))
    canvas.rect(0, A4[1] - 42 * mm, A4[0], 42 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#D5A84B"))
    canvas.rect(0, A4[1] - 44 * mm, A4[0], 2 * mm, stroke=0, fill=1)
    canvas.restoreState()


def build_story():
    story = []
    story.append(Spacer(1, 42 * mm))
    story.append(p("药途寻迹", styles["CNTitle"]))
    story.append(p("背景与需求分析 - 评委高频追问及答辩口径", styles["CNSubtitle"]))
    story.append(Spacer(1, 18 * mm))
    intro = (
        "本稿根据答辩 PPT 与项目书的背景、痛点和需求分析内容整理。答辩主线应收敛为："
        "药途寻迹不是单纯做一个扫码页面，而是围绕中药材从种植、加工、质检、物流到消费者查询的长链条需求，"
        "用双端小程序完成数据采录和展示，用 GS1 解决编码标准化，用区块链哈希锚定解决数据被改后难以发现的问题，"
        "再用 AI 把溯源信息转化成消费者能理解的药材科普服务。"
    )
    story.append(
        Table(
            [[p(intro, styles["BodyCN"])]],
            colWidths=[162 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#D8E2DA")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            ),
        )
    )
    story.append(Spacer(1, 12 * mm))
    story.append(p("答辩原则：不要把项目说成万能医疗或绝对防伪系统，而是说成“中药材产业链可信采录、标准赋码、消费者可验证”的数字化工具。", styles["SmallCN"]))
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())

    story.append(p("一、高概率追问与建议回答", styles["Section"]))
    for idx, (q, a) in enumerate(questions, 1):
        story.append(
            KeepTogether(
                [
                    p(f"{idx}. {q}", styles["Question"]),
                    p(f"建议回答：{a}", styles["Answer"]),
                    Spacer(1, 4),
                ]
            )
        )

    story.append(p("二、容易被追问的表述", styles["Section"]))
    rows = [[p(c, styles["TableHead"]) for c in safe_wording[0]]]
    for left, right in safe_wording[1:]:
        rows.append([p(left, styles["TableBody"]), p(right, styles["TableBody"])])
    table = Table(rows, colWidths=[72 * mm, 86 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E4B3B")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FAFCFA")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CAD7CF")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 8))
    story.append(p("现场回答时，优先用“已实现能力 + 边界说明 + 后续扩展”三段式，避免被评委抓住夸大表述继续追问。", styles["SmallCN"]))
    return story


def main():
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="药途寻迹背景与需求分析评委问答",
        author="Codex",
    )
    body_frame = Frame(doc.leftMargin, doc.bottomMargin + 4 * mm, doc.width, doc.height - 8 * mm, id="body")
    cover_frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="cover")
    doc.addPageTemplates(
        [
            PageTemplate(id="Cover", frames=[cover_frame], onPage=cover),
            PageTemplate(id="Body", frames=[body_frame], onPage=header_footer),
        ]
    )
    doc.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
