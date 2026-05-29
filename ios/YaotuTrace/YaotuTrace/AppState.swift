import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var apiBaseURL: String {
        didSet {
            UserDefaults.standard.set(apiBaseURL, forKey: Keys.apiBaseURL)
            if let url = URL(string: normalizedBaseURL(apiBaseURL)) {
                api.baseURL = url
            }
        }
    }
    @Published var token: String? {
        didSet {
            UserDefaults.standard.set(token, forKey: Keys.token)
            api.token = token
        }
    }
    @Published var username: String {
        didSet { UserDefaults.standard.set(username, forKey: Keys.username) }
    }
    @Published var role: String {
        didSet { UserDefaults.standard.set(role, forKey: Keys.role) }
    }
    @Published var statusMessage = ""

    let api: APIClient

    var isAuthenticated: Bool {
        !(token ?? "").isEmpty
    }

    init() {
        let storedBaseURL = UserDefaults.standard.string(forKey: Keys.apiBaseURL) ?? "https://cpuzhbc.cn"
        let storedToken = UserDefaults.standard.string(forKey: Keys.token)
        apiBaseURL = storedBaseURL
        token = storedToken
        username = UserDefaults.standard.string(forKey: Keys.username) ?? ""
        role = UserDefaults.standard.string(forKey: Keys.role) ?? ""
        api = APIClient(baseURL: URL(string: Self.normalizedBaseURL(storedBaseURL))!, token: storedToken)
    }

    func login(username: String, password: String) async throws {
        let payload = try await api.login(username: username, password: password)
        token = payload.token
        self.username = payload.username ?? username
        role = payload.role ?? ""
    }

    func refreshProfile() async {
        guard isAuthenticated else { return }
        do {
            let payload = try await api.me()
            username = payload.username ?? username
            role = payload.role ?? role
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    func logout() {
        token = nil
        username = ""
        role = ""
    }

    func canAccess(_ feature: AppFeature) -> Bool {
        FeatureAccess.canAccess(role: role, feature: feature)
    }

    func checkHealth() async {
        do {
            _ = try await api.health()
            statusMessage = "后端连接正常"
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    private func normalizedBaseURL(_ value: String) -> String {
        Self.normalizedBaseURL(value)
    }

    private static func normalizedBaseURL(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
            return trimmed
        }
        return "https://\(trimmed)"
    }

    private enum Keys {
        static let apiBaseURL = "apiBaseURL"
        static let token = "token"
        static let username = "username"
        static let role = "role"
    }
}

enum AppFeature: String {
    case batch
    case planting
    case processing
    case inspection
    case logistics
    case terminalQRCode
    case qrcode
    case security
    case dashboard
    case logs
    case users
}

enum FeatureAccess {
    static func canAccess(role: String, feature: AppFeature) -> Bool {
        let normalized = role.uppercased()
        if normalized.isEmpty { return true }
        if normalized == "ADMIN" { return true }
        switch feature {
        case .batch, .qrcode, .dashboard, .logs, .security:
            return true
        case .planting:
            return ["FARMER", "REGULATOR", "USER"].contains(normalized)
        case .processing:
            return ["MANUFACTURER", "FACTORY", "REGULATOR", "USER"].contains(normalized)
        case .inspection:
            return ["QUALITY", "REGULATOR", "USER"].contains(normalized)
        case .logistics, .terminalQRCode:
            return ["LOGISTICS", "REGULATOR", "USER"].contains(normalized)
        case .users:
            return false
        }
    }
}
