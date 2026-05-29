import SwiftUI
import UIKit
import PhotosUI

struct WorkbenchView: View {
    var body: some View {
        UserHomeView()
    }
}

struct UserHomeView: View {
    @EnvironmentObject private var appState: AppState
    @State private var stats: AnyJSONObject?
    @State private var errorMessage = ""

    private let flowNodes = [
        ("建档", "批次生成", "shippingbox"),
        ("种植", "农事采集", "leaf"),
        ("加工", "产线流转", "gearshape.2"),
        ("质检", "报告留痕", "checkmark.seal"),
        ("发运", "物流追踪", "truck.box"),
        ("存证", "双码核验", "lock.shield")
    ]

    private let sections: [(String, [WorkbenchItem])] = [
        ("生产流转", [
            WorkbenchItem("批次档案", "批次增删改查、GS1 信息", "shippingbox", .records(.batches)),
            WorkbenchItem("种植记录", "农事操作、地块、定位记录", "leaf", .planting),
            WorkbenchItem("加工记录", "加工批次、产线、产出数量", "gearshape.2", .processing),
            WorkbenchItem("产线作业", "快速记录产线加工动作", "point.3.connected.trianglepath.dotted", .lineWork),
            WorkbenchItem("质检记录", "质检结果与报告", "checkmark.seal", .inspection),
            WorkbenchItem("物流发运", "发货单和轨迹事件", "truck.box", .logistics)
        ]),
        ("可信核验", [
            WorkbenchItem("二维码", "单批次二维码生成", "qrcode", .qrcode),
            WorkbenchItem("终端码", "叶子批次与终端码列表", "qrcode.viewfinder", .terminalQrcode),
            WorkbenchItem("防伪&区块链", "隐形码、上链、验链", "lock.shield", .security)
        ]),
        ("管理看板", [
            WorkbenchItem("监管看板", "统计、完整率、预测数据", "chart.bar.xaxis", .dashboard),
            WorkbenchItem("用户管理", "管理员账号维护", "person.2", .users),
            WorkbenchItem("日志汇总", "跨模块记录审计", "list.bullet.rectangle", .logs)
        ])
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    UserHeroView(stats: stats, errorMessage: errorMessage)
                    UserFlowView(nodes: flowNodes)

                    ForEach(sections, id: \.0) { title, items in
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title)
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                ForEach(items) { item in
                                    NavigationLink(value: item.destination) {
                                        WorkbenchTile(item: item)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .liquidPageBackground()
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: WorkbenchDestination.self) { destination in
                switch destination {
                case .records(let spec):
                    RecordsModuleView(spec: spec)
                case .planting:
                    PlantingRecordsView()
                case .processing:
                    ProcessingRecordsView()
                case .inspection:
                    InspectionRecordsView()
                case .lineWork:
                    LineWorkView()
                case .logistics:
                    LogisticsView()
                case .qrcode:
                    QrcodeToolsView()
                case .terminalQrcode:
                    TerminalQrcodeView()
                case .security:
                    SecurityToolsView()
                case .dashboard:
                    DashboardView()
                case .logs:
                    LogsHubView()
                case .users:
                    UserManagementView()
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        do {
            stats = try await appState.api.dashboardStats()
            errorMessage = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct BatchWorkbenchView: View {
    @EnvironmentObject private var appState: AppState
    @State private var batches: [Batch] = []
    @State private var query = ""
    @State private var errorMessage = ""
    @State private var isLoading = false
    @State private var selectedQRCodeBatch = ""
    @State private var showsQRCode = false

    private var filtered: [Batch] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return batches }
        return batches.filter { batch in
            [batch.batchNo, batch.name, batch.category, batch.origin]
                .compactMap { $0?.lowercased() }
                .contains { $0.contains(trimmed.lowercased()) }
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("源头台账")
                                    .font(.title2.bold())
                                Text("\(filtered.count) 个批次档案")
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            StatusBadge(text: "\(filtered.filter { $0.gs1Locked == true }.count) 已锁定")
                        }

                        MetricGrid(items: [
                            ("展示范围", filtered.count),
                            ("已锁定", filtered.filter { $0.gs1Locked == true }.count),
                            ("有批次号", filtered.filter { ($0.batchNo ?? "").isEmpty == false }.count),
                            ("有库存", filtered.filter { $0.quantity != nil || $0.remainingQuantity != nil }.count)
                        ])
                    }
                    .surfacePanel()

                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(.secondary)
                        TextField("输入药材名或批次号查询", text: $query)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }
                    .liquidSearchField()

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        NavigationLink {
                            CreateRecordPage(spec: .batches, title: "新建批次")
                        } label: {
                            ActionTile(title: "新建批次", subtitle: "录入档案", systemImage: "plus.circle")
                        }
                        .buttonStyle(.plain)

                        NavigationLink {
                            ExternalBatchRegistrationView()
                        } label: {
                            ActionTile(title: "外源登记", subtitle: "登记来源", systemImage: "tray.and.arrow.down")
                        }
                        .buttonStyle(.plain)

                        NavigationLink {
                            TraceLookupView()
                        } label: {
                            ActionTile(title: "批次追溯", subtitle: "扫码或输入", systemImage: "qrcode.viewfinder")
                        }
                        .buttonStyle(.plain)

                        Button {
                            Task { await load() }
                        } label: {
                            ActionTile(title: "同步数据", subtitle: "刷新列表", systemImage: "arrow.clockwise")
                        }
                        .buttonStyle(.plain)
                    }

                    SectionHeader("批次列表")
                    if isLoading {
                        ProgressView("正在加载")
                    }
                    if filtered.isEmpty && !isLoading {
                        EmptyStateView(title: "暂无批次档案", message: "可以先新建源头批次，或调整查询条件。")
                    }
                    ForEach(filtered, id: \.stableID) { batch in
                        BatchLedgerRow(batch: batch) {
                            selectedQRCodeBatch = batch.batchNo ?? ""
                            showsQRCode = !selectedQRCodeBatch.isEmpty
                        }
                    }

                    if !errorMessage.isEmpty {
                        Text(errorMessage).foregroundStyle(.red)
                    }
                }
                .padding()
            }
            .liquidPageBackground()
            .navigationTitle("批次档案")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showsQRCode) {
                NavigationStack {
                    QrcodeToolsView(initialBatchNo: selectedQRCodeBatch)
                }
            }
            .toolbar {
                Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            batches = try await appState.api.rootBatches()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct BatchLedgerRow: View {
    let batch: Batch
    let onQRCode: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                HStack(alignment: .top, spacing: 10) {
                    IconPlate(systemImage: batch.gs1Locked == true ? "lock.shield" : "shippingbox")
                    VStack(alignment: .leading, spacing: 4) {
                        Text(batch.displayName)
                            .font(.headline)
                            .lineLimit(1)
                        Text("批次：\(batch.batchNo ?? "-")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 8)
                StatusBadge(text: batch.gs1Locked == true ? "已锁定" : "待锁定", isActive: batch.gs1Locked == true)
            }

            HStack(spacing: 8) {
                Label(batch.category ?? "未分类", systemImage: "tag")
                Label(batch.origin ?? "产地待完善", systemImage: "mappin.and.ellipse")
            }
            .font(.caption)
            .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("库存")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    if let quantity = batch.quantity {
                        Text("\(String(describing: quantity)) \(batch.unit ?? "")")
                            .font(.subheadline.bold())
                    } else {
                        Text("待同步")
                            .font(.subheadline.bold())
                    }
                }

                Rectangle()
                    .fill(Color(.separator).opacity(0.25))
                    .frame(width: 0.5, height: 30)

                VStack(alignment: .leading, spacing: 3) {
                    Text("GS1")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(batch.gs1Code?.isEmpty == false ? batch.gs1Code! : "未绑定")
                        .font(.subheadline.bold())
                        .lineLimit(1)
                }

                Spacer()
            }
            .padding(12)
            .background(Color.ytAccent.opacity(0.055))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            HStack {
                Button {
                    onQRCode()
                } label: {
                    Label("二维码", systemImage: "qrcode")
                }
                .buttonStyle(.glass(.regular))

                if let batchNo = batch.batchNo, !batchNo.isEmpty {
                    NavigationLink {
                        TraceVisualizationView(batchNo: batchNo)
                    } label: {
                        Label("可视化", systemImage: "point.3.connected.trianglepath.dotted")
                    }
                    .buttonStyle(.glassProminent)
                }

                Spacer()

                NavigationLink {
                    BatchDetailView(batch: batch)
                } label: {
                    Image(systemName: "chevron.right")
                        .frame(width: 34, height: 34)
                }
                .buttonStyle(.glass(.regular))
            }
            .font(.caption)
        }
        .surfacePanel()
    }
}

struct ExternalBatchRegistrationView: View {
    var body: some View {
        CreateRecordPage(
            spec: .batches,
            title: "外源登记",
            header: "登记外部来源批次，补充来源凭证 URL、数量、产地和用途说明。"
        )
    }
}

struct CreateRecordPage: View {
    @EnvironmentObject private var appState: AppState
    let spec: ModuleSpec
    let title: String
    var header = ""

    var body: some View {
        GenericFormView(title: title, fields: spec.fields) { values in
            guard let path = spec.createPath else { return }
            _ = try await appState.api.postObject(path: path, body: values)
        }
        .safeAreaInset(edge: .top) {
            if !header.isEmpty {
                Text(header)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.background)
            }
        }
    }
}

struct TraceVisualizationView: View {
    @EnvironmentObject private var appState: AppState
    let batchNo: String
    @State private var trace: TraceResponse?
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showsCertificate = false
    @State private var showsLedger = false

    private var stations: [TraceStation] {
        guard let trace else { return [] }
        let batch = trace.batch
        var result: [TraceStation] = [
            TraceStation(
                title: "地头溯源",
                subtitle: batch?.origin ?? "自有 GAP 基地",
                time: batch?.createdAt,
                records: ["品种批次已入库", "源头批次：\(batch?.batchNo ?? batchNo)"],
                output: batch?.quantity.map { "\($0) \(batch?.unit ?? "")" }
            )
        ]

        let planting = trace.plantingRecords ?? []
        if !planting.isEmpty {
            result.append(TraceStation(
                title: "种植记录",
                subtitle: "\(planting.count) 条农事操作",
                time: planting.first.map { formattedFieldText(key: "operationTime", value: $0.value("operationTime")) },
                records: planting.prefix(4).map { "\($0.value("operation").nonEmpty ?? "农事操作")：\($0.value("fieldName").nonEmpty ?? "地块待填")" },
                output: nil
            ))
        }

        let inspections = trace.inspectionRecords ?? []
        let rawInspections = inspections.filter { $0.value("inspectionType").uppercased() == "RAW" }
        result.append(TraceStation(
            title: "原料初检",
            subtitle: rawInspections.isEmpty ? "等待初检确认" : "\(rawInspections.count) 条记录",
            time: rawInspections.first.map { formattedFieldText(key: "createdAt", value: $0.value("createdAt")) },
            records: rawInspections.isEmpty ? ["等待产地初检确认"] : rawInspections.prefix(3).map { "结果：\($0.value("result").nonEmpty ?? "-")" },
            output: "原料入库"
        ))

        let processing = trace.processingRecords ?? []
        if !processing.isEmpty {
            let last = processing.last
            result.append(TraceStation(
                title: "工业化加工",
                subtitle: "\(processing.count) 条加工记录",
                time: last.map { formattedFieldText(key: "createdAt", value: $0.value("createdAt")) },
                records: processing.prefix(4).map { "\($0.value("processType").nonEmpty ?? "工序")：\($0.value("lineName").nonEmpty ?? "产线待填")" },
                output: last?.value("outputQuantity").nonEmpty ?? last?.value("extractedQuantity").nonEmpty
            ))
        } else {
            result.append(TraceStation(
                title: "数字化车间",
                subtitle: "待同步加工记录",
                time: nil,
                records: ["等待车间加工数据"],
                output: nil
            ))
        }

        let finished = inspections.filter {
            let type = $0.value("inspectionType").uppercased()
            return type == "FINISHED" || type.isEmpty
        }
        result.append(TraceStation(
            title: "成品出厂检",
            subtitle: finished.isEmpty ? "等待放行单" : "\(finished.count) 条记录",
            time: finished.first.map { formattedFieldText(key: "createdAt", value: $0.value("createdAt")) },
            records: finished.isEmpty ? ["等待批次检验放行单"] : finished.prefix(3).map { "放行：\($0.value("result").nonEmpty ?? "-")" },
            output: "质签达标"
        ))

        let logistics = trace.logisticsRecords ?? []
        let shipments = trace.shipmentsWithEvents ?? []
        result.append(TraceStation(
            title: "数字仓储物流",
            subtitle: logistics.isEmpty ? "\(shipments.count) 张发运单" : "\(logistics.count) 条轨迹",
            time: logistics.last.map { formattedFieldText(key: "createdAt", value: $0.value("createdAt")) },
            records: logistics.isEmpty ? ["待集仓出库"] : logistics.suffix(3).map { "位置：\($0.value("location").nonEmpty ?? "-")，状态：\($0.value("status").nonEmpty ?? "-")" },
            output: "运输中"
        ))

        return result
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("批次 \(batchNo)")
                                .font(.title2.bold())
                            Text("查看种植、加工、质检、物流全链路记录")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        StatusBadge(text: stations.isEmpty ? "加载中" : "已同步")
                    }

                    if let batch = trace?.batch {
                        MetricGrid(items: [
                            ("链路节点", stations.count),
                            ("种植", trace?.plantingRecords?.count ?? 0),
                            ("加工", trace?.processingRecords?.count ?? 0),
                            ("质检", trace?.inspectionRecords?.count ?? 0)
                        ])
                        InfoRow(label: "产地", value: batch.origin)
                        InfoRow(label: "状态", value: batch.status)
                    }
                }
                .surfacePanel()

                SectionHeader("链路概览")
                if isLoading {
                    ProgressView("正在加载")
                }
                ForEach(Array(stations.enumerated()), id: \.offset) { index, station in
                    TraceStationView(index: index + 1, station: station) {
                        if let record = trace?.processingRecords?.first {
                            return BatchLineageDetailView(record: record)
                        }
                        return nil
                    }
                }

                SectionHeader("链上凭证")
                VStack(alignment: .leading, spacing: 10) {
                    InfoRow(label: "智能合约", value: "0x3A9E8c3bF02D4A1B8C5F6A90eB32109F4aB2Cc41")
                    InfoRow(label: "批次编号", value: batchNo)
                    HStack {
                        Button("查看凭证") { showsCertificate = true }
                            .buttonStyle(.glassProminent)
                        Button("账本可视化") { showsLedger = true }
                            .buttonStyle(.glass(.regular))
                    }
                }
                .surfacePanel()

                if !errorMessage.isEmpty {
                    Text(errorMessage).foregroundStyle(.red)
                }
            }
            .padding()
        }
        .liquidScrollContent()
        .navigationTitle("可视化溯源")
        .sheet(isPresented: $showsCertificate) {
            BlockchainCertificateView(batchNo: batchNo)
        }
        .sheet(isPresented: $showsLedger) {
            LedgerVisualizationView(batchNo: batchNo)
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            trace = try await appState.api.trace(batchNo: batchNo)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct TraceStation: Hashable {
    let title: String
    let subtitle: String
    let time: String?
    let records: [String]
    let output: String?
}

struct TraceStationView<Detail: View>: View {
    let index: Int
    let station: TraceStation
    let detail: () -> Detail?

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                Text("\(index)")
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .frame(width: 28, height: 28)
                    .background(Color.ytAccent)
                    .clipShape(Circle())
                Rectangle()
                    .fill(Color(.systemGray5))
                    .frame(width: 1, height: 70)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(station.title)
                            .font(.headline)
                        Text(station.time?.nonEmpty ?? "待更新")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(station.subtitle)
                        .font(.caption.bold())
                        .foregroundStyle(Color.ytAccentDeep)
                }
                ForEach(station.records, id: \.self) { record in
                    Label(record, systemImage: "smallcircle.filled.circle")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if let output = station.output?.nonEmpty {
                    Text("产出：\(output)")
                        .font(.caption.bold())
                }
                if let detail = detail() {
                    NavigationLink("派生批次详情") {
                        detail
                    }
                    .font(.caption)
                }
            }
            .surfacePanel()
        }
    }
}

struct BatchLineageDetailView: View {
    let record: AnyJSONObject

    var body: some View {
        List {
            Section("加工信息") {
                InfoRow(label: "派生批次", value: record.value("childBatchNo").nonEmpty ?? record.value("batchNo"))
                InfoRow(label: "阶段", value: record.value("stage").nonEmpty ?? record.value("processType"))
                InfoRow(label: "工艺类型", value: record.value("processType"))
                InfoRow(label: "生产产线", value: record.value("lineName"))
                InfoRow(label: "操作人员", value: record.value("operator"))
                InfoRow(label: "操作时间", value: formattedFieldText(key: "createdAt", value: record.value("createdAt")))
            }
            Section("详细描述") {
                Text(record.value("details").nonEmpty ?? "暂无描述")
            }
            Section("来源信息") {
                InfoRow(label: "父批次号", value: record.value("parentBatchNo"))
            }
        }
        .liquidListStyle()
        .navigationTitle("派生批次详情")
    }
}

struct BlockchainCertificateView: View {
    let batchNo: String
    private var hash: String { mockHash(batchNo + "tx") }

    var body: some View {
        NavigationStack {
            List {
                Section("腾讯云至信链") {
                    InfoRow(label: "存证主体", value: "大创数字本草实验室")
                    InfoRow(label: "批次号", value: batchNo)
                    InfoRow(label: "合约地址", value: "0x3A9E8c3bF02D4A1B8C5F6A90eB32109F4aB2Cc41")
                    InfoRow(label: "区块高度", value: "\(16843029 + batchNo.count * 47)")
                    InfoRow(label: "数据哈希", value: hash)
                }
            }
            .navigationTitle("链上凭证")
        }
        .liquidListStyle()
    }
}

struct LedgerVisualizationView: View {
    let batchNo: String
    private var hash: String { mockHash(batchNo + "tx") }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader("共识节点")
                    HStack {
                        LedgerNode(title: "工厂", active: false)
                        Rectangle().fill(Color(.systemGray4)).frame(height: 1)
                        LedgerNode(title: "主链", active: true)
                        Rectangle().fill(Color(.systemGray4)).frame(height: 1)
                        LedgerNode(title: "监管", active: false)
                    }

                    SectionHeader("区块信息")
                    InfoCard(title: "区块记录", subtitle: batchNo) {
                        InfoRow(label: "高度", value: "\(16843029 + batchNo.count * 47)")
                        InfoRow(label: "时间", value: ISO8601DateFormatter().string(from: Date()))
                        InfoRow(label: "哈希", value: shortHash(hash))
                    }

                    SectionHeader("事务报文")
                    VStack(alignment: .leading, spacing: 6) {
                        Text("> ACTION: SMART_CONTRACT_INVOKE")
                        Text("> BATCH_NO: \(batchNo)")
                        Text("> CONTRACT: 0x3A9E...Cc41")
                        Text("> SHA256_HASH: \(shortHash(hash))")
                        Text("> STATUS: PACKED_IN_BLOCK")
                            .foregroundStyle(Color.ytAccentDeep)
                    }
                    .font(.caption.monospaced())
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .surfacePanel()
                }
                .padding()
            }
            .liquidScrollContent()
            .navigationTitle("账本可视化")
        }
    }
}

struct LedgerNode: View {
    let title: String
    let active: Bool

    var body: some View {
        Text(title)
            .font(.caption.bold())
            .foregroundStyle(active ? .white : .secondary)
            .frame(width: 58, height: 58)
            .background(active ? Color.ytAccent : Color(.secondarySystemBackground))
            .clipShape(Circle())
    }
}

struct PlantingDashboardView: View {
    @EnvironmentObject private var appState: AppState
    @State private var batches: [Batch] = []
    @State private var isLoading = false
    @State private var errorMessage = ""

    private var herbBars: [(String, Int)] { topCounts { $0.name ?? $0.category ?? "未命名药材" } }
    private var originBars: [(String, Int)] { topCounts { normalizeProvince($0.origin) } }
    private var categoryBars: [(String, Int)] { topCounts { $0.category ?? "未分类" } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                MetricGrid(items: [
                    ("种植批次", batches.count),
                    ("药材种类", Set(batches.map { $0.name ?? $0.category ?? "未命名" }).count),
                    ("产地来源", Set(batches.map { normalizeProvince($0.origin) }).count),
                    ("已锁定", batches.filter { $0.gs1Locked == true }.count)
                ])

                BarChartCard(title: "药材分布", caption: "按源头批次统计主要药材", items: herbBars)
                BarChartCard(title: "产地分布", caption: "按批次来源统计主要产地", items: originBars)
                TagCloudCard(title: "药材分类", items: categoryBars)

                if isLoading { ProgressView("同步中") }
                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
            }
            .padding()
        }
        .liquidScrollContent()
        .navigationTitle("种植统计")
        .toolbar {
            Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            batches = try await appState.api.rootBatches()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func topCounts(_ key: (Batch) -> String?) -> [(String, Int)] {
        let counts = batches.reduce(into: [String: Int]()) { result, batch in
            let name = key(batch)?.nonEmpty ?? "未分类"
            result[name, default: 0] += 1
        }
        return counts.sorted { $0.value > $1.value }.prefix(6).map { ($0.key, $0.value) }
    }
}

struct BarChartCard: View {
    let title: String
    let caption: String
    let items: [(String, Int)]

    private var maxValue: Int { max(1, items.map(\.1).max() ?? 1) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(caption).font(.caption).foregroundStyle(.secondary)
            }
            if items.isEmpty {
                Text("暂无统计数据").foregroundStyle(.secondary)
            } else {
                ForEach(items, id: \.0) { item in
                    HStack {
                        Text(item.0)
                            .font(.caption)
                            .frame(width: 76, alignment: .leading)
                            .lineLimit(1)
                        GeometryReader { proxy in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.ytAccent.opacity(0.18))
                                .overlay(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.ytAccent)
                                        .frame(width: max(16, proxy.size.width * CGFloat(item.1) / CGFloat(maxValue)))
                                }
                        }
                        .frame(height: 10)
                        Text("\(item.1)")
                            .font(.caption.bold())
                            .frame(width: 24, alignment: .trailing)
                    }
                }
            }
        }
        .surfacePanel()
    }
}

struct TagCloudCard: View {
    let title: String
    let items: [(String, Int)]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.headline)
            FlowTags(items: items)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .surfacePanel()
    }
}

struct FlowTags: View {
    let items: [(String, Int)]

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 92), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(items, id: \.0) { item in
                Text("\(item.0) \(item.1)")
                    .font(.caption.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(Color.ytAccent.opacity(0.12))
                    .foregroundStyle(Color.ytAccentDeep)
                    .clipShape(Capsule())
            }
        }
    }
}

private func normalizeProvince(_ raw: String?) -> String {
    let text = raw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if text.isEmpty { return "未标注产地" }
    let aliases = ["北京", "天津", "上海", "重庆", "内蒙古", "广西", "西藏", "宁夏", "新疆", "黑龙江", "吉林", "辽宁", "河北", "山西", "陕西", "甘肃", "青海", "山东", "江苏", "浙江", "安徽", "福建", "江西", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "台湾", "香港", "澳门"]
    return aliases.first(where: { text.contains($0) }) ?? String(text.prefix(4))
}

private func mockHash(_ value: String) -> String {
    let chars = Array("0123456789abcdef")
    var seed = value.unicodeScalars.reduce(0) { $0 + Int($1.value) }
    var result = "0x"
    for _ in 0..<64 {
        seed = (seed &* 1103515245 &+ 12345) & 0x7fffffff
        result.append(chars[seed % chars.count])
    }
    return result
}

private func shortHash(_ value: String) -> String {
    guard value.count > 14 else { return value }
    return "\(value.prefix(8))...\(value.suffix(6))"
}

struct UserProductionView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader("生产流转")
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        NavigationLink { PlantingRecordsView() } label: { ActionTile(title: "种植记录", subtitle: "农事采集", systemImage: "leaf") }
                        NavigationLink { PlantingFormView(onSaved: {}) } label: { ActionTile(title: "新增种植", subtitle: "补充地块信息", systemImage: "plus.circle") }
                        NavigationLink { PlantingDashboardView() } label: { ActionTile(title: "种植统计", subtitle: "产地与品类分布", systemImage: "chart.bar.xaxis") }
                        NavigationLink { ProcessingRecordsView() } label: { ActionTile(title: "加工记录", subtitle: "产线流转", systemImage: "gearshape.2") }
                        NavigationLink { ProcessingFormView(onSaved: {}) } label: { ActionTile(title: "新增加工", subtitle: "记录加工动作", systemImage: "plus.rectangle.on.rectangle") }
                        NavigationLink { LineWorkView() } label: { ActionTile(title: "产线作业", subtitle: "快速录入", systemImage: "point.3.connected.trianglepath.dotted") }
                        NavigationLink { InspectionRecordsView() } label: { ActionTile(title: "质检记录", subtitle: "报告留痕", systemImage: "checkmark.seal") }
                        NavigationLink { LogisticsView() } label: { ActionTile(title: "物流发运", subtitle: "轨迹事件", systemImage: "truck.box") }
                    }
                    .buttonStyle(.plain)

                    SectionHeader("看板与审计")
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        NavigationLink { DashboardView() } label: { ActionTile(title: "监管看板", subtitle: "完整率与预测", systemImage: "chart.line.uptrend.xyaxis") }
                        NavigationLink { LogsHubView() } label: { ActionTile(title: "日志汇总", subtitle: "跨模块审计", systemImage: "list.bullet.rectangle") }
                    }
                    .buttonStyle(.plain)
                }
                .padding()
            }
            .liquidPageBackground()
            .navigationTitle("生产")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct UserTrustToolsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader("可信核验")
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        NavigationLink { QrcodeToolsView() } label: { ActionTile(title: "二维码", subtitle: "单批次生成", systemImage: "qrcode") }
                        NavigationLink { TerminalQrcodeView() } label: { ActionTile(title: "终端码", subtitle: "叶子批次映射", systemImage: "qrcode.viewfinder") }
                        NavigationLink { SecurityToolsView() } label: { ActionTile(title: "防伪存证", subtitle: "上链与验链", systemImage: "lock.shield") }
                        NavigationLink { TraceLookupView() } label: { ActionTile(title: "扫码寻迹", subtitle: "核验全链路", systemImage: "viewfinder") }
                    }
                    .buttonStyle(.plain)

                    SectionHeader("系统管理")
                    NavigationLink { UserManagementView() } label: {
                        ActionTile(title: "用户管理", subtitle: "角色与账号维护", systemImage: "person.2")
                    }
                    .buttonStyle(.plain)
                }
                .padding()
            }
            .liquidPageBackground()
            .navigationTitle("核验")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct UserHeroView: View {
    let stats: AnyJSONObject?
    let errorMessage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("批次追溯工作台")
                        .font(.title.weight(.heavy))
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)
                    Text("面向种植、加工、质检、物流与监管角色")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                IconPlate(systemImage: "point.3.connected.trianglepath.dotted")
            }

            MetricGrid(items: [
                ("批次", metric("totalBatches")),
                ("根批次", metric("totalRootBatches")),
                ("叶子批次", metric("totalLeafBatches")),
                ("发运", metric("totalShipments"))
            ])

            if !errorMessage.isEmpty {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .surfacePanel()
    }

    private func metric(_ key: String) -> Int {
        guard let stats else { return 0 }
        return Int(stats.value(key)) ?? 0
    }
}

struct UserFlowView: View {
    let nodes: [(String, String, String)]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader("环节进度")
            VStack(spacing: 0) {
                ForEach(Array(nodes.enumerated()), id: \.offset) { index, node in
                    HStack(spacing: 12) {
                        VStack(spacing: 0) {
                            ZStack {
                                Circle()
                                    .fill(index <= 3 ? Color.ytAccent : Color(.systemGray4))
                                    .frame(width: 26, height: 26)
                                Image(systemName: node.2)
                                    .font(.caption2)
                                    .foregroundStyle(.white)
                            }
                            if index != nodes.count - 1 {
                                Rectangle()
                                    .fill(Color(.systemGray5))
                                    .frame(width: 1, height: 22)
                            }
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(node.0)
                                .font(.subheadline.bold())
                            Text(node.1)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        StatusBadge(text: index <= 3 ? "已接入" : "待同步", isActive: index <= 3)
                    }
                    .padding(.vertical, 4)
                }
            }
            .surfacePanel()
        }
    }
}

struct WorkbenchTile: View {
    let item: WorkbenchItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            IconPlate(systemImage: item.systemImage)
            Text(item.title)
                .font(.headline)
                .foregroundStyle(.primary)
            Text(item.subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, minHeight: 126, alignment: .topLeading)
        .surfacePanel()
    }
}

struct ActionTile: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            IconPlate(systemImage: systemImage)
            Text(title)
                .font(.headline)
                .foregroundStyle(.primary)
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 106, alignment: .topLeading)
        .surfacePanel()
    }
}

struct InfoPill: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.caption.bold())
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct RoleGateView<Content: View>: View {
    @EnvironmentObject private var appState: AppState
    let feature: AppFeature
    @ViewBuilder let content: Content

    var body: some View {
        if appState.canAccess(feature) {
            content
                .task { await appState.refreshProfile() }
        } else {
            EmptyStateView(title: "当前角色无权限", message: "请切换到有权限的账号后再访问该功能。")
                .padding()
                .navigationTitle("无权限")
        }
    }
}

struct PlantingRecordsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var records: [AnyJSONObject] = []
    @State private var query = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showsCreate = false

    private var filtered: [AnyJSONObject] {
        filter(records, query: query, keys: ["batchNo", "fieldName", "operation", "operator"])
    }

    var body: some View {
        RoleGateView(feature: .planting) {
            List {
                Section {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        TextField("按批次、地块、操作人搜索", text: $query)
                            .textInputAutocapitalization(.never)
                    }
                }
                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
                ForEach(filtered) { record in
                    NavigationLink {
                        RecordDetailView(spec: .planting, record: record) { await load() }
                    } label: {
                        RecordRow(record: record, keys: ["batchNo", "operation", "fieldName", "operationTime"])
                    }
                }
            }
            .liquidListStyle()
            .overlay {
                if isLoading {
                    ProgressView("正在加载种植记录")
                } else if filtered.isEmpty && errorMessage.isEmpty {
                    EmptyStateView(title: "暂无种植记录", message: "可新增农事操作，记录地块、时间、图片和音频凭证。")
                }
            }
            .navigationTitle("种植记录")
            .toolbar {
                Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
                Button { showsCreate = true } label: { Image(systemName: "plus") }
            }
            .sheet(isPresented: $showsCreate) {
                NavigationStack {
                    PlantingFormView { Task { await load() } }
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            records = try await appState.api.records(path: "/api/v1/planting")
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PlantingFormView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    let onSaved: () -> Void

    @State private var batchNo = ""
    @State private var fieldName = ""
    @State private var operation = "播种"
    @State private var operationTime = defaultFormTime()
    @State private var details = ""
    @State private var operatorName = ""
    @State private var latitude = ""
    @State private var longitude = ""
    @State private var imageUrl = ""
    @State private var audioUrl = ""
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var isSubmitting = false
    @State private var message = ""

    private let operations = ["播种", "浇水", "施肥", "除草", "病虫害防治", "采收", "巡检"]

    var body: some View {
        Form {
            Section("批次与地块") {
                TextField("批次号", text: $batchNo)
                    .textInputAutocapitalization(.never)
                TextField("地块", text: $fieldName)
                Picker("操作类型", selection: $operation) {
                    ForEach(operations, id: \.self) { Text($0) }
                }
                TextField("操作时间", text: $operationTime)
                TextField("操作人", text: $operatorName)
            }
            Section("现场信息") {
                TextField("详情", text: $details, axis: .vertical)
                TextField("纬度", text: $latitude)
                    .keyboardType(.decimalPad)
                TextField("经度", text: $longitude)
                    .keyboardType(.decimalPad)
                HStack {
                    TextField("图片 URL", text: $imageUrl)
                        .textInputAutocapitalization(.never)
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Image(systemName: "photo.badge.plus")
                    }
                }
                TextField("音频 URL", text: $audioUrl)
                    .textInputAutocapitalization(.never)
                Text("iOS 版已支持相册图片上传；音频可填已有 URL。")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if !message.isEmpty { Text(message).foregroundStyle(message.contains("成功") ? Color.ytAccentDeep : .red) }
            Button {
                Task { await submit() }
            } label: {
                isSubmitting ? AnyView(ProgressView()) : AnyView(Text("保存种植记录"))
            }
            .disabled(isSubmitting || batchNo.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .liquidFormStyle()
        .navigationTitle("新增种植")
        .toolbar { Button("取消") { dismiss() } }
        .onChange(of: selectedPhoto) { _, newValue in
            guard let newValue else { return }
            Task { await upload(photo: newValue) }
        }
    }

    private func upload(photo: PhotosPickerItem) async {
        do {
            guard let data = try await photo.loadTransferable(type: Data.self) else { return }
            let response = try await appState.api.uploadFile(data: data, fileName: "planting-\(UUID().uuidString).jpg", mimeType: "image/jpeg")
            imageUrl = response.value("url").nonEmpty ?? response.value("path").nonEmpty ?? response.value("fileUrl")
            message = "图片上传成功"
        } catch {
            message = error.localizedDescription
        }
    }

    private func submit() async {
        isSubmitting = true
        message = ""
        defer { isSubmitting = false }
        var payload: [String: JSONValue] = [
            "batchNo": .string(batchNo),
            "fieldName": .string(fieldName),
            "operation": .string(operation),
            "operationTime": .string(operationTime),
            "details": .string(details),
            "operator": .string(operatorName),
            "imageUrl": .string(imageUrl),
            "audioUrl": .string(audioUrl)
        ]
        if let value = Double(latitude) { payload["latitude"] = .number(value) }
        if let value = Double(longitude) { payload["longitude"] = .number(value) }
        do {
            _ = try await appState.api.postObject(path: "/api/v1/planting", body: compactPayload(payload))
            message = "保存成功"
            onSaved()
            dismiss()
        } catch {
            message = error.localizedDescription
        }
    }
}

struct ProcessingRecordsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var records: [AnyJSONObject] = []
    @State private var query = ""
    @State private var showsCreate = false
    @State private var showsScanner = false
    @State private var isLoading = false
    @State private var errorMessage = ""

    private var filtered: [AnyJSONObject] {
        filter(records, query: query, keys: ["batchNo", "parentBatchNo", "childBatchNo", "processType", "lineName", "factory"])
    }

    var body: some View {
        RoleGateView(feature: .processing) {
            List {
                Section {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        TextField("批次号、工序、产线", text: $query)
                            .textInputAutocapitalization(.never)
                        Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                    }
                }
                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
                ForEach(filtered) { record in
                    NavigationLink {
                        RecordDetailView(spec: .processing, record: record) { await load() }
                    } label: {
                        RecordRow(record: record, keys: ["batchNo", "processType", "lineName", "outputQuantity"])
                    }
                }
            }
            .liquidListStyle()
            .overlay {
                if isLoading { ProgressView("正在加载加工记录") }
                else if filtered.isEmpty && errorMessage.isEmpty { EmptyStateView(title: "暂无加工记录", message: "扫码或输入批次后记录产线加工、投入和产出。") }
            }
            .navigationTitle("加工记录")
            .toolbar {
                Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
                Button { showsCreate = true } label: { Image(systemName: "plus") }
            }
            .sheet(isPresented: $showsCreate) {
                NavigationStack { ProcessingFormView(initialBatchNo: query) { Task { await load() } } }
            }
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    query = extractBatchNo(from: value)
                    showsScanner = false
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            records = try await appState.api.records(path: "/api/v1/processing")
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ProcessingFormView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    var initialBatchNo = ""
    let onSaved: () -> Void

    @State private var batchNo = ""
    @State private var parentBatchNo = ""
    @State private var processType = "清洗"
    @State private var lineName = ""
    @State private var factory = ""
    @State private var details = ""
    @State private var operatorName = ""
    @State private var extractedQuantity = ""
    @State private var outputQuantity = ""
    @State private var outputUnit = "kg"
    @State private var imageUrl = ""
    @State private var mode = "普通加工"
    @State private var showsScanner = false
    @State private var result = ""

    private let processTypes = ["清洗", "切制", "干燥", "炮制", "包装", "入库"]

    var body: some View {
        Form {
            Section("作业模式") {
                Picker("模式", selection: $mode) {
                    Text("普通加工").tag("普通加工")
                    Text("父子批次派生").tag("父子批次派生")
                }
                .pickerStyle(.segmented)
                HStack {
                    TextField("当前批次号", text: $batchNo)
                        .textInputAutocapitalization(.never)
                    Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                }
                if mode == "父子批次派生" {
                    TextField("父批次号", text: $parentBatchNo)
                        .textInputAutocapitalization(.never)
                }
            }
            Section("工艺") {
                Picker("工序", selection: $processType) {
                    ForEach(processTypes, id: \.self) { Text($0) }
                }
                TextField("生产产线", text: $lineName)
                TextField("工厂", text: $factory)
                TextField("操作人", text: $operatorName)
                TextField("详情", text: $details, axis: .vertical)
            }
            Section("数量") {
                TextField("投入数量", text: $extractedQuantity)
                    .keyboardType(.decimalPad)
                TextField("产出数量", text: $outputQuantity)
                    .keyboardType(.decimalPad)
                TextField("产出单位", text: $outputUnit)
                TextField("图片 URL", text: $imageUrl)
                    .textInputAutocapitalization(.never)
            }
            if !result.isEmpty { Text(result).foregroundStyle(result.contains("成功") ? Color.ytAccentDeep : .red) }
            Button("保存加工记录") { Task { await submit() } }
                .disabled(batchNo.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .liquidFormStyle()
        .navigationTitle("新增加工")
        .toolbar { Button("取消") { dismiss() } }
        .sheet(isPresented: $showsScanner) {
            QRScannerView { value in
                batchNo = extractBatchNo(from: value)
                if parentBatchNo.isEmpty { parentBatchNo = batchNo }
                showsScanner = false
            }
        }
        .onAppear {
            if batchNo.isEmpty { batchNo = initialBatchNo }
        }
    }

    private func submit() async {
        var payload: [String: JSONValue] = [
            "batchNo": .string(batchNo),
            "parentBatchNo": .string(mode == "父子批次派生" ? (parentBatchNo.nonEmpty ?? batchNo) : parentBatchNo),
            "processType": .string(processType),
            "lineName": .string(lineName),
            "factory": .string(factory),
            "details": .string(details),
            "operator": .string(operatorName),
            "outputUnit": .string(outputUnit),
            "imageUrl": .string(imageUrl)
        ]
        if let value = Double(extractedQuantity) { payload["extractedQuantity"] = .number(value) }
        if let value = Double(outputQuantity) { payload["outputQuantity"] = .number(value) }
        do {
            let response = try await appState.api.postObject(path: "/api/v1/processing", body: compactPayload(payload))
            let child = response.value("childBatchNo").nonEmpty ?? response.value("batchNo")
            result = "保存成功：\(child)"
            onSaved()
            dismiss()
        } catch {
            result = error.localizedDescription
        }
    }
}

struct InspectionRecordsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var records: [AnyJSONObject] = []
    @State private var query = ""
    @State private var showsCreate = false
    @State private var showsScanner = false
    @State private var isLoading = false
    @State private var errorMessage = ""

    private var filtered: [AnyJSONObject] {
        filter(records, query: query, keys: ["batchNo", "inspectionType", "result", "inspector"])
    }

    var body: some View {
        RoleGateView(feature: .inspection) {
            List {
                Section {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        TextField("批次号或质检结果", text: $query)
                            .textInputAutocapitalization(.never)
                        Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                    }
                }
                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
                ForEach(filtered) { record in
                    NavigationLink {
                        RecordDetailView(spec: .inspection, record: record) { await load() }
                    } label: {
                        RecordRow(record: record, keys: ["batchNo", "inspectionType", "result", "inspector"])
                    }
                }
            }
            .liquidListStyle()
            .overlay {
                if isLoading { ProgressView("正在加载质检记录") }
                else if filtered.isEmpty && errorMessage.isEmpty { EmptyStateView(title: "暂无质检记录", message: "可录入原料或成品质检，并按需要派生成品批次。") }
            }
            .navigationTitle("质检记录")
            .toolbar {
                Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
                Button { showsCreate = true } label: { Image(systemName: "plus") }
            }
            .sheet(isPresented: $showsCreate) {
                NavigationStack { InspectionFormView(initialBatchNo: query) { Task { await load() } } }
            }
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    query = extractBatchNo(from: value)
                    showsScanner = false
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            let path = query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "/api/v1/inspection" : "/api/v1/inspection?batchNo=\(query)"
            records = try await appState.api.records(path: path)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct InspectionFormView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    var initialBatchNo = ""
    let onSaved: () -> Void

    @State private var batchNo = ""
    @State private var inspectionType = "RAW"
    @State private var result = "合格"
    @State private var reportUrl = ""
    @State private var inspector = ""
    @State private var deriveFinishedBatch = false
    @State private var message = ""

    var body: some View {
        Form {
            Section("质检对象") {
                TextField("批次号", text: $batchNo)
                    .textInputAutocapitalization(.never)
                Picker("质检类型", selection: $inspectionType) {
                    Text("原料初检 RAW").tag("RAW")
                    Text("成品检验 FINISHED").tag("FINISHED")
                }
                Picker("结果", selection: $result) {
                    ForEach(["合格", "不合格", "待复检"], id: \.self) { Text($0) }
                }
            }
            Section("报告") {
                TextField("报告 URL", text: $reportUrl)
                    .textInputAutocapitalization(.never)
                TextField("质检员", text: $inspector)
                Toggle("通过质检派生成品批次", isOn: $deriveFinishedBatch)
            }
            if !message.isEmpty { Text(message).foregroundStyle(message.contains("成功") ? Color.ytAccentDeep : .red) }
            Button("提交质检") { Task { await submit() } }
                .disabled(batchNo.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .liquidFormStyle()
        .navigationTitle("新增质检")
        .toolbar { Button("取消") { dismiss() } }
        .onAppear {
            if batchNo.isEmpty { batchNo = initialBatchNo }
        }
    }

    private func submit() async {
        let payload = compactPayload([
            "batchNo": .string(batchNo),
            "inspectionType": .string(inspectionType),
            "result": .string(result),
            "reportUrl": .string(reportUrl),
            "inspector": .string(inspector)
        ])
        do {
            let response: AnyJSONObject
            if deriveFinishedBatch {
                response = try await appState.api.inspectionDerive(body: payload)
            } else {
                response = try await appState.api.postObject(path: "/api/v1/inspection", body: payload)
            }
            message = "提交成功 \(response.value("batchNo"))"
            onSaved()
            dismiss()
        } catch {
            message = error.localizedDescription
        }
    }
}

struct RecordsModuleView: View {
    @EnvironmentObject private var appState: AppState
    let spec: ModuleSpec
    @State private var records: [AnyJSONObject] = []
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showsCreate = false

    var body: some View {
        List {
            if !errorMessage.isEmpty {
                Text(errorMessage).foregroundStyle(.red)
            }
            ForEach(records) { record in
                NavigationLink {
                    RecordDetailView(spec: spec, record: record) {
                        await load()
                    }
                } label: {
                    RecordRow(record: record, keys: spec.primaryKeys)
                }
            }
        }
        .liquidListStyle()
        .overlay {
            if isLoading {
                ProgressView("正在加载")
            } else if records.isEmpty && errorMessage.isEmpty {
                EmptyStateView(title: "暂无数据", message: spec.subtitle)
            }
        }
        .navigationTitle(spec.title)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    Task { await load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                if spec.createPath != nil {
                    Button {
                        showsCreate = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showsCreate) {
            NavigationStack {
                GenericFormView(title: "新增\(spec.title)", fields: spec.fields) { values in
                    guard let path = spec.createPath else { return }
                    _ = try await appState.api.postObject(path: path, body: values)
                    await load()
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            records = try await appState.api.records(path: spec.listPath)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct RecordDetailView: View {
    @EnvironmentObject private var appState: AppState
    let spec: ModuleSpec
    let record: AnyJSONObject
    let onChanged: () async -> Void
    @State private var errorMessage = ""
    @State private var showsEdit = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                RecordDetailHero(spec: spec, title: recordTitle(record), subtitle: recordSubtitle, status: recordStatus)

                DetailSummaryStrip(items: summaryItems)

                if !businessFields.isEmpty {
                    DetailPanel(title: "业务信息", systemImage: spec.systemImage) {
                        ForEach(businessFields) { field in
                            DetailFieldRow(field: field)
                        }
                    }
                }

                if !timeFields.isEmpty {
                    DetailPanel(title: "时间与人员", systemImage: "clock") {
                        ForEach(timeFields) { field in
                            DetailFieldRow(field: field)
                        }
                    }
                }

                if !attachmentFields.isEmpty {
                    DetailPanel(title: "凭证附件", systemImage: "paperclip") {
                        ForEach(attachmentFields) { field in
                            DetailFieldRow(field: field)
                        }
                    }
                }

                if !systemFields.isEmpty {
                    DetailPanel(title: "系统信息", systemImage: "number") {
                        ForEach(systemFields) { field in
                            DetailFieldRow(field: field)
                        }
                    }
                }

                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color.red.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                DetailActionBar(
                    canEdit: spec.updatePathPrefix != nil,
                    canDelete: spec.deletePathPrefix != nil,
                    onEdit: { showsEdit = true },
                    onDelete: { Task { await deleteRecord() } }
                )
            }
            .padding()
            .padding(.bottom, 84)
        }
        .liquidScrollContent()
        .navigationTitle(recordTitle(record))
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showsEdit) {
            NavigationStack {
                GenericFormView(title: "编辑\(spec.title)", fields: spec.fields, initial: record) { values in
                    guard let id = record.value("id").nonEmpty, let prefix = spec.updatePathPrefix else { return }
                    _ = try await appState.api.putObject(path: "\(prefix)/\(id)", body: values)
                    await onChanged()
                }
            }
        }
    }

    private var recordSubtitle: String {
        record.value("batchNo").nonEmpty
            ?? record.value("parentBatchNo").nonEmpty
            ?? record.value("shipmentNo").nonEmpty
            ?? spec.title
    }

    private var recordStatus: String {
        record.value("status").nonEmpty
            ?? record.value("result").nonEmpty
            ?? record.value("operation").nonEmpty
            ?? record.value("processType").nonEmpty
            ?? "已记录"
    }

    private var summaryItems: [DetailSummaryItem] {
        [
            DetailSummaryItem(title: "状态", value: recordStatus, systemImage: "checkmark.seal"),
            DetailSummaryItem(title: "编号", value: record.value("id").nonEmpty ?? record.value("batchNo").nonEmpty ?? "-", systemImage: "number"),
            DetailSummaryItem(title: "时间", value: firstTimeValue ?? "待同步", systemImage: "clock")
        ]
    }

    private var firstTimeValue: String? {
        for key in ["operationTime", "createdAt", "updatedAt"] {
            if let raw = record.value(key).nonEmpty {
                return formattedFieldText(key: key, value: raw)
            }
        }
        return nil
    }

    private var businessFields: [DetailField] {
        detailFields(excluding: systemKeys.union(timeKeys).union(attachmentKeys))
    }

    private var timeFields: [DetailField] {
        detailFields(only: timeKeys)
    }

    private var attachmentFields: [DetailField] {
        detailFields(only: attachmentKeys)
    }

    private var systemFields: [DetailField] {
        detailFields(only: systemKeys)
    }

    private var systemKeys: Set<String> {
        ["id", "createdBy", "updatedBy"]
    }

    private var timeKeys: Set<String> {
        ["createdAt", "updatedAt", "operationTime", "productionDate"]
    }

    private var attachmentKeys: Set<String> {
        ["imageUrl", "audioUrl", "reportUrl", "traceUrl", "txHash", "contractAddress"]
    }

    private func detailFields(only keys: Set<String>? = nil, excluding excluded: Set<String> = []) -> [DetailField] {
        record.values
            .filter { key, value in
                let text = localizedFieldValue(key: key, value: value)
                guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
                if let keys {
                    return keys.contains(key)
                }
                return !excluded.contains(key)
            }
            .sorted { lhs, rhs in
                sortRank(lhs.key) == sortRank(rhs.key) ? lhs.key < rhs.key : sortRank(lhs.key) < sortRank(rhs.key)
            }
            .map { key, value in
                DetailField(key: key, label: localizedFieldLabel(key), value: localizedFieldValue(key: key, value: value))
            }
    }

    private func sortRank(_ key: String) -> Int {
        let order = ["batchNo", "parentBatchNo", "name", "operation", "processType", "fieldName", "factory", "lineName", "details", "result", "operator", "inspector", "location", "status"]
        return order.firstIndex(of: key) ?? 999
    }

    private func deleteRecord() async {
        guard let id = record.value("id").nonEmpty, let prefix = spec.deletePathPrefix else { return }
        do {
            try await appState.api.delete(path: "\(prefix)/\(id)")
            await onChanged()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func recordTitle(_ record: AnyJSONObject) -> String {
        for key in spec.primaryKeys {
            if let value = record.value(key).nonEmpty { return value }
        }
        return spec.title
    }
}

struct DetailField: Identifiable {
    let key: String
    let label: String
    let value: String
    var id: String { key }
}

struct DetailSummaryItem: Identifiable {
    let id = UUID()
    let title: String
    let value: String
    let systemImage: String
}

struct RecordDetailHero: View {
    let spec: ModuleSpec
    let title: String
    let subtitle: String
    let status: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                IconPlate(systemImage: spec.systemImage)

                VStack(alignment: .leading, spacing: 4) {
                    Text(spec.title)
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                    Text(title)
                        .font(.largeTitle.weight(.heavy))
                        .lineLimit(2)
                        .minimumScaleFactor(0.75)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer(minLength: 8)
            }

            HStack {
                StatusBadge(text: status)
                Spacer()
                Label("记录详情", systemImage: "doc.text")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .surfacePanel()
    }
}

struct DetailSummaryStrip: View {
    let items: [DetailSummaryItem]

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
            ForEach(items) { item in
                VStack(alignment: .leading, spacing: 6) {
                    Image(systemName: item.systemImage)
                        .font(.caption)
                        .foregroundStyle(Color.ytAccentDeep)
                    Text(item.title)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(item.value)
                        .font(.caption.bold())
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                }
                .frame(maxWidth: .infinity, minHeight: 84, alignment: .topLeading)
                .surfacePanel(padding: 10)
            }
        }
    }
}

struct DetailPanel<Content: View>: View {
    let title: String
    let systemImage: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(title, systemImage: systemImage)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
            }
            content
        }
        .surfacePanel()
    }
}

struct DetailFieldRow: View {
    let field: DetailField

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(field.label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(field.value)
                .font(.body)
                .frame(maxWidth: .infinity, alignment: .leading)
                .textSelection(.enabled)
        }
        .padding(.vertical, 6)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color(.separator).opacity(0.45))
                .frame(height: 0.5)
        }
    }
}

struct DetailActionBar: View {
    let canEdit: Bool
    let canDelete: Bool
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            if canEdit {
                Button {
                    onEdit()
                } label: {
                    Label("编辑记录", systemImage: "square.and.pencil")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
            }

            if canDelete {
                Button(role: .destructive) {
                    onDelete()
                } label: {
                    Label("删除", systemImage: "trash")
                        .frame(maxWidth: canEdit ? nil : .infinity)
                }
                .buttonStyle(.glass(.regular))
            }
        }
    }
}

struct GenericFormView: View {
    let title: String
    let fields: [FormField]
    var initial: AnyJSONObject?
    let onSubmit: ([String: JSONValue]) async throws -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var values: [String: String] = [:]
    @State private var errorMessage = ""
    @State private var isSubmitting = false

    var body: some View {
        Form {
            Section(title) {
                ForEach(fields) { field in
                    TextField(field.placeholder.isEmpty ? field.title : field.placeholder, text: binding(for: field.id), axis: .vertical)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    if field.required && binding(for: field.id).wrappedValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text("\(field.title) 必填").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            if !errorMessage.isEmpty {
                Text(errorMessage).foregroundStyle(.red)
            }
            Button {
                Task { await submit() }
            } label: {
                if isSubmitting {
                    ProgressView()
                } else {
                    Text("保存")
                }
            }
            .disabled(isSubmitting)
        }
        .liquidFormStyle()
        .navigationTitle(title)
        .toolbar {
            Button("取消") { dismiss() }
        }
        .onAppear {
            if values.isEmpty {
                values = Dictionary(uniqueKeysWithValues: fields.map { ($0.id, initial?.value($0.id) ?? "") })
            }
        }
    }

    private func binding(for key: String) -> Binding<String> {
        Binding(get: { values[key] ?? "" }, set: { values[key] = $0 })
    }

    private func submit() async {
        isSubmitting = true
        errorMessage = ""
        defer { isSubmitting = false }
        let payload = values.reduce(into: [String: JSONValue]()) { result, pair in
            let trimmed = pair.value.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty { return }
            if let number = Double(trimmed), pair.key.lowercased().contains("quantity") || pair.key.lowercased().contains("latitude") || pair.key.lowercased().contains("longitude") {
                result[pair.key] = .number(number)
            } else {
                result[pair.key] = .string(trimmed)
            }
        }
        do {
            try await onSubmit(payload)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct LogisticsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var shipments: [AnyJSONObject] = []
    @State private var batchNo = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showsCreate = false
    @State private var showsScanner = false

    var body: some View {
        RoleGateView(feature: .logistics) {
            List {
                Section {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        TextField("按批次号筛选物流", text: $batchNo)
                            .textInputAutocapitalization(.never)
                        Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                    }
                }
                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
                ForEach(shipments) { shipment in
                    NavigationLink {
                        ShipmentDetailView(shipment: shipment)
                    } label: {
                        RecordRow(record: shipment, keys: ["shipmentNo", "distributorName", "carrier", "trackingNo"])
                    }
                }
            }
            .liquidListStyle()
            .overlay {
                if isLoading {
                    ProgressView("正在加载发运单")
                } else if shipments.isEmpty && errorMessage.isEmpty {
                    EmptyStateView(title: "暂无物流记录", message: "可以按批次扫码查询，或新建发运单并追加运输事件。")
                }
            }
            .navigationTitle("物流发运")
            .toolbar {
                Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
                Button { showsCreate = true } label: { Image(systemName: "plus") }
            }
            .sheet(isPresented: $showsCreate) {
                NavigationStack { ShipmentCreateView { Task { await load() } } }
            }
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    batchNo = extractBatchNo(from: value)
                    showsScanner = false
                    Task { await load() }
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        let trimmed = batchNo.trimmingCharacters(in: .whitespacesAndNewlines)
        let path = trimmed.isEmpty ? "/api/v1/shipments" : "/api/v1/shipments?batchNo=\(trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? trimmed)"
        do {
            shipments = try await appState.api.records(path: path)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ShipmentCreateView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    var onSaved: () -> Void = {}
    @State private var batchNo = ""
    @State private var quantity = ""
    @State private var unit = "kg"
    @State private var distributorName = ""
    @State private var carrier = ""
    @State private var trackingNo = ""
    @State private var remarks = ""
    @State private var result = ""

    var body: some View {
        Form {
            Section("货品") {
                TextField("批次号", text: $batchNo)
                    .textInputAutocapitalization(.never)
                TextField("数量", text: $quantity)
                    .keyboardType(.decimalPad)
                TextField("单位", text: $unit)
            }
            Section("物流") {
                TextField("经销商", text: $distributorName)
                TextField("承运方", text: $carrier)
                TextField("运单号", text: $trackingNo)
                TextField("备注", text: $remarks)
            }
            if !result.isEmpty {
                Text(result)
            }
            Button("创建发运单") {
                Task { await submit() }
            }
        }
        .liquidFormStyle()
        .navigationTitle("新建发运单")
        .toolbar { Button("取消") { dismiss() } }
    }

    private func submit() async {
        let item: [String: JSONValue] = [
            "batchNo": .string(batchNo),
            "quantity": .number(Double(quantity) ?? 0),
            "unit": .string(unit)
        ]
        let body: [String: JSONValue] = [
            "items": .array([.object(item)]),
            "distributorName": .string(distributorName),
            "carrier": .string(carrier),
            "trackingNo": .string(trackingNo),
            "remarks": .string(remarks)
        ]
        do {
            let response = try await appState.api.postObject(path: "/api/v1/shipments", body: body)
            result = "创建成功：\(response.value("shipmentNo"))"
            onSaved()
            dismiss()
        } catch {
            result = error.localizedDescription
        }
    }
}

struct ShipmentDetailView: View {
    @EnvironmentObject private var appState: AppState
    let shipment: AnyJSONObject
    @State private var events: [AnyJSONObject] = []
    @State private var status = "运输中"
    @State private var location = ""
    @State private var eventTime = defaultFormTime()
    @State private var remark = ""
    @State private var message = ""

    private var shipmentNo: String {
        shipment.value("shipmentNo").nonEmpty ?? shipment.id
    }

    var body: some View {
        List {
            Section("发运单") {
                GenericObjectRows(object: shipment)
            }
            Section("运输事件") {
                if events.isEmpty {
                    Text("暂无运输事件").foregroundStyle(.secondary)
                }
                ForEach(events) { event in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(event.value("status").nonEmpty ?? "物流事件")
                            .font(.headline)
                        Text(event.value("location").nonEmpty ?? "-")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(formattedFieldText(key: "createdAt", value: event.value("createdAt").nonEmpty ?? event.value("eventTime")))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            Section("新增事件") {
                TextField("状态", text: $status)
                TextField("位置", text: $location)
                TextField("事件时间", text: $eventTime)
                TextField("备注", text: $remark, axis: .vertical)
                Button("追加物流事件") { Task { await addEvent() } }
                    .disabled(location.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            if !message.isEmpty { Text(message).foregroundStyle(message.contains("成功") ? Color.ytAccentDeep : .red) }
        }
        .liquidListStyle()
        .navigationTitle(shipmentNo)
        .task { await loadEvents() }
    }

    private func loadEvents() async {
        do {
            events = try await appState.api.shipmentEvents(shipmentNo: shipmentNo)
        } catch {
            message = error.localizedDescription
        }
    }

    private func addEvent() async {
        do {
            _ = try await appState.api.addShipmentEvent(shipmentNo: shipmentNo, body: compactPayload([
                "status": .string(status),
                "location": .string(location),
                "eventTime": .string(eventTime),
                "remark": .string(remark)
            ]))
            message = "事件追加成功"
            location = ""
            remark = ""
            await loadEvents()
        } catch {
            message = error.localizedDescription
        }
    }
}

struct LineWorkView: View {
    @EnvironmentObject private var appState: AppState
    @State private var batchNo = ""
    @State private var processType = "加工"
    @State private var lineName = ""
    @State private var factory = ""
    @State private var details = ""
    @State private var operatorName = ""
    @State private var outputQuantity = ""
    @State private var showsScanner = false
    @State private var result = ""

    var body: some View {
        RoleGateView(feature: .processing) {
            Form {
                Section("产线作业") {
                    HStack {
                        TextField("批次号", text: $batchNo)
                            .textInputAutocapitalization(.never)
                        Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                    }
                    TextField("工序", text: $processType)
                    TextField("产线", text: $lineName)
                    TextField("工厂", text: $factory)
                    TextField("操作人", text: $operatorName)
                    TextField("产出数量", text: $outputQuantity)
                        .keyboardType(.decimalPad)
                    TextField("详情", text: $details, axis: .vertical)
                }
                if !result.isEmpty { Text(result) }
                Button("记录产线作业") {
                    Task { await submit() }
                }
            }
            .liquidFormStyle()
            .navigationTitle("产线作业")
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    batchNo = extractBatchNo(from: value)
                    showsScanner = false
                }
            }
        }
    }

    private func submit() async {
        var payload: [String: JSONValue] = [
            "batchNo": .string(batchNo),
            "processType": .string(processType),
            "lineName": .string(lineName),
            "factory": .string(factory),
            "details": .string(details),
            "operator": .string(operatorName)
        ]
        if let value = Double(outputQuantity) {
            payload["outputQuantity"] = .number(value)
        }
        do {
            _ = try await appState.api.postObject(path: "/api/v1/processing", body: compactPayload(payload))
            result = "记录成功"
        } catch {
            result = error.localizedDescription
        }
    }
}

struct QrcodeToolsView: View {
    var initialBatchNo = "MOCK-2024001"
    @EnvironmentObject private var appState: AppState
    @State private var batchNo = ""
    @State private var image: UIImage?
    @State private var message = ""
    @State private var traceCode = ""
    @State private var showsScanner = false

    var body: some View {
        RoleGateView(feature: .qrcode) {
            Form {
                Section("批次") {
                    HStack {
                        TextField("批次号", text: $batchNo)
                            .textInputAutocapitalization(.never)
                        Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                    }
                    Button("生成二维码") {
                        Task { await load() }
                    }
                }
                if let image {
                    Section("二维码") {
                        Image(uiImage: image)
                            .resizable()
                            .interpolation(.none)
                            .scaledToFit()
                            .frame(maxHeight: 260)
                        HStack {
                            Button("复制批次号") {
                                UIPasteboard.general.string = batchNo
                                message = "已复制批次号"
                            }
                            Button("保存到相册") {
                                UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                                message = "已提交保存到相册"
                            }
                        }
                        NavigationLink("查看溯源") {
                            TraceVisualizationView(batchNo: batchNo)
                        }
                    }
                }
                if !traceCode.isEmpty {
                    Section("追溯码") {
                        Text(traceCode).textSelection(.enabled)
                        Button("复制追溯码") {
                            UIPasteboard.general.string = traceCode
                            message = "已复制追溯码"
                        }
                    }
                }
                if !message.isEmpty { Text(message) }
            }
            .liquidFormStyle()
            .navigationTitle("二维码")
            .onAppear {
                if batchNo.isEmpty {
                    batchNo = initialBatchNo
                }
            }
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    batchNo = extractBatchNo(from: value)
                    showsScanner = false
                    Task { await load() }
                }
            }
        }
    }

    private func load() async {
        do {
            let response = try await appState.api.qrcode(batchNo: batchNo)
            let src = response.value("src")
            traceCode = response.value("traceCode").nonEmpty ?? response.value("traceUrl")
            let base64 = src.replacingOccurrences(of: "data:image/png;base64,", with: "")
            if let data = Data(base64Encoded: base64), let uiImage = UIImage(data: data) {
                image = uiImage
                message = response.value("batchNo")
            } else {
                message = "二维码数据解析失败"
            }
        } catch {
            message = error.localizedDescription
        }
    }
}

struct TerminalQrcodeView: View {
    @EnvironmentObject private var appState: AppState
    @State private var rootBatches: [Batch] = []
    @State private var selectedRoot = ""
    @State private var leafBatches: [AnyJSONObject] = []
    @State private var qrcodes: [AnyJSONObject] = []
    @State private var selectedQRCode: AnyJSONObject?
    @State private var isLoading = false
    @State private var message = ""
    @State private var showsScanner = false

    var body: some View {
        RoleGateView(feature: .terminalQRCode) {
            List {
                Section("根批次") {
                    Picker("选择根批次", selection: $selectedRoot) {
                        Text("全部根批次").tag("")
                        ForEach(rootBatches, id: \.stableID) { batch in
                            Text(batch.batchNo ?? batch.displayName).tag(batch.batchNo ?? "")
                        }
                    }
                    HStack {
                        TextField("或输入/扫描根批次号", text: $selectedRoot)
                            .textInputAutocapitalization(.never)
                        Button { showsScanner = true } label: { Image(systemName: "qrcode.viewfinder") }
                    }
                    Button("加载终端码") { Task { await loadLeaves() } }
                }

                Section("叶子批次") {
                    if leafBatches.isEmpty { Text("暂无叶子批次").foregroundStyle(.secondary) }
                    ForEach(leafBatches) { record in
                        RecordRow(record: record, keys: ["batchNo", "name", "status", "parentBatchNo"])
                    }
                }

                Section("终端二维码") {
                    if qrcodes.isEmpty { Text("暂无终端二维码").foregroundStyle(.secondary) }
                    ForEach(qrcodes) { code in
                        Button {
                            selectedQRCode = code
                        } label: {
                            RecordRow(record: code, keys: ["batchNo", "name", "traceUrl", "parentBatchNo"])
                        }
                    }
                }

                Section {
                    Button("导出 CSV 链接") { Task { await exportCSV() } }
                }

                if isLoading { ProgressView("正在同步") }
                if !message.isEmpty { Text(message).foregroundStyle(message.contains("成功") ? Color.ytAccentDeep : .red) }
            }
            .liquidListStyle()
            .navigationTitle("终端码")
            .toolbar { Button { Task { await loadAll() } } label: { Image(systemName: "arrow.clockwise") } }
            .sheet(item: $selectedQRCode) { code in
                NavigationStack {
                    TerminalQRCodePreview(code: code)
                }
            }
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    selectedRoot = extractBatchNo(from: value)
                    showsScanner = false
                    Task { await loadLeaves() }
                }
            }
            .task { await loadAll() }
        }
    }

    private func loadAll() async {
        isLoading = true
        message = ""
        defer { isLoading = false }
        do {
            rootBatches = try await appState.api.rootBatches()
            try await loadLeavesOnly()
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadLeaves() async {
        isLoading = true
        message = ""
        defer { isLoading = false }
        do {
            try await loadLeavesOnly()
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadLeavesOnly() async throws {
        let root = selectedRoot.nonEmpty
        leafBatches = try await appState.api.leafBatches(rootBatchNo: root)
        qrcodes = try await appState.api.leafQRCodes(rootBatchNo: root)
    }

    private func exportCSV() async {
        do {
            let response = try await appState.api.leafQRCodesExport(rootBatchNo: selectedRoot.nonEmpty)
            let link = response.value("url").nonEmpty ?? response.value("downloadUrl").nonEmpty ?? response.value("csv").nonEmpty ?? response.values.map { "\($0.key): \($0.value.displayText)" }.joined(separator: "\n")
            UIPasteboard.general.string = link
            message = "导出成功，链接已复制"
        } catch {
            message = error.localizedDescription
        }
    }
}

struct TerminalQRCodePreview: View {
    let code: AnyJSONObject

    var body: some View {
        List {
            Section("终端二维码") {
                GenericObjectRows(object: code)
            }
            if let src = code.value("src").nonEmpty ?? code.value("qrCode").nonEmpty,
               let image = imageFromDataURL(src) {
                Section {
                    Image(uiImage: image)
                        .resizable()
                        .interpolation(.none)
                        .scaledToFit()
                        .frame(maxHeight: 260)
                    Button("复制溯源链接") {
                        UIPasteboard.general.string = code.value("traceUrl")
                    }
                }
            }
        }
        .liquidListStyle()
        .navigationTitle(code.value("batchNo").nonEmpty ?? "终端码")
    }
}

struct SecurityToolsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var batchNo = "MOCK-2024001"
    @State private var invisibleCode = ""
    @State private var data = "ios-record"
    @State private var output = ""

    var body: some View {
        Form {
            Section("批次") {
                TextField("批次号", text: $batchNo)
                TextField("隐形防伪码", text: $invisibleCode)
                TextField("上链数据", text: $data)
            }
            Section {
                Button("生成双码") { Task { await call { try await appState.api.generateCode(batchNo: batchNo) } } }
                Button("验证防伪码") { Task { await call { try await appState.api.verifyCode(invisibleCode) } } }
                Button("记录上链") { Task { await call { try await appState.api.recordBlockchain(batchNo: batchNo, data: data) } } }
                Button("查询链上记录") { Task { await call { try await appState.api.object(path: "/api/v1/blockchain/\(batchNo)") } } }
                Button("验证链上记录") { Task { await call { try await appState.api.verifyBlockchain(batchNo: batchNo, data: data) } } }
            }
            if !output.isEmpty {
                Text(output)
                    .font(.footnote)
            }
        }
        .liquidFormStyle()
        .navigationTitle("防伪&区块链")
    }

    private func call(_ action: () async throws -> AnyJSONObject) async {
        do {
            output = try await action().values.map { "\($0.key): \($0.value.displayText)" }.sorted().joined(separator: "\n")
        } catch {
            output = error.localizedDescription
        }
    }
}

struct DashboardView: View {
    @EnvironmentObject private var appState: AppState
    @State private var stats: AnyJSONObject?
    @State private var forecast: AnyJSONObject?
    @State private var herbs: [String] = []
    @State private var selectedHerb = ""
    @State private var errorMessage = ""
    @State private var isLoading = false

    private var summaryItems: [DashboardMetricItem] {
        guard let stats else { return [] }
        return [
            DashboardMetricItem(title: "档案总批次", value: int(stats.value("totalBatches")), note: "全链路批次总量", systemImage: "shippingbox"),
            DashboardMetricItem(title: "质检记录", value: integrityValue("inspection"), note: "已录入检验结果", systemImage: "checkmark.seal"),
            DashboardMetricItem(title: "区块存证", value: integrityValue("blockchain"), note: "链上交易数量", systemImage: "lock.shield")
        ]
    }

    private var insightItems: [DashboardMetricItem] {
        guard let stats else { return [] }
        return [
            DashboardMetricItem(title: "药材种类", value: int(stats.value("totalHerbTypes")), note: "监管范围内品类", systemImage: "leaf"),
            DashboardMetricItem(title: "源头批次", value: int(stats.value("totalRootBatches")), note: "种植起点批次", systemImage: "scope"),
            DashboardMetricItem(title: "终端批次", value: int(stats.value("totalLeafBatches")), note: "末端可验真批次", systemImage: "qrcode.viewfinder"),
            DashboardMetricItem(title: "物流事件", value: int(stats.value("totalShipmentEvents")), note: "运输流转事件数", systemImage: "truck.box")
        ]
    }

    private var integrityItems: [DashboardProgressItem] {
        [
            DashboardProgressItem(title: "种植建档", value: integrityValue("planting")),
            DashboardProgressItem(title: "加工记录", value: integrityValue("processing")),
            DashboardProgressItem(title: "质检放行", value: integrityValue("inspection")),
            DashboardProgressItem(title: "链上存证", value: integrityValue("blockchain"))
        ]
    }

    private var originItems: [(String, Int)] {
        combinedDistribution("originDist") { normalizeProvince($0) }
    }

    private var processItems: [(String, Int)] {
        distribution("processTypeDist")
    }

    private var chainRecords: [DashboardChainRecord] {
        guard case .array(let records)? = stats?.values["recentBlockchainRecords"] else { return [] }
        return records.compactMap { value in
            guard case .object(let object) = value else { return nil }
            let batchNo = object["batchNo"]?.displayText.nonEmpty ?? "-"
            let txHash = object["txHash"]?.displayText.nonEmpty ?? "-"
            return DashboardChainRecord(batchNo: batchNo, txHash: txHash, time: object["time"]?.displayText)
        }
    }

    private var forecastSeries: DashboardForecastSeries? {
        guard let forecast else { return nil }
        let dates = stringArray(forecast.values["dates"])
        guard !dates.isEmpty else { return nil }
        return DashboardForecastSeries(
            dates: dates,
            actualValues: optionalDoubleArray(forecast.values["actualValues"]),
            predictedValues: optionalDoubleArray(forecast.values["predictedValues"]),
            lowerBounds: optionalDoubleArray(forecast.values["lowerConfidenceBounds"]),
            upperBounds: optionalDoubleArray(forecast.values["upperConfidenceBounds"]),
            accuracy: double(forecast.value("modelAccuracy")),
            rmse: double(forecast.value("modelRmse"))
        )
    }

    private var traceabilityRate: Double {
        min(100, max(0, double(stats?.value("overallTraceabilityRate") ?? "0")))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let stats {
                    DashboardHeroPanel(rate: traceabilityRate, stats: stats)

                    if !herbs.isEmpty {
                        Picker("预测药材", selection: $selectedHerb) {
                            Text("整体趋势").tag("")
                            ForEach(herbs, id: \.self) { Text($0).tag($0) }
                        }
                        .pickerStyle(.menu)
                        .onChange(of: selectedHerb) { _, _ in
                            Task { await loadForecast() }
                        }
                        .surfacePanel()
                    }

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(summaryItems) { item in
                            DashboardMetricCard(item: item, prominent: true)
                        }
                    }

                    SectionHeader("监管速览")
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(insightItems) { item in
                            DashboardMetricCard(item: item)
                        }
                    }

                    DashboardIntegrityCard(title: "环节覆盖", caption: "查看监管维度下的链路接入覆盖情况。", items: integrityItems)

                    DashboardDistributionCard(title: "产地分布", caption: "按省份统计链路内所有批次来源。", items: originItems, tone: .accent)

                    DashboardDistributionCard(title: "工艺分布", caption: "按工艺类型统计当前加工接入情况。", items: processItems, tone: .brown)

                    DashboardChainCard(records: chainRecords)
                } else if isLoading {
                    ProgressView("正在加载监管看板")
                        .frame(maxWidth: .infinity, minHeight: 180)
                }

                if let forecastSeries {
                    DashboardForecastCard(series: forecastSeries)
                }

                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
            }
            .padding()
        }
        .liquidScrollContent()
        .navigationTitle("监管看板")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }

        do {
            stats = try await appState.api.dashboardStats()
            herbs = await loadHerbs()
        } catch {
            errorMessage = error.localizedDescription
        }

        await loadForecast()
    }

    private func loadForecast() async {
        do {
            forecast = try await appState.api.dashboardForecast(herb: selectedHerb.nonEmpty)
        } catch {
            if errorMessage.isEmpty {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func loadHerbs() async -> [String] {
        do {
            let records = try await appState.api.dashboardHerbs()
            let names = records.compactMap { $0.value("name").nonEmpty ?? $0.value("herbName").nonEmpty ?? $0.value("category").nonEmpty }
            if !names.isEmpty { return Array(Set(names)).sorted() }
        } catch {
            do {
                let records = try await appState.api.publicHerbs()
                return Array(Set(records.compactMap { $0.value("name").nonEmpty ?? $0.value("herbName").nonEmpty })).sorted()
            } catch {
                return []
            }
        }
        return []
    }

    private func integrityValue(_ key: String) -> Int {
        guard case .object(let values)? = stats?.values["integrityStats"] else { return 0 }
        return int(values[key])
    }

    private func distribution(_ key: String) -> [(String, Int)] {
        guard case .array(let values)? = stats?.values[key] else { return [] }
        let rows: [(String, Int)] = values.compactMap { item -> (String, Int)? in
            guard case .object(let object) = item else { return nil }
            let name = object["name"]?.displayText.nonEmpty ?? "未分类"
            return (name, int(object["value"]))
        }
        return rows.sorted { $0.1 > $1.1 }.prefix(6).map { ($0.0, $0.1) }
    }

    private func combinedDistribution(_ key: String, normalize: (String) -> String) -> [(String, Int)] {
        let values = distribution(key)
        let counter = values.reduce(into: [String: Int]()) { result, item in
            let name = normalize(item.0).nonEmpty ?? "未标注"
            result[name, default: 0] += item.1
        }
        return counter.sorted { $0.value > $1.value }.prefix(6).map { ($0.key, $0.value) }
    }
}

struct DashboardMetricItem: Identifiable {
    let id = UUID()
    let title: String
    let value: Int
    let note: String
    let systemImage: String
}

struct DashboardProgressItem: Identifiable {
    let id = UUID()
    let title: String
    let value: Int
}

struct DashboardChainRecord: Identifiable {
    let id = UUID()
    let batchNo: String
    let txHash: String
    let time: String?
}

struct DashboardForecastSeries {
    let dates: [String]
    let actualValues: [Double?]
    let predictedValues: [Double?]
    let lowerBounds: [Double?]
    let upperBounds: [Double?]
    let accuracy: Double
    let rmse: Double
}

enum DashboardDistributionTone {
    case accent
    case brown

    var color: Color {
        switch self {
        case .accent: return .ytAccent
        case .brown: return .ytHerbBrown
        }
    }
}

struct DashboardHeroPanel: View {
    let rate: Double
    let stats: AnyJSONObject

    var body: some View {
        HStack(alignment: .center, spacing: 18) {
            TraceabilityGauge(rate: rate)

            VStack(alignment: .leading, spacing: 10) {
                Text("全链路监管")
                    .font(.title2.weight(.heavy))
                Text("批次、加工、质检、物流与链上存证集中监控")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack(spacing: 8) {
                    StatusBadge(text: "\(int(stats.value("totalTerminalQrcodes"))) 个终端码")
                    StatusBadge(text: "\(int(stats.value("totalShipments"))) 个运单")
                }
            }
            Spacer(minLength: 0)
        }
        .surfacePanel()
    }
}

struct TraceabilityGauge: View {
    let rate: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.ytAccentSoft, lineWidth: 13)
            Circle()
                .trim(from: 0, to: min(1, max(0, rate / 100)))
                .stroke(Color.ytAccent, style: StrokeStyle(lineWidth: 13, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 2) {
                Text("\(Int(rate.rounded()))%")
                    .font(.title3.weight(.heavy))
                    .monospacedDigit()
                Text("完整率")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: 98, height: 98)
    }
}

struct DashboardMetricCard: View {
    let item: DashboardMetricItem
    var prominent = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                IconPlate(systemImage: item.systemImage)
                Spacer()
            }
            Text("\(item.value)")
                .font(prominent ? .largeTitle.weight(.heavy) : .title.weight(.heavy))
                .monospacedDigit()
            Text(item.title)
                .font(.headline)
            Text(item.note)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, minHeight: prominent ? 152 : 136, alignment: .topLeading)
        .surfacePanel()
    }
}

struct DashboardIntegrityCard: View {
    let title: String
    let caption: String
    let items: [DashboardProgressItem]

    private var maxValue: Int { max(1, items.map(\.value).max() ?? 1) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            DashboardCardHeader(title: title, caption: caption, systemImage: "checklist.checked")
            ForEach(items) { item in
                DashboardProgressRow(title: item.title, value: item.value, maxValue: maxValue, color: .ytAccent)
            }
        }
        .surfacePanel()
    }
}

struct DashboardDistributionCard: View {
    let title: String
    let caption: String
    let items: [(String, Int)]
    let tone: DashboardDistributionTone

    private var maxValue: Int { max(1, items.map(\.1).max() ?? 1) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            DashboardCardHeader(title: title, caption: caption, systemImage: tone == .accent ? "map" : "gearshape.2")
            if items.isEmpty {
                Text(tone == .accent ? "暂无产地数据" : "暂无加工数据")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 80)
            } else {
                ForEach(items, id: \.0) { item in
                    DashboardProgressRow(title: item.0, value: item.1, maxValue: maxValue, color: tone.color)
                }
            }
        }
        .surfacePanel()
    }
}

struct DashboardProgressRow: View {
    let title: String
    let value: Int
    let maxValue: Int
    let color: Color

    var body: some View {
        HStack(spacing: 10) {
            Text(title)
                .font(.caption)
                .frame(width: 78, alignment: .leading)
                .lineLimit(1)
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5).opacity(0.75))
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: max(14, proxy.size.width * CGFloat(value) / CGFloat(max(1, maxValue))))
                }
            }
            .frame(height: 10)
            Text("\(value)")
                .font(.caption.bold())
                .monospacedDigit()
                .frame(width: 36, alignment: .trailing)
        }
    }
}

struct DashboardForecastCard: View {
    let series: DashboardForecastSeries

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                DashboardCardHeader(title: "趋势预测", caption: "实际值、预测值与置信区间。", systemImage: "chart.xyaxis.line")
                Spacer()
                VStack(alignment: .trailing, spacing: 3) {
                    Text("精度 \(Int((series.accuracy * 100).rounded()))%")
                        .font(.caption.bold())
                    Text("RMSE \(String(format: "%.1f", series.rmse))")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            ForecastLineChart(series: series)
                .frame(height: 210)

            HStack(spacing: 14) {
                DashboardLegend(color: .ytAccent, title: "实际")
                DashboardLegend(color: .ytHerbBrown, title: "预测")
                DashboardLegend(color: .ytAccentSoft, title: "区间")
            }
        }
        .surfacePanel()
    }
}

struct ForecastLineChart: View {
    let series: DashboardForecastSeries

    private var allValues: [Double] {
        (series.actualValues + series.predictedValues + series.lowerBounds + series.upperBounds).compactMap { $0 }
    }

    private var minValue: Double {
        max(0, (allValues.min() ?? 0) * 0.9)
    }

    private var maxValue: Double {
        max(1, (allValues.max() ?? 1) * 1.1)
    }

    var body: some View {
        VStack(spacing: 8) {
            GeometryReader { proxy in
                ZStack {
                    ChartGrid()
                    confidencePath(size: proxy.size)
                        .fill(Color.ytAccentSoft.opacity(0.85))
                    linePath(values: series.actualValues, size: proxy.size)
                        .stroke(Color.ytAccent, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
                    linePath(values: series.predictedValues, size: proxy.size)
                        .stroke(Color.ytHerbBrown, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round, dash: [6, 5]))
                }
            }
            HStack {
                Text(shortDate(series.dates.first))
                Spacer()
                Text(shortDate(series.dates[safe: series.dates.count / 2]))
                Spacer()
                Text(shortDate(series.dates.last))
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
    }

    private func point(index: Int, value: Double, size: CGSize) -> CGPoint {
        let count = max(1, series.dates.count - 1)
        let x = size.width * CGFloat(index) / CGFloat(count)
        let normalized = (value - minValue) / max(0.0001, maxValue - minValue)
        let y = size.height - (size.height * CGFloat(normalized))
        return CGPoint(x: x, y: y)
    }

    private func linePath(values: [Double?], size: CGSize) -> Path {
        Path { path in
            var started = false
            for (index, value) in values.enumerated() {
                guard let value else {
                    started = false
                    continue
                }
                let point = point(index: index, value: value, size: size)
                if started {
                    path.addLine(to: point)
                } else {
                    path.move(to: point)
                    started = true
                }
            }
        }
    }

    private func confidencePath(size: CGSize) -> Path {
        let upper = series.upperBounds.enumerated().compactMap { index, value -> CGPoint? in
            guard let value else { return nil }
            return point(index: index, value: value, size: size)
        }
        let lower = series.lowerBounds.enumerated().compactMap { index, value -> CGPoint? in
            guard let value else { return nil }
            return point(index: index, value: value, size: size)
        }
        return Path { path in
            guard let first = upper.first, upper.count > 1, lower.count > 1 else { return }
            path.move(to: first)
            upper.dropFirst().forEach { path.addLine(to: $0) }
            lower.reversed().forEach { path.addLine(to: $0) }
            path.closeSubpath()
        }
    }

    private func shortDate(_ value: String?) -> String {
        guard let value else { return "-" }
        let parts = value.split(separator: "-")
        return parts.count >= 2 ? "\(parts[1])月" : value
    }
}

struct ChartGrid: View {
    var body: some View {
        VStack {
            ForEach(0..<5, id: \.self) { _ in
                Rectangle()
                    .fill(Color(.separator).opacity(0.22))
                    .frame(height: 0.5)
                Spacer()
            }
        }
    }
}

struct DashboardLegend: View {
    let color: Color
    let title: String

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct DashboardChainCard: View {
    let records: [DashboardChainRecord]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            DashboardCardHeader(title: "近期链上记录", caption: "查看最近一次完成存证的批次交易。", systemImage: "link")
            if records.isEmpty {
                Text("暂无链上存证记录")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 74)
            } else {
                ForEach(records.prefix(5)) { record in
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("批次 \(record.batchNo)")
                                .font(.subheadline.bold())
                            Text("哈希 \(shortHash(record.txHash))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        StatusBadge(text: "已上链")
                    }
                    .padding(.vertical, 5)
                }
            }
        }
        .surfacePanel()
    }
}

struct DashboardCardHeader: View {
    let title: String
    let caption: String
    let systemImage: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            IconPlate(systemImage: systemImage)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.headline)
                Text(caption)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private func int(_ value: String) -> Int {
    Int(Double(value) ?? 0)
}

private func int(_ value: JSONValue?) -> Int {
    Int(double(value))
}

private func double(_ value: String) -> Double {
    Double(value) ?? 0
}

private func double(_ value: JSONValue?) -> Double {
    guard let value else { return 0 }
    switch value {
    case .number(let number): return number
    case .string(let text): return Double(text) ?? 0
    case .bool(let bool): return bool ? 1 : 0
    case .object, .array, .null: return 0
    }
}

private func stringArray(_ value: JSONValue?) -> [String] {
    guard case .array(let values)? = value else { return [] }
    return values.map { $0.displayText }
}

private func optionalDoubleArray(_ value: JSONValue?) -> [Double?] {
    guard case .array(let values)? = value else { return [] }
    return values.map {
        if case .null = $0 { return nil }
        return double($0)
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

struct LogsHubView: View {
    @EnvironmentObject private var appState: AppState
    @State private var entries: [AuditLogEntry] = []
    @State private var keyword = ""
    @State private var selectedType = "全部"
    @State private var isLoading = false
    @State private var errorMessage = ""

    private let types = ["全部", "批次", "种植", "加工", "质检", "发运", "物流事件"]
    private var filtered: [AuditLogEntry] {
        entries.filter { entry in
            let typeMatched = selectedType == "全部" || entry.type == selectedType
            let text = "\(entry.title) \(entry.subtitle) \(entry.detail)".lowercased()
            let key = keyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            return typeMatched && (key.isEmpty || text.contains(key))
        }
    }

    var body: some View {
        RoleGateView(feature: .logs) {
            List {
                Section {
                    TextField("搜索批次、人员、状态", text: $keyword)
                    Picker("类型", selection: $selectedType) {
                        ForEach(types, id: \.self) { Text($0) }
                    }
                }
                if !errorMessage.isEmpty { Text(errorMessage).foregroundStyle(.red) }
                ForEach(filtered) { entry in
                    NavigationLink {
                        AuditLogDetailView(entry: entry)
                    } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            HStack {
                                Text(entry.title).font(.headline)
                                Spacer()
                                StatusBadge(text: entry.type)
                            }
                            Text(entry.subtitle)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(entry.time)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .liquidListStyle()
            .overlay {
                if isLoading {
                    ProgressView("正在聚合日志")
                } else if filtered.isEmpty && errorMessage.isEmpty {
                    EmptyStateView(title: "暂无日志", message: "系统会聚合批次、种植、加工、质检、发运与物流事件。")
                }
            }
            .navigationTitle("日志汇总")
            .toolbar { Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") } }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            async let batches = appState.api.records(path: "/api/v1/batches?rootOnly=false")
            async let planting = appState.api.records(path: "/api/v1/planting")
            async let processing = appState.api.records(path: "/api/v1/processing")
            async let inspection = appState.api.records(path: "/api/v1/inspection")
            async let shipments = appState.api.records(path: "/api/v1/shipments")
            let loadedBatches = try await batches
            let loadedPlanting = try await planting
            let loadedProcessing = try await processing
            let loadedInspection = try await inspection
            let loadedShipments = try await shipments
            let base = makeAuditLogs(
                batches: loadedBatches,
                planting: loadedPlanting,
                processing: loadedProcessing,
                inspection: loadedInspection,
                shipments: loadedShipments
            )
            let shipmentNos = base.filter { $0.type == "发运" }.compactMap { $0.raw.value("shipmentNo").nonEmpty }
            var eventLogs: [AuditLogEntry] = []
            for no in shipmentNos {
                let events = try await appState.api.shipmentEvents(shipmentNo: no)
                eventLogs.append(contentsOf: events.map {
                    AuditLogEntry(type: "物流事件", title: $0.value("status").nonEmpty ?? no, subtitle: $0.value("location").nonEmpty ?? no, time: logTime($0), detail: $0.values.map { "\($0.key): \($0.value.displayText)" }.joined(separator: "\n"), raw: $0)
                })
            }
            entries = (base + eventLogs).sorted { $0.time > $1.time }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct AuditLogEntry: Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let subtitle: String
    let time: String
    let detail: String
    let raw: AnyJSONObject
}

struct AuditLogDetailView: View {
    let entry: AuditLogEntry

    var body: some View {
        List {
            Section(entry.type) {
                InfoRow(label: "标题", value: entry.title)
                InfoRow(label: "摘要", value: entry.subtitle)
                InfoRow(label: "时间", value: entry.time)
            }
            Section("原始记录") {
                GenericObjectRows(object: entry.raw)
            }
        }
        .liquidListStyle()
        .navigationTitle("日志详情")
    }
}

struct UserManagementView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        RoleGateView(feature: .users) {
            RecordsModuleView(spec: .users)
                .navigationTitle("用户管理")
        }
    }
}

private func makeAuditLogs(
    batches: [AnyJSONObject],
    planting: [AnyJSONObject],
    processing: [AnyJSONObject],
    inspection: [AnyJSONObject],
    shipments: [AnyJSONObject]
) -> [AuditLogEntry] {
    batches.map {
        AuditLogEntry(type: "批次", title: $0.value("batchNo").nonEmpty ?? $0.value("name").nonEmpty ?? "批次档案", subtitle: $0.value("name").nonEmpty ?? $0.value("origin"), time: logTime($0), detail: $0.value("description"), raw: $0)
    } + planting.map {
        AuditLogEntry(type: "种植", title: $0.value("batchNo").nonEmpty ?? "种植记录", subtitle: "\($0.value("operation").nonEmpty ?? "农事") · \($0.value("fieldName").nonEmpty ?? "地块")", time: logTime($0), detail: $0.value("details"), raw: $0)
    } + processing.map {
        AuditLogEntry(type: "加工", title: $0.value("batchNo").nonEmpty ?? "加工记录", subtitle: "\($0.value("processType").nonEmpty ?? "工序") · \($0.value("lineName").nonEmpty ?? "产线")", time: logTime($0), detail: $0.value("details"), raw: $0)
    } + inspection.map {
        AuditLogEntry(type: "质检", title: $0.value("batchNo").nonEmpty ?? "质检记录", subtitle: "\($0.value("inspectionType").nonEmpty ?? "质检") · \($0.value("result").nonEmpty ?? "结果")", time: logTime($0), detail: $0.value("reportUrl"), raw: $0)
    } + shipments.map {
        AuditLogEntry(type: "发运", title: $0.value("shipmentNo").nonEmpty ?? "发运单", subtitle: "\($0.value("carrier").nonEmpty ?? "承运方") · \($0.value("trackingNo").nonEmpty ?? "运单")", time: logTime($0), detail: $0.value("remarks"), raw: $0)
    }
}

struct RecordRow: View {
    let record: AnyJSONObject
    let keys: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(keys.compactMap { record.value($0).nonEmpty }.first ?? record.id)
                .font(.headline)
            ForEach(keys.dropFirst().filter { record.value($0).nonEmpty != nil }, id: \.self) { key in
                Text("\(localizedFieldLabel(key))：\(formattedFieldText(key: key, value: record.value(key)))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }
}

struct GenericObjectRows: View {
    let object: AnyJSONObject

    var body: some View {
        ForEach(object.values.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
            InfoRow(label: localizedFieldLabel(key), value: localizedFieldValue(key: key, value: value))
        }
    }
}

private func filter(_ records: [AnyJSONObject], query: String, keys: [String]) -> [AnyJSONObject] {
    let key = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !key.isEmpty else { return records }
    return records.filter { record in
        keys.contains { record.value($0).lowercased().contains(key) }
    }
}

private func compactPayload(_ payload: [String: JSONValue]) -> [String: JSONValue] {
    payload.filter { _, value in
        if case .string(let text) = value {
            return !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        if case .null = value { return false }
        return true
    }
}

private func defaultFormTime() -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter.string(from: Date())
}

private func extractBatchNo(from value: String) -> String {
    if let url = URL(string: value),
       let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
       let item = components.queryItems?.first(where: { ["batchNo", "batch", "code"].contains($0.name) }),
       let batchNo = item.value {
        return batchNo
    }
    return value.trimmingCharacters(in: .whitespacesAndNewlines)
}

private func imageFromDataURL(_ value: String) -> UIImage? {
    let base64 = value
        .replacingOccurrences(of: "data:image/png;base64,", with: "")
        .replacingOccurrences(of: "data:image/jpeg;base64,", with: "")
    guard let data = Data(base64Encoded: base64) else { return nil }
    return UIImage(data: data)
}

private func logTime(_ record: AnyJSONObject) -> String {
    for key in ["operationTime", "eventTime", "createdAt", "updatedAt"] {
        if let value = record.value(key).nonEmpty {
            return formattedFieldText(key: key, value: value)
        }
    }
    return "-"
}

struct SectionHeader: View {
    let title: String
    init(_ title: String) { self.title = title }
    var body: some View {
        HStack(spacing: 8) {
            Rectangle()
                .fill(Color.ytHerbBrown)
                .frame(width: 3, height: 18)
                .clipShape(RoundedRectangle(cornerRadius: 2))
            Text(title)
                .font(.headline)
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct WorkbenchItem: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let subtitle: String
    let systemImage: String
    let destination: WorkbenchDestination

    init(_ title: String, _ subtitle: String, _ systemImage: String, _ destination: WorkbenchDestination) {
        self.title = title
        self.subtitle = subtitle
        self.systemImage = systemImage
        self.destination = destination
    }
}

enum WorkbenchDestination: Hashable {
    case records(ModuleSpec)
    case planting
    case processing
    case inspection
    case lineWork
    case logistics
    case qrcode
    case terminalQrcode
    case security
    case dashboard
    case logs
    case users
}

extension ModuleSpec {
    static let batches = ModuleSpec(
        id: "batches",
        title: "批次档案",
        subtitle: "对应 batch / batch-form / add-external",
        systemImage: "shippingbox",
        listPath: "/api/v1/batches?rootOnly=false",
        createPath: "/api/v1/batches",
        updatePathPrefix: "/api/v1/batches",
        deletePathPrefix: "/api/v1/batches",
        fields: [
            FormField("batchNo", "批次号"),
            FormField("minCode", "最小码"),
            FormField("name", "名称", required: true),
            FormField("category", "品类"),
            FormField("origin", "产地"),
            FormField("status", "状态"),
            FormField("quantity", "数量"),
            FormField("unit", "单位"),
            FormField("description", "描述"),
            FormField("usageAdvice", "用法建议"),
            FormField("contraindications", "禁忌"),
            FormField("commonPairings", "常见搭配")
        ],
        primaryKeys: ["name", "batchNo", "origin", "status"]
    )

    static let planting = ModuleSpec(
        id: "planting",
        title: "种植记录",
        subtitle: "对应 planting / planting-form / planting-dashboard",
        systemImage: "leaf",
        listPath: "/api/v1/planting",
        createPath: "/api/v1/planting",
        updatePathPrefix: "/api/v1/planting",
        deletePathPrefix: "/api/v1/planting",
        fields: [
            FormField("batchNo", "批次号", required: true),
            FormField("fieldName", "地块"),
            FormField("operation", "操作"),
            FormField("operationTime", "操作时间", placeholder: "2026-05-07T10:00:00", required: true),
            FormField("details", "详情"),
            FormField("operator", "操作人"),
            FormField("latitude", "纬度"),
            FormField("longitude", "经度"),
            FormField("imageUrl", "图片 URL"),
            FormField("audioUrl", "音频 URL")
        ],
        primaryKeys: ["batchNo", "operation", "fieldName", "operator"]
    )

    static let processing = ModuleSpec(
        id: "processing",
        title: "加工记录",
        subtitle: "对应 processing / processing-form",
        systemImage: "gearshape.2",
        listPath: "/api/v1/processing",
        createPath: "/api/v1/processing",
        updatePathPrefix: "/api/v1/processing",
        deletePathPrefix: "/api/v1/processing",
        fields: [
            FormField("batchNo", "批次号", required: true),
            FormField("parentBatchNo", "父批次"),
            FormField("processType", "工序"),
            FormField("lineName", "产线"),
            FormField("factory", "工厂"),
            FormField("details", "详情"),
            FormField("operator", "操作人"),
            FormField("extractedQuantity", "投入数量"),
            FormField("outputQuantity", "产出数量"),
            FormField("imageUrl", "图片 URL")
        ],
        primaryKeys: ["batchNo", "processType", "lineName", "factory"]
    )

    static let inspection = ModuleSpec(
        id: "inspection",
        title: "质检记录",
        subtitle: "对应 inspection / inspection-form",
        systemImage: "checkmark.seal",
        listPath: "/api/v1/inspection",
        createPath: "/api/v1/inspection",
        updatePathPrefix: "/api/v1/inspection",
        deletePathPrefix: "/api/v1/inspection",
        fields: [
            FormField("batchNo", "批次号", required: true),
            FormField("inspectionType", "质检类型"),
            FormField("result", "结果", required: true),
            FormField("reportUrl", "报告 URL"),
            FormField("inspector", "质检员")
        ],
        primaryKeys: ["batchNo", "result", "inspectionType", "inspector"]
    )

    static let shipments = ModuleSpec(
        id: "shipments",
        title: "发运单",
        subtitle: "对应 logistics / shipment-form",
        systemImage: "truck.box",
        listPath: "/api/v1/shipments",
        createPath: nil,
        updatePathPrefix: nil,
        deletePathPrefix: nil,
        fields: [],
        primaryKeys: ["shipmentNo", "distributorName", "carrier", "trackingNo"]
    )

    static let users = ModuleSpec(
        id: "users",
        title: "用户管理",
        subtitle: "对应 user-mgmt",
        systemImage: "person.2",
        listPath: "/api/v1/users",
        createPath: "/api/v1/users",
        updatePathPrefix: "/api/v1/users",
        deletePathPrefix: "/api/v1/users",
        fields: [
            FormField("username", "用户名", required: true),
            FormField("password", "密码"),
            FormField("role", "角色", placeholder: "ADMIN/FARMER/QUALITY/LOGISTICS"),
            FormField("nickname", "昵称"),
            FormField("name", "姓名"),
            FormField("phone", "电话")
        ],
        primaryKeys: ["username", "role", "name", "phone"]
    )

    static let leafBatches = ModuleSpec(
        id: "leafBatches",
        title: "叶子批次",
        subtitle: "终端二维码批次来源",
        systemImage: "leaf.circle",
        listPath: "/api/v1/batches/leaf-batches?limit=500",
        createPath: nil,
        updatePathPrefix: nil,
        deletePathPrefix: nil,
        fields: [],
        primaryKeys: ["batchNo", "name", "status", "parentBatchNo"]
    )

    static let leafQrcodes = ModuleSpec(
        id: "leafQrcodes",
        title: "终端二维码",
        subtitle: "终端码生成记录",
        systemImage: "qrcode.viewfinder",
        listPath: "/api/v1/batches/leaf-qrcodes?size=260&limit=500",
        createPath: nil,
        updatePathPrefix: nil,
        deletePathPrefix: nil,
        fields: [],
        primaryKeys: ["batchNo", "name", "traceUrl", "parentBatchNo"]
    )
}
