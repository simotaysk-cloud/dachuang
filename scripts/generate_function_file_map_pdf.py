from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUT_DIR / "药途寻迹-功能对应文件清单.pdf"

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def para(text, style):
    return Paragraph(escape(text).replace("\n", "<br/>"), style)


def paths(items):
    return "\n".join(items)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleCN",
        fontName="STSong-Light",
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#143B2E"),
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="SubtitleCN",
        fontName="STSong-Light",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#5E6B64"),
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCN",
        fontName="STSong-Light",
        fontSize=8.4,
        leading=11.6,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#23352F"),
    )
)
styles.add(
    ParagraphStyle(
        name="SmallCN",
        fontName="STSong-Light",
        fontSize=7.2,
        leading=9.6,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#2D3A35"),
    )
)
styles.add(
    ParagraphStyle(
        name="HeadCN",
        fontName="STSong-Light",
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.white,
    )
)


rows = [
    (
        "核心",
        "系统入口与运行配置",
        paths(
            [
                "README.md",
                "project.config.json",
                "前端代码/miniprogram-5/project.config.json",
                "前端代码/miniprogram-5/src/app.json",
                "前端代码/miniprogram-5/src/app.js",
                "后端代码/springboot/pom.xml",
                "后端代码/springboot/src/main/java/com/example/dachuang/DachuangApplication.java",
                "后端代码/springboot/src/main/resources/application.yml",
                "后端代码/springboot/src/main/resources/db/migration/*.sql",
            ]
        ),
        "决定项目如何启动、有哪些页面、后端端口与依赖、数据库结构如何建立。README 是理解项目定位和部署方式的第一入口。",
    ),
    (
        "核心",
        "前后端接口通信",
        paths(
            [
                "前端代码/miniprogram-5/src/utils/api.js",
                "前端代码/miniprogram-5/src/utils/config.js",
                "前端代码/miniprogram-5/src/utils/rbac.js",
                "前端代码/miniprogram-5/src/utils/util.js",
                "后端代码/springboot/src/main/java/com/example/dachuang/common/api/Result.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/common/exception/*.java",
            ]
        ),
        "封装请求地址、Token、角色、业务错误、401 过期跳转、文件上传和统一返回格式，是小程序页面调用后端的公共通道。",
    ),
    (
        "核心",
        "登录认证与多角色权限",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/login/*",
                "前端代码/miniprogram-5/src/pages/user-mgmt/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/auth/controller/AuthController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/auth/controller/UserController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/auth/service/*.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/auth/entity/User.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/config/AuthInterceptor.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/config/WebMvcConfig.java",
            ]
        ),
        "负责账号登录、JWT 校验、用户角色、用户管理和接口访问控制，是管理员、农户、加工、物流、监管等角色分权的基础。",
    ),
    (
        "核心",
        "批次建档与 GS1 编码",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/batch/*",
                "前端代码/miniprogram-5/src/pages/batch-form/*",
                "前端代码/miniprogram-5/src/pages/terminal-qrcode/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/BatchController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/BatchService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/Gs1Service.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/QrCodeService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/code/*.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/Batch.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/BatchLineage.java",
            ]
        ),
        "批次是溯源主对象。这里负责创建批次、生成二维码、生成或锁定 GS1 编码、维护父子批次关系和叶子批次导出。",
    ),
    (
        "核心",
        "种植环节记录",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/planting/*",
                "前端代码/miniprogram-5/src/pages/planting-form/*",
                "前端代码/miniprogram-5/src/pages/planting-dashboard/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/PlantingRecordController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/PlantingRecordService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/PlantingRecord.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/repository/PlantingRecordRepository.java",
                "后端代码/springboot/src/main/resources/db/migration/V3__planting_geo_evidence.sql",
                "后端代码/springboot/src/main/resources/db/migration/V4__planting_operation_time.sql",
            ]
        ),
        "记录地块、农事操作、图片、音频、定位和操作时间，是证明药材源头生产过程的重要证据。",
    ),
    (
        "核心",
        "加工与批次派生",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/processing/*",
                "前端代码/miniprogram-5/src/pages/processing-form/*",
                "前端代码/miniprogram-5/src/pages/line-work/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/ProcessingRecordController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/ProcessingRecordService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/ProcessingRecord.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/BatchLineage.java",
                "后端代码/springboot/src/main/resources/db/migration/V6__processing_line_name.sql",
                "后端代码/springboot/src/main/resources/db/migration/V10__add_lineage_details.sql",
            ]
        ),
        "记录加工厂、加工方式、产线、投入产出数量和子批次来源，支撑一批原料拆分、加工、流转后的血缘追踪。",
    ),
    (
        "核心",
        "质检环节记录",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/inspection/*",
                "前端代码/miniprogram-5/src/pages/inspection-form/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/InspectionRecordController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/InspectionRecordService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/InspectionRecord.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/dto/InspectionDeriveRequest.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/dto/InspectionDeriveResponse.java",
                "后端代码/springboot/src/main/resources/db/migration/V13__expand_inspection_result.sql",
            ]
        ),
        "保存检测类型、检测结果、检测人员和报告附件，是消费者信任与监管核验的关键数据来源。",
    ),
    (
        "核心",
        "物流发运与节点轨迹",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/logistics/*",
                "前端代码/miniprogram-5/src/pages/shipment-form/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/ShipmentController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/LogisticsWebhookController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/ShipmentService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/Shipment.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/ShipmentItem.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/entity/ShipmentEvent.java",
                "后端代码/springboot/src/main/resources/db/migration/V8__shipment_event_coords.sql",
                "后端代码/springboot/src/main/resources/db/migration/V9__logistics_multi_batch.sql",
            ]
        ),
        "管理发运单、物流公司、运单号、批次明细和运输节点，补齐从加工/质检后到市场流通的追踪链路。",
    ),
    (
        "核心",
        "扫码溯源与完整链路展示",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/qrcode/*",
                "前端代码/miniprogram-5/src/pages/batch/trace/*",
                "前端代码/consumer-miniprogram/src/pages/trace/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/TraceController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/PublicController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/service/TraceService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/dto/TraceResponse.java",
                "后端代码/springboot/src/main/resources/static/demo/trace.html",
            ]
        ),
        "根据批次号汇总批次、种植、加工、质检、物流和区块链记录，形成消费者或监管方最终看到的溯源结果。",
    ),
    (
        "核心",
        "区块链防伪存证",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/security/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/blockchain/BlockchainController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/blockchain/BlockchainService.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/blockchain/EvmBlockchainClient.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/blockchain/BlockchainRecord.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/blockchain/BlockchainRecordRepository.java",
                "后端代码/springboot/src/main/resources/db/migration/V5__blockchain_tx_url_mode.sql",
                "后端代码/springboot/.env.example",
                "后端代码/springboot/scripts/run-evm-dev.sh",
            ]
        ),
        "把关键溯源数据生成哈希并记录链上交易信息，支持后续链上链下校验。默认可演示，配置 EVM 参数后可接真实兼容链。",
    ),
    (
        "核心",
        "AI 药材咨询与溯源解释",
        paths(
            [
                "后端代码/springboot/src/main/java/com/example/dachuang/ai/controller/AiController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/ai/dto/*.java",
                "前端代码/consumer-miniprogram/src/pages/ai-consult/*",
                "ai_payload.json",
                "test_ai.json",
                "test_ai_trace_empty.json",
            ]
        ),
        "提供同步和 SSE 流式 AI 问答。它不是医疗诊断，而是把药材批次、产地、质检和食用建议转成用户能理解的解释。",
    ),
    (
        "常规",
        "首页工作台与个人中心",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/index/*",
                "前端代码/miniprogram-5/src/pages/mine/*",
                "前端代码/miniprogram-5/src/components/user-info/*",
                "前端代码/miniprogram-5/src/assets/*",
            ]
        ),
        "提供主导航、角色入口、个人信息展示和基础 UI 资源，是用户使用系统的外层壳。",
    ),
    (
        "常规",
        "管理驾驶舱与统计预测",
        paths(
            [
                "前端代码/miniprogram-5/src/pages/web-dashboard/*",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/controller/DashboardController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/dto/DashboardStatsDTO.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/trace/dto/DashboardForecastDTO.java",
                "后端代码/springboot/src/main/resources/static/admin/*",
            ]
        ),
        "用于展示批次数、环节数据、药材品类和趋势预测，属于管理层查看系统运行状态的辅助功能。",
    ),
    (
        "常规",
        "文件上传与报告附件",
        paths(
            [
                "前端代码/miniprogram-5/src/utils/api.js",
                "后端代码/springboot/src/main/java/com/example/dachuang/controller/FileController.java",
                "后端代码/springboot/src/main/java/com/example/dachuang/config/WebMvcConfig.java",
            ]
        ),
        "支持图片、报告等附件上传，使种植照片、质检报告、加工凭证等能挂接到具体业务记录上。",
    ),
    (
        "常规",
        "演示数据与开发运维",
        paths(
            [
                "后端代码/springboot/src/main/java/com/example/dachuang/dev/*.java",
                "后端代码/springboot/scripts/reset_demo_db.sh",
                "后端代码/springboot/scripts/dev-run.sh",
                "后端代码/springboot/scripts/dev-run-bg.sh",
                "后端代码/springboot/demo_traceability_codes.csv",
                "后端代码/springboot/DEPLOY_READY.md",
                "deploy.sh",
                "start-backend.ps1",
            ]
        ),
        "用于快速初始化演示库、生成演示链路、后台启动和部署检查。对正式业务不是核心，但对演示和交付很重要。",
    ),
    (
        "常规",
        "消费者端首页、市场和用户页",
        paths(
            [
                "前端代码/consumer-miniprogram/src/app.js",
                "前端代码/consumer-miniprogram/src/app.json",
                "前端代码/consumer-miniprogram/src/utils/api.js",
                "前端代码/consumer-miniprogram/src/pages/index/*",
                "前端代码/consumer-miniprogram/src/pages/market/*",
                "前端代码/consumer-miniprogram/src/pages/user/*",
                "前端代码/consumer-miniprogram/src/custom-tab-bar/*",
            ]
        ),
        "面向消费者的轻量端，主要承接扫码溯源、市场展示、用户信息和 AI 咨询入口，与管理端分离以降低使用门槛。",
    ),
    (
        "常规",
        "iOS 原型与多端展示",
        paths(
            [
                "ios/YaotuTrace/README.md",
                "ios/YaotuTrace/YaotuTrace/YaotuTraceApp.swift",
                "ios/YaotuTrace/YaotuTrace/ContentView.swift",
                "ios/YaotuTrace/YaotuTrace/WorkbenchViews.swift",
                "ios/YaotuTrace/YaotuTrace/APIClient.swift",
                "ios/YaotuTrace/YaotuTrace/Models.swift",
                "ios/YaotuTrace/YaotuTrace/AppState.swift",
                "ios/YaotuTrace/YaotuTrace/QRScannerView.swift",
            ]
        ),
        "展示项目向原生 iOS 端迁移的可能性。它不是当前主运行端，但能作为成果扩展和界面演示材料。",
    ),
    (
        "边缘",
        "展示官网与视觉介绍",
        paths(
            [
                "website/index.html",
                "website/styles.css",
                "website/script.js",
                "website/assets/*",
                "technical_highlights.md",
                "System_Architecture_v2.svg",
                "系统架构图_科技风.html",
                "系统架构图_学术风.html",
                "系统架构_ER图.html",
                "diagram.mmd",
            ]
        ),
        "用于项目宣传、答辩展示和架构说明，不参与小程序或后端业务运行。",
    ),
    (
        "边缘",
        "演示视频工程",
        paths(
            [
                "hyperframes-project-intro/index.html",
                "hyperframes-project-intro/hyperframes.json",
                "hyperframes-project-intro/assets/*",
                "hyperframes-project-intro/audio/*",
                "hyperframes-project-intro/renders/*.mp4",
                "hyperframes-project-intro/scripts/*.py",
            ]
        ),
        "用于生成项目介绍视频和背景音乐，是成果展示材料，不是业务系统的一部分。",
    ),
    (
        "边缘",
        "软著与参赛提交材料",
        paths(
            [
                "output/doc/*",
                "output/doc/软著申请材料/*",
                "output/submission/*",
                "01-3 软件应用与开发类作品设计和开发文档（已填）.docx",
                "scripts/generate_softcopyright_*.py",
                "scripts/generate_ppt_tech_explanation_pdf.py",
                "scripts/generate_defense_background_qa_pdf.py",
            ]
        ),
        "是申报、软著、答辩和比赛提交用材料。它们说明和包装项目成果，但不是运行时依赖。",
    ),
    (
        "边缘",
        "行业资料与参考文献",
        paths(
            [
                "文档/*",
                "文献资料/*.pdf",
                "测试数据/空",
            ]
        ),
        "用于需求论证、行业规范、政策和技术背景支撑。对答辩和材料写作有价值，但不参与程序执行。",
    ),
    (
        "边缘",
        "样式构建与批量修复脚本",
        paths(
            [
                "前端代码/miniprogram-5/package.json",
                "前端代码/miniprogram-5/gulpfile.js",
                "前端代码/miniprogram-5/tailwind.config.js",
                "前端代码/miniprogram-5/postcss.config.js",
                "前端代码/miniprogram-5/unify_css.py",
                "前端代码/miniprogram-5/update_wxml.py",
                "前端代码/miniprogram-5/fix_all_wxml.py",
            ]
        ),
        "用于样式处理、构建配置和历史批量改版。维护 UI 时有用，但不是用户可见的核心业务功能。",
    ),
]


level_colors = {
    "核心": colors.HexColor("#D95F3D"),
    "常规": colors.HexColor("#2F7D5B"),
    "边缘": colors.HexColor("#627184"),
}


def page_decor(canvas, doc):
    canvas.saveState()
    w, h = landscape(A4)
    canvas.setFillColor(colors.HexColor("#F7FAF8"))
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#143B2E"))
    canvas.rect(0, h - 14 * mm, w, 14 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("STSong-Light", 8.5)
    canvas.drawString(12 * mm, h - 9 * mm, "药途寻迹 - 功能对应文件清单")
    canvas.drawRightString(w - 12 * mm, 8 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def build_story():
    story = []
    story.append(Spacer(1, 5 * mm))
    story.append(para("药途寻迹功能对应文件清单", styles["TitleCN"]))
    story.append(
        para(
            "按功能重要性分为：核心 = 主业务闭环必须；常规 = 管理与运行支撑；边缘 = 展示、申报、资料或辅助工程。",
            styles["SubtitleCN"],
        )
    )
    story.append(
        para(
            "阅读建议：如果要讲代码主线，优先看“核心”部分；如果要准备答辩或交付材料，再看“常规”和“边缘”部分。",
            styles["BodyCN"],
        )
    )
    story.append(Spacer(1, 5 * mm))

    data = [
        [
            para("级别", styles["HeadCN"]),
            para("功能", styles["HeadCN"]),
            para("对应文件/目录", styles["HeadCN"]),
            para("作用说明", styles["HeadCN"]),
        ]
    ]
    for level, function, file_list, description in rows:
        data.append(
            [
                para(level, styles["BodyCN"]),
                para(function, styles["BodyCN"]),
                para(file_list, styles["SmallCN"]),
                para(description, styles["BodyCN"]),
            ]
        )

    table = Table(data, colWidths=[16 * mm, 35 * mm, 135 * mm, 79 * mm], repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#143B2E")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7DED9")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
    ]
    for idx, row in enumerate(rows, start=1):
        style.append(("TEXTCOLOR", (0, idx), (0, idx), level_colors[row[0]]))
        if row[0] == "核心":
            style.append(("BACKGROUND", (0, idx), (-1, idx), colors.HexColor("#FFF6F1")))
        elif row[0] == "常规":
            style.append(("BACKGROUND", (0, idx), (-1, idx), colors.HexColor("#F4FAF6")))
        else:
            style.append(("BACKGROUND", (0, idx), (-1, idx), colors.HexColor("#F6F8FA")))
    table.setStyle(TableStyle(style))
    story.append(table)
    return story


def main():
    page_size = landscape(A4)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=page_size,
        leftMargin=10 * mm,
        rightMargin=10 * mm,
        topMargin=18 * mm,
        bottomMargin=13 * mm,
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        bottomPadding=0,
        rightPadding=0,
        topPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_decor)])
    doc.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
