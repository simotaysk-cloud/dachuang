from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont


OUTPUT = "output/pdf/药途寻迹PPT技术点原理解释.pdf"


pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


styles = getSampleStyleSheet()


def style(name, **kwargs):
    return ParagraphStyle(name, parent=styles["Normal"], fontName="STSong-Light", **kwargs)


TITLE = style("TitleCN", fontSize=22, leading=30, alignment=TA_CENTER, textColor=colors.HexColor("#1F3B2D"), spaceAfter=12)
SUBTITLE = style("SubtitleCN", fontSize=12, leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#5B6B60"), spaceAfter=18)
H1 = style("H1CN", fontSize=16, leading=22, textColor=colors.HexColor("#1F3B2D"), spaceBefore=14, spaceAfter=8)
H2 = style("H2CN", fontSize=13, leading=19, textColor=colors.HexColor("#355A3F"), spaceBefore=10, spaceAfter=5)
BODY = style("BodyCN", fontSize=10.4, leading=16, alignment=TA_LEFT, textColor=colors.HexColor("#222222"), spaceAfter=5)
SMALL = style("SmallCN", fontSize=8.8, leading=13, textColor=colors.HexColor("#404040"))
NOTE = style("NoteCN", fontSize=9.5, leading=14, textColor=colors.HexColor("#6E3B18"), backColor=colors.HexColor("#FFF4E4"), borderColor=colors.HexColor("#E7B36C"), borderWidth=0.5, borderPadding=6, spaceBefore=4, spaceAfter=8)
OK = style("OkCN", fontSize=9.5, leading=14, textColor=colors.HexColor("#234C32"), backColor=colors.HexColor("#EDF7EF"), borderColor=colors.HexColor("#9BC9A5"), borderWidth=0.5, borderPadding=6, spaceBefore=4, spaceAfter=8)


def p(text, s=BODY):
    return Paragraph(text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), s)


def bullets(items):
    return ListFlowable(
        [ListItem(p(item, BODY), leftIndent=10) for item in items],
        bulletType="bullet",
        leftIndent=16,
        bulletFontName="STSong-Light",
        bulletFontSize=8,
    )


def tech_block(title, principle, code_support, ppt_claim, risk=None, suggested=None):
    parts = [
        p(title, H2),
        p(f"原理：{principle}"),
        p(f"项目对应：{code_support}"),
        p(f"PPT可讲法：{ppt_claim}"),
    ]
    if risk:
        parts.append(p(f"需要注意：{risk}", NOTE))
    if suggested:
        parts.append(p(f"建议表述：{suggested}", OK))
    return KeepTogether(parts)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("STSong-Light", 8)
    canvas.setFillColor(colors.HexColor("#6A6A6A"))
    canvas.drawString(1.6 * cm, 1.1 * cm, "药途寻迹 PPT 技术点原理解释")
    canvas.drawRightString(19.4 * cm, 1.1 * cm, f"第 {doc.page} 页")
    canvas.restoreState()


story = []

story.append(p("《药途寻迹》PPT 技术点原理解释", TITLE))
story.append(p("基于当前项目代码与答辩 PPT 内容整理", SUBTITLE))
story.append(p("说明范围", H1))
story.append(p("本文先解释系统总体结构和技术主线，再逐一对应 PPT 中出现的技术点，说明它们的技术原理、在项目中的实现位置，以及答辩时更稳妥的表述方式。"))
story.append(p("如果某个 PPT 说法存在概念过大、实现支撑不足或术语不严谨，本文会单独标出“需要注意”和“建议表述”。"))

story.append(p("一、系统总体结构", H1))
story.append(p("这个项目不是单一页面展示，而是一套围绕中药材批次流转建立的溯源应用系统。它的核心目标是把一批药材从种植、加工、质检、发运到消费者扫码查看的全过程，变成可记录、可查询、可验证的数据链。"))
story.append(bullets([
    "后端：Spring Boot 3 + Java 17 + JPA + Flyway + MySQL，负责业务接口、权限、批次关系、二维码、AI 转发和区块链存证。",
    "企业管理端小程序：面向管理员、农户、加工企业、物流、质检、监管等角色，负责录入和管理生产流通过程。",
    "消费者端小程序：面向普通消费者，负责扫码溯源、查看药材详情、AI 智问和云市集展示。",
    "iOS 版本和网站：属于扩展展示与迁移成果，证明后端接口可复用，但不是系统业务运行的唯一入口。",
    "文档和输出材料：包括比赛答辩、软著、上架、项目说明等支撑材料。",
]))

story.append(p("二、核心数据流", H1))
story.append(p("系统最关键的抽象是“批次”。药材不是简单地存一条商品记录，而是围绕 batchNo 建立身份。每个批次可以有种植记录、加工记录、质检记录、物流记录、发运事件、GS1 编码和区块链凭证。"))
data = [
    [p("阶段", SMALL), p("输入", SMALL), p("系统动作", SMALL), p("输出", SMALL)],
    [p("创建批次", SMALL), p("药材名称、产地、数量、单位", SMALL), p("生成 batchNo、minCode、GS1 批号和 GS1 HRI", SMALL), p("可追溯的原始批次", SMALL)],
    [p("种植记录", SMALL), p("农事操作、图片/语音、定位", SMALL), p("记录关键农事证据", SMALL), p("源头生产证据", SMALL)],
    [p("加工派生", SMALL), p("父批次、工艺、消耗量、产出量", SMALL), p("扣减父批次库存并生成子批次", SMALL), p("批次血缘链", SMALL)],
    [p("质检", SMALL), p("检测结果、报告、质检员", SMALL), p("关联到批次或子批次", SMALL), p("质量准入证明", SMALL)],
    [p("发运物流", SMALL), p("目的地、承运方、物流事件", SMALL), p("生成发运单和事件时间线", SMALL), p("流通轨迹", SMALL)],
    [p("消费者扫码", SMALL), p("二维码或批次号", SMALL), p("聚合整条批次链路", SMALL), p("溯源详情页", SMALL)],
    [p("链上验证", SMALL), p("业务数据摘要", SMALL), p("SHA-256 后写入 EVM 合约或 MOCK 存证", SMALL), p("txHash、dataHash、txUrl", SMALL)],
]
table = Table(data, colWidths=[2.4 * cm, 4.1 * cm, 5.7 * cm, 4.1 * cm])
table.setStyle(TableStyle([
    ("FONT", (0, 0), (-1, -1), "STSong-Light"),
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCEBDD")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F3B2D")),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B8C6BA")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(table)

story.append(p("三、总体技术原理", H1))
story.append(p("1. 前后端分离：小程序端只负责交互和展示，后端统一提供 REST API。前端通过 wx.request 调接口，后端返回统一 Result 结构。"))
story.append(p("2. 角色权限：用户登录后获得 JWT，JWT 中保存用户名和角色。后端拦截器解析 token，前端再用角色矩阵控制菜单和页面入口。"))
story.append(p("3. 批次血缘：加工、分级、混批、拆分等动作会把一个批次派生为另一个批次，系统用 batch_lineages 记录父子关系。查询溯源时从当前批次向上找父批次，再向下找子批次，拼出完整链路。"))
story.append(p("4. 标准编码：GS1-128 HRI 用固定 AI 标识组织 GTIN、批号和重量。项目目前实现了 HRI 文本生成和单位换算，不等同于完整的工业条码解析平台。"))
story.append(p("5. 虚实锚定：链下保存完整业务数据，链上只保存哈希摘要。消费者验证时，不是把链上内容解密，而是重新计算链下数据摘要，与链上摘要比对。"))
story.append(p("6. AI 上下文问答：消费者在某个批次页面提问时，系统把药材名称、产地、批次号等上下文放入 Prompt，使 AI 回答围绕当前药材。"))

story.append(PageBreak())
story.append(p("四、对应 PPT 的技术点逐项解释", H1))

story.append(p("第 4 页：《药途寻迹》双端功能矩阵", H1))
story.append(tech_block(
    "1. C 端消费者小程序",
    "消费者端承担轻量化入口，主要是扫码、查看溯源、AI 咨询和导购展示。它不负责复杂生产数据维护，而是把后端聚合后的批次链路以用户能理解的方式展示出来。",
    "consumer-miniprogram 包含 index、trace、market、ai-consult、user 等页面。",
    "消费者扫码后，系统根据批次号查询完整溯源链，展示来源、流转、质检和链上凭证。",
))
story.append(tech_block(
    "2. G/B 端企业管理小程序",
    "管理端面向生产与监管流程。不同角色进入不同工作台，分别录入种植、加工、质检、物流和上链数据。",
    "miniprogram-5 下有 batch、planting、processing、inspection、logistics、security、user-mgmt 等页面。",
    "企业端是数据采集和质量控制入口，消费者端是可信展示入口。",
))
story.append(tech_block(
    "3. 微信扫码与批次识别",
    "小程序调用 wx.scanCode 打开微信原生扫码能力，扫码结果可能是一个溯源 URL，也可能是批次号。前端解析出 batchNo 后跳转到业务页面。",
    "processing、inspection、logistics、terminal-qrcode 等页面均有 scanCode 或 parseBatchNoFromScanResult 逻辑。",
    "扫码不是单纯打开页面，而是把实体药材、批次数据和后端追溯接口连接起来。",
    risk="PPT 写“GS1-128 解析”略强。当前主要是二维码/条码扫码后提取批次号，并生成 GS1 HRI，不是完整 GS1-128 工业解析系统。",
    suggested="微信原生扫码 + 批次号解析 + GS1 标准编码生成。",
))
story.append(tech_block(
    "4. JWT 鉴权与批次验证",
    "登录成功后，后端签发 JWT。小程序之后每次访问受保护接口时在请求头携带 Bearer token，后端拦截器解析用户名和角色。批次验证则通过 batchNo 查询数据库，确认批次存在。",
    "JwtService 负责生成和解析 token；AuthInterceptor 拦截 /api/v1/**；BatchService.getBatchByNo 校验批次存在。",
    "系统通过 JWT 实现登录态和角色识别，通过批次号实现溯源对象的唯一定位。",
))

story.append(p("第 7 页：生产与企业管理端核心技术", H1))
story.append(tech_block(
    "5. 多角色动态工作台",
    "动态工作台的核心是“角色到功能”的映射。用户登录后获得角色，前端根据角色展示不同菜单，后端根据角色进行部分业务约束。",
    "前端 rbac.js 定义 ADMIN、FARMER、MANUFACTURER、FACTORY、LOGISTICS、QUALITY、REGULATOR 等角色可访问功能。",
    "一套小程序代码服务多个业务角色，通过角色矩阵隔离不同业务流。",
))
story.append(tech_block(
    "6. 关键操作定位取证",
    "种植关键操作会调用 wx.getLocation 获取经纬度，并将经纬度随农事记录保存。这样可以证明数据是在特定地点附近采集的，提升源头记录可信度。",
    "planting-form 页面调用 wx.getLocation；数据库迁移 V3 为 planting_records 增加 latitude、longitude 字段。",
    "关键农事操作自动采集定位，形成“时间 + 地点 + 图片/语音 + 操作人”的证据快照。",
    risk="PPT 写“强制 GPS 地理围栏”不够稳。当前有定位采集，但未看到半径围栏、行政边界、多边形围栏或越界拦截逻辑。",
    suggested="关键操作 GPS 定位取证，或关键农事节点定位固化。",
))
story.append(tech_block(
    "7. GS1-128 赋码引擎",
    "GS1-128 使用应用标识符组织产品代码、批号、重量等信息。项目中的 HRI 生成逻辑包括 GTIN、批号和重量字段，并在生成前将 g、斤、吨等单位统一换算为 kg。",
    "Gs1Service.generateGs1HRI 生成 (01)、(10)、(3102) 等字段；BatchService 创建批次时自动生成 gs1LotNo 和 gs1Code。",
    "系统把传统中药材的非标准计量转换为国际标准追溯编码，便于贴码、扫码和跨环节流通。",
))
story.append(tech_block(
    "8. GS1 锁定机制",
    "贴码后如果继续修改数量或单位，实物标签和系统数据会不一致。因此系统提供锁定字段，锁定后禁止修改关键计量数据。",
    "Batch.gs1Locked 保存锁定状态；BatchService.updateBatch 在锁定后禁止改 quantity 和 unit；前端也会禁用相关输入框。",
    "贴码即冻结关键计量信息，保证已流通标签与数据库记录一致。",
))

story.append(PageBreak())
story.append(p("第 8 页：消费者与监管端核心技术", H1))
story.append(tech_block(
    "9. SSE 流式 AI 对话",
    "传统接口要等模型完整回答后一次性返回，用户等待时间长。SSE 流式接口会把模型输出分块推送，前端边收边显示，形成打字机效果。",
    "后端 AiController 使用 SseEmitter，调用大模型 stream=true；消费者端 ai-consult 页面使用 wx.request enableChunked 和 onChunkReceived。",
    "AI 回复不再等完整答案，而是边生成边展示，移动端体验更接近实时对话。",
    risk="PPT 写“替代传统 wx.request”不精确。微信端仍使用 wx.request，只是开启 enableChunked 分块接收。",
    suggested="基于 wx.request 分块接收和后端 SSE 转发的流式 AI 对话。",
))
story.append(tech_block(
    "10. 降低 504 超时风险",
    "流式返回可以让连接持续有数据输出，避免用户长时间看不到响应，也降低代理层把长请求判定为超时的概率。",
    "application.yml 中设置了较长异步请求超时；AiController 的 SseEmitter 设置 240 秒超时。",
    "流式响应缩短首字等待时间，降低长回答导致的网关超时风险。",
    risk="不能说“无 504 超时”。网络、Nginx、模型供应商、后端线程池都可能导致超时。",
    suggested="降低长响应等待和 504 超时风险。",
))
story.append(tech_block(
    "11. 隐式上下文注入",
    "AI 并不是直接知道用户扫的是哪味药材。系统会把当前批次的名称、批次号、产地等作为 traceContext 传给后端，后端拼入 System Prompt。",
    "consumer-miniprogram 的 ai-consult 页面会读取 app.globalData.aiConsultContext；AiController.buildSystemPrompt 会把上下文写入提示词。",
    "AI 回答会围绕当前扫码药材，而不是泛泛讲中药知识。",
))
story.append(tech_block(
    "12. RAG 雏形",
    "严格的 RAG 需要向量库检索、召回文档、重排序和上下文拼接。当前项目里更像是基于关键词的模拟检索，把命中的知识片段加入 Prompt。",
    "AiController.performMockVectorSearch 根据用户问题中的关键词返回模拟知识图谱命中结果。",
    "可以说系统预留了 RAG 思路，当前以轻量知识上下文注入形式实现。",
    risk="不要说成完整向量数据库 RAG 系统，否则会被追问向量模型、索引、召回率和数据来源。",
    suggested="上下文注入 + 轻量知识检索雏形。",
))
story.append(tech_block(
    "13. 原子化 CSS 工程",
    "原子化 CSS 的思想是把样式拆成小粒度工具类，提高复用率。小程序场景下需要把 Tailwind 等工具链编译成 WXSS。",
    "项目里存在 tailwind.config.js、postcss.config.js、gulpfile.js 等配置文件。",
    "前端样式通过工程化构建统一管理，减少重复样式，提高界面一致性。",
    risk="PPT 写“包体积小、首屏极速”需要实际数据支撑。如果没有包体积对比或加载测速，建议弱化。",
    suggested="原子化样式工程提升样式复用和维护效率。",
))

story.append(p("第 9 页和第 14 页：区块链虚实锚定与 EVM 防伪存证", H1))
story.append(tech_block(
    "14. SHA-256 数据指纹",
    "SHA-256 会把任意长度业务数据计算成固定长度摘要。摘要对数据变化非常敏感，原始数据改一个字符，哈希值也会完全变化。",
    "BlockchainService.sha256Hex 对上链数据生成 sha256: 前缀的十六进制摘要。",
    "系统不把全部溯源明细上链，而是把数据指纹上链，降低成本并保护业务明文。",
))
story.append(tech_block(
    "15. EVM 智能合约调用",
    "EVM 兼容链包括以太坊测试网、Polygon、BSC、联盟链 EVM 等。后端通过 Web3j 构造合约函数调用，把 batchNo 和 bytes32 哈希写入合约 anchor 方法。",
    "EvmBlockchainClient 使用 Web3j、RawTransactionManager、FunctionEncoder 调用 anchor(batchNo, bytes32 dataHash)。",
    "链上只保存摘要，交易成功后返回 txHash，消费者可以通过 txHash 或合约读取结果核验。",
))
story.append(tech_block(
    "16. TxHash 与链上验证",
    "TxHash 是区块链交易编号，用来定位一笔交易。它本身不是密文，也不是业务数据。验证时要读取交易回执事件或合约存储的哈希，再与本地重新计算的哈希比对。",
    "BlockchainService.verifyOnChain 会计算 expectedHash；EvmBlockchainClient 可以从交易事件或合约 hashes(batchNo) 读取链上哈希。",
    "消费者扫码后看到的是链上凭证，真正的可信点是链上哈希与链下明文摘要一致。",
    risk="PPT 写“查询以太坊链上密文”是错误术语。链上保存的是哈希摘要，不是密文，不能解密。",
    suggested="查询链上哈希摘要，与云端明文重新计算出的摘要进行一致性比对。",
))
story.append(tech_block(
    "17. MOCK 与真实 EVM 模式",
    "系统支持演示模式和真实 EVM 模式。MOCK 模式会生成模拟 txHash，适合演示；EVM 模式需要 RPC、私钥、链 ID 和合约地址。",
    "BlockchainService 根据 app.blockchain.mode 判断走 MOCK 还是 EVM；README 中提供 Sepolia 配置方式。",
    "答辩时可以说系统具备 EVM 上链接口，演示环境可使用 MOCK 或测试网。",
    risk="如果现场没有真实 Sepolia 交易记录，不要说“所有数据已经真实上链”。",
    suggested="支持 EVM 兼容链真实上链，演示环境可按配置切换 MOCK/测试网。",
))

story.append(PageBreak())
story.append(p("第 10 页：“扫码开工”破解混批难题", H1))
story.append(tech_block(
    "18. 批次血缘建模",
    "混批、分级和加工会让一个原始批次变成多个成品批次，也可能多个来源进入一个生产过程。系统用父批次、子批次和加工边来记录这种关系。",
    "batch_lineages 表记录 parent_batch_no、child_batch_no、stage、process_type、line_name、operator 等字段。",
    "通过批次血缘链，消费者看到的不只是成品批次，也能追溯到上游原料来源。",
))
story.append(tech_block(
    "19. 分包加工与库存扣减",
    "加工派生时，系统先检查父批次剩余量是否足够，再扣减父批次 remainingQuantity，并为子批次设置产出数量。",
    "BatchService.deriveBatch 实现父批次消耗、子批次创建和 lineage 写入。",
    "每一次扫码开工都把实体加工动作固化为系统中的父子批次关系。",
))
story.append(tech_block(
    "20. “批次聚类算法”的表述风险",
    "当前实现是业务规则驱动的批次派生和血缘追踪，不是数据挖掘意义上的聚类算法。聚类通常指无监督学习，把样本按相似度自动分组。",
    "代码里没有 KMeans、DBSCAN、向量聚类、相似度矩阵等聚类算法。",
    "可以把 PPT 中的图解释为“批次血缘关系图”或“原料到成品的派生模型”。",
    risk="如果老师问聚类算法公式、特征、相似度、训练数据，会比较难回答。",
    suggested="系统底层批次血缘追踪与派生建模。",
))

story.append(p("第 11 页：“扫码发运”解决拼装盲区", H1))
story.append(tech_block(
    "21. 发运单与物流事件",
    "发运不是只写一个终点，而是创建发运单，再追加多个运输事件。每个事件包含时间、地点、状态和备注，最终形成时间线。",
    "ShipmentService 创建 Shipment 和 ShipmentEvent；TraceService 会把发运事件转换为消费者可见的物流记录。",
    "系统把拼装、拆单、到站、重新发出等节点记录成可追踪事件，减少发运过程中的信息断点。",
))
story.append(tech_block(
    "22. 拼装和拆单的业务解释",
    "多个成品批次可以按发运需求进入不同车次或目的地。系统可通过批次、发运单和事件记录保留“哪个批次去了哪里”的证据。",
    "数据库中有 shipments、shipment_items、shipment_events 等表，支持发运和事件管理。",
    "答辩时重点讲“事件式物流追踪”，不要讲成实时运输监控平台。",
    risk="PPT 写“沿途 GPS 轨迹”偏强。当前主要是物流事件位置和经纬度字段，不是持续 GPS 轨迹采集。",
    suggested="物流节点事件记录与关键位置留痕。",
))

story.append(p("第 12 页：双端分离与架构表述", H1))
story.append(tech_block(
    "23. 前后端分离",
    "前端小程序负责界面和交互，后端负责数据和业务规则。两者通过 HTTP API 通信，因此可以同时支持管理端、消费者端和 iOS 端。",
    "miniprogram-5、consumer-miniprogram 和 iOS YaotuTrace 都可以复用 Spring Boot 后端接口。",
    "双端分离提升了用户侧和企业侧的体验适配能力，也让后端服务可以被多端复用。",
))
story.append(tech_block(
    "24. 模块化单体架构",
    "当前后端是一个 Spring Boot 应用，代码按 auth、trace、blockchain、ai、config 等包拆分。这属于模块化单体，而不是严格微服务。",
    "pom.xml 是单一 Spring Boot 应用；没有独立服务注册、服务发现、网关、多个可独立部署服务。",
    "后端采用模块化分层设计，便于后续拆分为微服务。",
    risk="PPT 写“Spring Boot 微服务，独立部署扩展”“微服务网关”不符合当前代码现状。",
    suggested="前后端分离 + 双端小程序 + Spring Boot 模块化单体架构。",
))
story.append(tech_block(
    "25. Spring Security 表述",
    "项目依赖中包含 spring-security-crypto，主要用于密码加密；鉴权主流程是自定义 JWT 服务和 HandlerInterceptor，不是完整 Spring Security FilterChain。",
    "JwtService、AuthInterceptor、PasswordConfig 是当前权限相关实现。",
    "可以说系统使用 JWT 鉴权和密码加密机制，不建议突出 Spring Security 网关架构。",
    risk="如果写 Spring Security + JWT + 微服务网关，老师可能追问 SecurityFilterChain、Gateway、OAuth2、服务间鉴权。",
    suggested="JWT 多角色鉴权 + 前端 RBAC 功能矩阵。",
))

story.append(p("第 13 页：大语言模型流式 AI 咨询系统", H1))
story.append(tech_block(
    "26. 腾讯混元大模型接入",
    "后端把用户消息转换为兼容 Chat Completions 的请求格式，配置 baseUrl、apiKey、model 后调用模型接口。",
    "application.yml 中有 hunyuan base-url 和 hunyuan-lite；AiController 读取 ai.hunyuan 与 ai.compat 配置。",
    "系统后端对接大模型服务，为消费者提供本草知识、食养建议和风险提醒。",
))
story.append(tech_block(
    "27. 流式转发链路",
    "完整链路是：小程序提交问题和批次上下文，后端调用大模型流式接口，后端读取模型流并转换为 SSE 事件，小程序分块接收并更新界面。",
    "AiController.chatStream 处理后端流式转发；consumer-miniprogram 的 ai-consult 页面处理 onChunkReceived。",
    "这条链路让用户较快看到首个字，减少等待焦虑。",
))
story.append(tech_block(
    "28. 医疗合规表述",
    "AI 可以做药材科普、食养建议、配伍提醒、禁忌提醒，但不应直接做疾病诊断或替代医生处方。",
    "AiController 的基础 Prompt 中也包含“禁止明确医疗诊断”和“提示咨询医生或药师”。",
    "答辩建议使用“AI 药学咨询”或“本草食养问答”，不要突出“AI 问诊”。",
    risk="“问诊”容易引发医疗合规和责任边界追问。",
    suggested="大语言模型驱动的智能药学咨询系统。",
))

story.append(PageBreak())
story.append(p("五、PPT 中建议重点修正的说法", H1))
fixes = [
    [p("原 PPT 说法", SMALL), p("风险", SMALL), p("建议改法", SMALL)],
    [p("强制 GPS 地理围栏", SMALL), p("目前只有定位采集，未见围栏判定", SMALL), p("关键操作 GPS 定位取证", SMALL)],
    [p("链上密文", SMALL), p("链上保存的是哈希摘要，不是密文", SMALL), p("链上哈希摘要", SMALL)],
    [p("TxHash 解析", SMALL), p("TxHash 是交易编号，不是数据本体", SMALL), p("通过 txHash 查询交易回执或合约哈希", SMALL)],
    [p("系统底层批次聚类算法", SMALL), p("当前不是机器学习聚类", SMALL), p("批次血缘追踪与派生建模", SMALL)],
    [p("沿途 GPS 轨迹", SMALL), p("当前不是持续 GPS 轨迹采集", SMALL), p("物流节点事件记录与位置留痕", SMALL)],
    [p("Spring Boot 微服务 / 微服务网关", SMALL), p("当前是单体 Spring Boot 应用", SMALL), p("模块化单体架构，预留微服务拆分空间", SMALL)],
    [p("无 504 超时", SMALL), p("绝对化表述，仍可能超时", SMALL), p("降低长响应和网关超时风险", SMALL)],
    [p("AI 问诊", SMALL), p("医疗合规风险", SMALL), p("AI 药学咨询 / 本草食养问答", SMALL)],
]
fix_table = Table(fixes, colWidths=[4.6 * cm, 5.4 * cm, 6.2 * cm])
fix_table.setStyle(TableStyle([
    ("FONT", (0, 0), (-1, -1), "STSong-Light"),
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F2E4C8")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#4A2D12")),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CDBB9A")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(fix_table)

story.append(p("六、答辩时的总括讲法", H1))
story.append(p("可以这样总结：本系统采用双小程序端 + Spring Boot 后端的前后端分离架构，以批次为核心数据对象，通过 JWT 完成多角色访问控制，通过批次血缘表记录药材从种植、加工、质检到发运的流转关系。系统在关键节点引入定位取证、GS1 标准编码、二维码追溯和区块链哈希锚定，使链下业务数据可以被链上摘要校验。同时，消费者端接入流式大语言模型服务，将当前扫码批次上下文注入提示词，实现围绕具体药材的智能药学咨询。"))
story.append(p("答辩中要把“已经实现的能力”和“可扩展方向”分清：JWT、批次血缘、GS1 HRI、SSE AI、EVM 合约调用接口是已有实现；完整地理围栏、严格微服务架构、真实全量上链、完整 RAG 向量检索和持续 GPS 轨迹属于可扩展方向，不建议说成已经完整落地。", NOTE))


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=1.6 * cm,
    leftMargin=1.6 * cm,
    topMargin=1.5 * cm,
    bottomMargin=1.8 * cm,
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
