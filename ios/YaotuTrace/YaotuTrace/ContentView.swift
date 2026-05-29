import SwiftUI

extension Color {
    static let ytAccent = Color(red: 0.141, green: 0.361, blue: 0.294)
    static let ytAccentDeep = Color(red: 0.055, green: 0.235, blue: 0.200)
    static let ytAccentSoft = Color(red: 0.882, green: 0.937, blue: 0.910)
    static let ytPorcelain = Color(red: 0.957, green: 0.980, blue: 0.965)
    static let ytHerbBrown = Color(red: 0.541, green: 0.416, blue: 0.243)
    static let ytInk = Color(red: 0.090, green: 0.102, blue: 0.094)
    static let ytBatchBlue = Color(red: 0.184, green: 0.365, blue: 0.486)
    static let ytBatchBlueSoft = Color(red: 0.894, green: 0.933, blue: 0.957)
    static let ytBronzeSoft = Color(red: 0.945, green: 0.918, blue: 0.859)
    static let ytLogisticsClay = Color(red: 0.604, green: 0.373, blue: 0.275)
    static let ytLogisticsClaySoft = Color(red: 0.949, green: 0.906, blue: 0.882)
    static let ytInspectionIndigo = Color(red: 0.388, green: 0.341, blue: 0.639)
    static let ytInspectionIndigoSoft = Color(red: 0.918, green: 0.910, blue: 0.961)
    static let ytVerifySlate = Color(red: 0.247, green: 0.325, blue: 0.384)
    static let ytVerifySlateSoft = Color(red: 0.910, green: 0.933, blue: 0.945)
}

struct ContentView: View {
    var body: some View {
        ZStack {
            AppBackground()
                .ignoresSafeArea()

            VStack(spacing: 0) {
                UserPortalTabView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .tint(Color.ytAccent)
        .buttonBorderShape(.roundedRectangle(radius: 14))
    }
}

struct AppBackground: View {
    var body: some View {
        Color.white
    }
}

struct SurfacePanel: ViewModifier {
    var padding: CGFloat = 16
    var radius: CGFloat = 18

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .glassEffect(
                .regular.tint(Color.white.opacity(0.14)).interactive(),
                in: RoundedRectangle(cornerRadius: radius, style: .continuous)
            )
            .overlay {
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Color.white.opacity(0.42), lineWidth: 0.7)
            }
            .shadow(color: Color.ytAccentDeep.opacity(0.045), radius: 10, x: 0, y: 5)
            .shadow(color: Color.white.opacity(0.45), radius: 0.7, x: 0, y: -0.3)
    }
}

extension View {
    func surfacePanel(padding: CGFloat = 16) -> some View {
        modifier(SurfacePanel(padding: padding))
    }

    func liquidPageBackground() -> some View {
        background(AppBackground().ignoresSafeArea())
    }

    func liquidScrollContent() -> some View {
        scrollContentBackground(.hidden)
            .liquidPageBackground()
    }

    func liquidListStyle() -> some View {
        scrollContentBackground(.hidden)
            .listStyle(.insetGrouped)
            .liquidPageBackground()
    }

    func liquidFormStyle() -> some View {
        scrollContentBackground(.hidden)
            .formStyle(.grouped)
            .liquidPageBackground()
    }

    func liquidSearchField() -> some View {
        padding(12)
            .background(Color(.systemBackground).opacity(0.72))
            .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.white.opacity(0.38), lineWidth: 0.7)
            }
            .shadow(color: Color.ytAccentDeep.opacity(0.035), radius: 7, x: 0, y: 3)
    }
}

struct StatusBadge: View {
    let text: String
    var isActive = true

    var body: some View {
        Text(text)
            .font(.caption2.bold())
            .foregroundStyle(isActive ? Color.ytAccentDeep : .secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .glassEffect(
                .regular.tint(isActive ? Color.ytAccentSoft.opacity(0.74) : Color(.systemGray5).opacity(0.62)),
                in: Capsule()
            )
    }
}

struct IconPlate: View {
    let systemImage: String

    var body: some View {
        Image(systemName: systemImage)
            .font(.headline.weight(.semibold))
            .foregroundStyle(palette.foreground)
            .frame(width: 38, height: 38)
            .glassEffect(
                .regular.tint(palette.background.opacity(0.82)).interactive(),
                in: RoundedRectangle(cornerRadius: 13, style: .continuous)
            )
            .shadow(color: palette.foreground.opacity(0.07), radius: 5, x: 0, y: 2)
    }

    private var palette: (foreground: Color, background: Color) {
        if systemImage.contains("shippingbox") || systemImage.contains("tray") {
            return (.ytBatchBlue, .ytBatchBlueSoft)
        }
        if systemImage.contains("gearshape") || systemImage.contains("point.3") || systemImage.contains("rectangle.on.rectangle") {
            return (.ytHerbBrown, .ytBronzeSoft)
        }
        if systemImage.contains("checkmark") || systemImage.contains("doc.text") || systemImage.contains("chart") {
            return (.ytInspectionIndigo, .ytInspectionIndigoSoft)
        }
        if systemImage.contains("truck") || systemImage.contains("map") || systemImage.contains("location") {
            return (.ytLogisticsClay, .ytLogisticsClaySoft)
        }
        if systemImage.contains("lock") || systemImage.contains("qrcode") || systemImage.contains("viewfinder") || systemImage.contains("link") || systemImage.contains("shield") {
            return (.ytVerifySlate, .ytVerifySlateSoft)
        }
        return (.ytAccentDeep, .ytAccentSoft)
    }
}

struct BrandMarkView: View {
    var size: CGFloat = 40

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.ytAccentSoft)
            Image(systemName: "leaf.fill")
                .font(.system(size: size * 0.46, weight: .bold))
                .foregroundStyle(Color.ytAccentDeep)
                .rotationEffect(.degrees(-18))
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: size * 0.34, weight: .bold))
                .foregroundStyle(Color.ytHerbBrown.opacity(0.82))
                .offset(x: size * 0.08, y: size * 0.1)
        }
        .frame(width: size, height: size)
        .overlay {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.ytAccent.opacity(0.18), lineWidth: 1)
        }
    }
}

struct UserPortalTabView: View {
    var body: some View {
        TabView {
            UserHomeView()
                .tabItem {
                    Label("首页", systemImage: "square.grid.2x2")
                }

            BatchWorkbenchView()
            .tabItem {
                Label("批次", systemImage: "shippingbox")
            }

            UserProductionView()
                .tabItem {
                    Label("生产", systemImage: "leaf")
                }

            UserTrustToolsView()
                .tabItem {
                    Label("核验", systemImage: "lock.shield")
                }

            AccountView(title: "账号")
                .tabItem {
                    Label("账号", systemImage: "person.crop.circle")
                }
        }
    }
}

struct TraceLookupView: View {
    @EnvironmentObject private var appState: AppState
    @State private var batchNo = ""
    @State private var trace: TraceResponse?
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showsScanner = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 10) {
                        TextField("输入批次号或扫描二维码", text: $batchNo)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .padding(12)
                            .background(.thinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        HStack {
                            Button {
                                Task { await loadTrace() }
                            } label: {
                                Label("查询", systemImage: "magnifyingglass")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.glassProminent)
                            .disabled(batchNo.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading)

                            Button {
                                showsScanner = true
                            } label: {
                                Image(systemName: "qrcode.viewfinder")
                                    .frame(width: 44)
                            }
                            .buttonStyle(.glass(.regular))
                        }
                    }

                    if isLoading {
                        ProgressView("正在查询")
                    }

                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }

                    if let trace {
                        TraceSummaryView(trace: trace)
                    } else {
                        EmptyStateView(title: "扫码或输入批次号", message: "查询批次、种植、加工、质检、物流与链上存证。")
                    }
                }
                .padding()
            }
            .liquidScrollContent()
            .navigationTitle("扫码寻迹")
            .sheet(isPresented: $showsScanner) {
                QRScannerView { value in
                    batchNo = extractBatchNo(from: value)
                    showsScanner = false
                    Task { await loadTrace() }
                }
            }
        }
    }

    private func loadTrace() async {
        let query = batchNo.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return }
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }

        do {
            trace = try await appState.api.trace(batchNo: query)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func extractBatchNo(from value: String) -> String {
        if let url = URL(string: value),
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let item = components.queryItems?.first(where: { $0.name == "batchNo" }),
           let batchNo = item.value {
            return batchNo
        }
        return value
    }
}

struct TraceSummaryView: View {
    let trace: TraceResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let batch = trace.batch {
                InfoCard(title: batch.displayName, subtitle: batch.batchNo ?? "无批次号") {
                    InfoRow(label: "产地", value: batch.origin)
                    InfoRow(label: "品类", value: batch.category)
                    InfoRow(label: "状态", value: batch.status)
                    InfoRow(label: "GS1", value: batch.gs1Code)
                    InfoRow(label: "用法建议", value: batch.usageAdvice)
                    InfoRow(label: "禁忌", value: batch.contraindications)
                }
            }

            MetricGrid(items: [
                ("谱系批次", trace.lineageBatches?.count ?? 0),
                ("种植记录", trace.plantingRecords?.count ?? 0),
                ("加工记录", trace.processingRecords?.count ?? 0),
                ("质检记录", trace.inspectionRecords?.count ?? 0),
                ("物流记录", trace.logisticsRecords?.count ?? 0),
                ("发运记录", trace.shipmentsWithEvents?.count ?? 0)
            ])

            if let blockchain = trace.blockchainRecord, !blockchain.values.isEmpty {
                InfoCard(title: "区块链存证", subtitle: "链上核验信息") {
                    ForEach(blockchain.values.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                        InfoRow(label: localizedFieldLabel(key), value: localizedFieldValue(key: key, value: value))
                    }
                }
            }
        }
    }
}

struct BatchListView: View {
    @EnvironmentObject private var appState: AppState
    @State private var batches: [Batch] = []
    @State private var isLoading = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            List {
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
                ForEach(batches, id: \.stableID) { batch in
                    NavigationLink {
                        BatchDetailView(batch: batch)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(batch.displayName)
                                .font(.headline)
                            Text(batch.batchNo ?? "无批次号")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            HStack {
                                if let origin = batch.origin {
                                    Label(origin, systemImage: "mappin.and.ellipse")
                                }
                                if let status = batch.status {
                                    Label(status, systemImage: "checkmark.seal")
                                }
                            }
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .liquidListStyle()
            .overlay {
                if isLoading {
                    ProgressView("正在加载批次")
                } else if batches.isEmpty && errorMessage.isEmpty {
                    EmptyStateView(title: "暂无批次", message: "登录后可查看后端批次数据。")
                }
            }
            .navigationTitle("批次")
            .toolbar {
                Button {
                    Task { await loadBatches() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
            .task {
                if batches.isEmpty {
                    await loadBatches()
                }
            }
        }
    }

    private func loadBatches() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }

        do {
            batches = try await appState.api.batches()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct BatchDetailView: View {
    @EnvironmentObject private var appState: AppState
    let batch: Batch
    @State private var message = ""
    @State private var qrObject: AnyJSONObject?

    var body: some View {
        List {
            Section("基础信息") {
                InfoRow(label: "批次号", value: batch.batchNo)
                InfoRow(label: "最小码", value: batch.minCode)
                InfoRow(label: "名称", value: batch.name)
                InfoRow(label: "品类", value: batch.category)
                InfoRow(label: "产地", value: batch.origin)
                InfoRow(label: "状态", value: batch.status)
            }
            Section("GS1") {
                InfoRow(label: "批号", value: batch.gs1LotNo)
                InfoRow(label: "编码", value: batch.gs1Code)
                InfoRow(label: "锁定", value: (batch.gs1Locked ?? false) ? "是" : "否")
            }
            Section("说明") {
                InfoRow(label: "描述", value: batch.description)
                InfoRow(label: "用法建议", value: batch.usageAdvice)
                InfoRow(label: "常见搭配", value: batch.commonPairings)
                InfoRow(label: "禁忌", value: batch.contraindications)
            }
            Section("操作") {
                Button("锁定 GS1") {
                    Task { await lockGS1() }
                }
                .disabled((batch.batchNo ?? "").isEmpty)
                Button("获取公开二维码") {
                    Task { await loadPublicQR() }
                }
                .disabled((batch.batchNo ?? "").isEmpty)
                if let qrObject {
                    GenericObjectRows(object: qrObject)
                }
                if !message.isEmpty {
                    Text(message)
                        .foregroundStyle(message.contains("成功") ? Color.ytAccentDeep : .red)
                }
            }
        }
        .liquidListStyle()
        .navigationTitle(batch.displayName)
    }

    private func lockGS1() async {
        guard let batchNo = batch.batchNo?.nonEmpty else { return }
        do {
            _ = try await appState.api.lockGS1(batchNo: batchNo)
            message = "GS1 锁定成功"
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadPublicQR() async {
        guard let batchNo = batch.batchNo?.nonEmpty else { return }
        do {
            qrObject = try await appState.api.publicQRCode(batchNo: batchNo)
            message = "公开二维码已同步"
        } catch {
            message = error.localizedDescription
        }
    }
}

struct AIConsultView: View {
    @EnvironmentObject private var appState: AppState
    @State private var input = ""
    @State private var messages: [ChatMessage] = [
        ChatMessage(role: "assistant", content: "你好，我可以结合中药材溯源信息回答使用建议。")
    ]
    @State private var isSending = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .liquidScrollContent()
                    .onChange(of: messages) { _, newValue in
                        if let last = newValue.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }

                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                }

                HStack(spacing: 10) {
                    TextField("输入问题", text: $input, axis: .vertical)
                        .lineLimit(1...4)
                        .padding(10)
                        .background(.thinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    Button {
                        Task { await send() }
                    } label: {
                        if isSending {
                            ProgressView()
                        } else {
                            Image(systemName: "paperplane.fill")
                        }
                    }
                    .buttonStyle(.glassProminent)
                    .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
                }
                .padding()
                .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            }
            .liquidPageBackground()
            .navigationTitle("智问")
        }
    }

    private func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        input = ""
        errorMessage = ""
        let userMessage = ChatMessage(role: "user", content: text)
        messages.append(userMessage)
        isSending = true
        defer { isSending = false }

        do {
            let response = try await appState.api.chat(messages: messages.filter { $0.role != "assistant" || !$0.content.hasPrefix("你好") }, traceContext: nil)
            if response.success == true, let content = response.content {
                messages.append(ChatMessage(role: "assistant", content: content))
            } else {
                errorMessage = response.message ?? response.error ?? "AI 服务暂不可用"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct AccountView: View {
    var title = "我的"
    @EnvironmentObject private var appState: AppState
    @State private var username = ""
    @State private var password = ""
    @State private var isLoggingIn = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    accountHero
                    connectionCard
                    if appState.isAuthenticated {
                        signedInCard
                    } else {
                        loginCard
                    }
                }
                .padding()
            }
            .liquidScrollContent()
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var accountHero: some View {
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(Color.ytAccentSoft.opacity(0.7))
                Image(systemName: appState.isAuthenticated ? "person.crop.circle.fill" : "person.crop.circle")
                    .font(.system(size: 42, weight: .semibold))
                    .foregroundStyle(Color.ytAccentDeep)
            }
            .frame(width: 70, height: 70)
            .glassEffect(.regular.tint(Color.ytAccentSoft.opacity(0.55)).interactive(), in: RoundedRectangle(cornerRadius: 22, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                Text(appState.isAuthenticated ? (appState.username.nonEmpty ?? "已登录账号") : "未登录")
                    .font(.title2.weight(.heavy))
                    .lineLimit(1)
                Text(appState.isAuthenticated ? roleName(appState.role) : "登录后同步生产、核验与监管数据")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                HStack(spacing: 8) {
                    StatusBadge(text: appState.isAuthenticated ? "已认证" : "待登录", isActive: appState.isAuthenticated)
                    StatusBadge(text: appState.apiBaseURL.replacingOccurrences(of: "https://", with: ""), isActive: true)
                }
            }
            Spacer(minLength: 0)
        }
        .surfacePanel(padding: 18)
    }

    private var connectionCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            AccountSectionHeader(title: "服务连接", subtitle: "后端接口地址与连通状态", systemImage: "network")
            AccountInputRow(title: "API 地址", systemImage: "server.rack") {
                TextField("https://cpuzhbc.cn", text: $appState.apiBaseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
            }
            HStack(spacing: 10) {
                Button {
                    Task { await appState.checkHealth() }
                } label: {
                    Label("检查连接", systemImage: "bolt.horizontal.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)

                Button {
                    Task { await appState.refreshProfile() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .frame(width: 44)
                }
                .buttonStyle(.glass(.regular))
                .disabled(!appState.isAuthenticated)
            }
            if !appState.statusMessage.isEmpty {
                Label(appState.statusMessage, systemImage: appState.statusMessage.contains("正常") ? "checkmark.seal.fill" : "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(appState.statusMessage.contains("正常") ? Color.ytAccentDeep : .red)
            }
        }
        .surfacePanel()
    }

    private var signedInCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            AccountSectionHeader(title: "当前账号", subtitle: "身份信息与会话管理", systemImage: "person.text.rectangle")
            AccountInfoRow(title: "用户名", value: appState.username.nonEmpty ?? "-")
            AccountInfoRow(title: "角色", value: roleName(appState.role))
            Button(role: .destructive) {
                appState.logout()
            } label: {
                Label("退出登录", systemImage: "rectangle.portrait.and.arrow.right")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.glass(.regular))
        }
        .surfacePanel()
    }

    private var loginCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            AccountSectionHeader(title: "账号登录", subtitle: "使用系统账号进入用户端工作台", systemImage: "lock.open")
            AccountInputRow(title: "用户名", systemImage: "person") {
                TextField("请输入用户名", text: $username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            AccountInputRow(title: "密码", systemImage: "key") {
                SecureField("请输入密码", text: $password)
            }
            Button {
                Task { await login() }
            } label: {
                HStack {
                    if isLoggingIn {
                        ProgressView()
                    } else {
                        Label("登录", systemImage: "arrow.right.circle.fill")
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.glassProminent)
            .disabled(username.isEmpty || password.isEmpty || isLoggingIn)

            if !errorMessage.isEmpty {
                Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .surfacePanel()
    }

    private func login() async {
        isLoggingIn = true
        errorMessage = ""
        defer { isLoggingIn = false }
        do {
            try await appState.login(username: username, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func roleName(_ role: String) -> String {
        switch role.uppercased() {
        case "ADMIN": return "系统管理员"
        case "FARMER": return "种植户"
        case "MANUFACTURER", "FACTORY": return "加工企业"
        case "LOGISTICS": return "物流配送商"
        case "QUALITY": return "质检员"
        case "REGULATOR": return "监管部门"
        case "USER": return "普通用户"
        default: return role.isEmpty ? "未设置" : role
        }
    }
}

struct AccountSectionHeader: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            IconPlate(systemImage: systemImage)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
    }
}

struct AccountInputRow<Field: View>: View {
    let title: String
    let systemImage: String
    @ViewBuilder let field: Field

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.ytAccentDeep)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption2.bold())
                    .foregroundStyle(.secondary)
                field
                    .font(.body)
            }
        }
        .padding(12)
        .background(Color(.systemBackground).opacity(0.76))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.38), lineWidth: 0.6)
        }
    }
}

struct AccountInfoRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 8)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color(.separator).opacity(0.28))
                .frame(height: 0.5)
        }
    }
}

struct InfoCard<Content: View>: View {
    let title: String
    let subtitle: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 10) {
                IconPlate(systemImage: "doc.text.magnifyingglass")

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.headline)
                        .lineLimit(2)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }

            Rectangle()
                .fill(Color(.separator).opacity(0.32))
                .frame(height: 0.5)

            content
        }
        .surfacePanel()
    }
}

struct InfoRow: View {
    let label: String
    let value: String?

    var body: some View {
        if let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            HStack(alignment: .top) {
                Text(label)
                    .foregroundStyle(.secondary)
                    .frame(width: 82, alignment: .leading)
                Text(value)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .font(.subheadline)
        }
    }
}

struct MetricGrid: View {
    let items: [(String, Int)]

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(items, id: \.0) { item in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Circle()
                            .fill(Color.ytAccent.opacity(0.18))
                            .frame(width: 8, height: 8)
                        Spacer()
                    }
                    Text("\(item.1)")
                        .font(.title2.weight(.heavy))
                        .monospacedDigit()
                    Text(item.0)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                .padding(12)
                .frame(maxWidth: .infinity, minHeight: 82, alignment: .topLeading)
                .background(Color(.systemBackground).opacity(0.78))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(.separator).opacity(0.2), lineWidth: 1)
                }
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.role == "user" {
                Spacer(minLength: 36)
            }
            Text(message.content)
                .padding(12)
                .background(message.role == "user" ? Color.ytAccent.opacity(0.14) : Color(.systemBackground).opacity(0.9))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(.separator).opacity(0.16), lineWidth: 1)
                }
                .clipShape(RoundedRectangle(cornerRadius: 8))
            if message.role != "user" {
                Spacer(minLength: 36)
            }
        }
    }
}

struct EmptyStateView: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "leaf")
                .font(.largeTitle)
                .foregroundStyle(Color.ytAccentDeep)
                .frame(width: 58, height: 58)
                .background(Color.ytAccent.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
        .surfacePanel()
    }
}
