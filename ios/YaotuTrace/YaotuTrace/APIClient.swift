import Foundation

enum APIError: LocalizedError {
    case invalidBaseURL
    case invalidResponse
    case businessError(String)
    case missingData

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            return "后端地址无效"
        case .invalidResponse:
            return "服务器响应异常"
        case .businessError(let message):
            return message
        case .missingData:
            return "服务器未返回数据"
        }
    }
}

final class APIClient {
    var baseURL: URL
    var token: String?

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: URL = URL(string: "https://cpuzhbc.cn")!, token: String? = nil, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.token = token
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    func health() async throws -> EmptyPayload {
        try await request("/api/v1/health")
    }

    func login(username: String, password: String) async throws -> AuthPayload {
        try await request("/api/v1/auth/login", method: "POST", body: AuthRequest(username: username, password: password))
    }

    func me() async throws -> AuthPayload {
        try await request("/api/v1/auth/me")
    }

    func batches() async throws -> [Batch] {
        try await request("/api/v1/batches")
    }

    func rootBatches() async throws -> [Batch] {
        try await request("/api/v1/batches?rootOnly=true")
    }

    func batch(batchNo: String) async throws -> AnyJSONObject {
        try await request("/api/v1/batches/\(encodedPath(batchNo))")
    }

    func lockGS1(batchNo: String) async throws -> AnyJSONObject {
        try await request("/api/v1/batches/\(encodedPath(batchNo))/lock-gs1", method: "POST", body: Optional<String>.none)
    }

    func records(path: String) async throws -> [AnyJSONObject] {
        try await request(path)
    }

    func object(path: String) async throws -> AnyJSONObject {
        try await request(path)
    }

    func postObject(path: String, body: [String: JSONValue]) async throws -> AnyJSONObject {
        try await request(path, method: "POST", body: body)
    }

    func putObject(path: String, body: [String: JSONValue]) async throws -> AnyJSONObject {
        try await request(path, method: "PUT", body: body)
    }

    func delete(path: String) async throws {
        let _: EmptyPayload = try await request(path, method: "DELETE", body: Optional<String>.none)
    }

    func dashboardStats() async throws -> AnyJSONObject {
        try await request("/api/v1/dashboard/stats")
    }

    func dashboardForecast(herb: String? = nil) async throws -> AnyJSONObject {
        if let herb, !herb.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let encoded = herb.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? herb
            return try await request("/api/v1/dashboard/forecast?herb=\(encoded)")
        }
        return try await request("/api/v1/dashboard/forecast")
    }

    func dashboardHerbs() async throws -> [AnyJSONObject] {
        try await request("/api/v1/dashboard/herbs")
    }

    func publicHerbs() async throws -> [AnyJSONObject] {
        try await request("/api/v1/public/herbs")
    }

    func qrcode(batchNo: String) async throws -> AnyJSONObject {
        try await request("/api/v1/batches/\(encodedPath(batchNo))/qrcode?size=360")
    }

    func publicQRCode(batchNo: String) async throws -> AnyJSONObject {
        try await request("/api/v1/public/qr-code/\(encodedPath(batchNo))")
    }

    func leafBatches(rootBatchNo: String?) async throws -> [AnyJSONObject] {
        if let rootBatchNo, !rootBatchNo.isEmpty {
            return try await request("/api/v1/batches/\(encodedPath(rootBatchNo))/leaf-batches?limit=500")
        }
        return try await request("/api/v1/batches/leaf-batches?limit=500")
    }

    func leafQRCodes(rootBatchNo: String?, size: Int = 260) async throws -> [AnyJSONObject] {
        if let rootBatchNo, !rootBatchNo.isEmpty {
            return try await request("/api/v1/batches/\(encodedPath(rootBatchNo))/leaf-qrcodes?size=\(size)&limit=500")
        }
        return try await request("/api/v1/batches/leaf-qrcodes?size=\(size)&limit=500")
    }

    func leafQRCodesExport(rootBatchNo: String?) async throws -> AnyJSONObject {
        if let rootBatchNo, !rootBatchNo.isEmpty {
            return try await request("/api/v1/batches/\(encodedPath(rootBatchNo))/leaf-qrcodes/export?size=220&limit=500")
        }
        return try await request("/api/v1/batches/leaf-qrcodes/export?size=220&limit=500")
    }

    func shipmentEvents(shipmentNo: String) async throws -> [AnyJSONObject] {
        try await request("/api/v1/shipments/\(encodedPath(shipmentNo))/events")
    }

    func addShipmentEvent(shipmentNo: String, body: [String: JSONValue]) async throws -> AnyJSONObject {
        try await request("/api/v1/shipments/\(encodedPath(shipmentNo))/events", method: "POST", body: body)
    }

    func inspectionDerive(body: [String: JSONValue]) async throws -> AnyJSONObject {
        try await request("/api/v1/inspection/derive", method: "POST", body: body)
    }

    func uploadFile(data: Data, fileName: String, mimeType: String) async throws -> AnyJSONObject {
        guard let url = URL(string: "/api/v1/files/upload", relativeTo: baseURL) else {
            throw APIError.invalidBaseURL
        }
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (responseData, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw APIError.businessError("HTTP \(http.statusCode)") }
        let envelope = try decoder.decode(APIEnvelope<AnyJSONObject>.self, from: responseData)
        if let code = envelope.code, code != 200 {
            throw APIError.businessError(envelope.message ?? "上传失败")
        }
        guard let data = envelope.data else { throw APIError.missingData }
        return data
    }

    func generateCode(batchNo: String) async throws -> AnyJSONObject {
        try await request("/api/v1/code/generate", method: "POST", body: ["batchNo": JSONValue.string(batchNo)])
    }

    func verifyCode(_ code: String) async throws -> AnyJSONObject {
        try await request("/api/v1/code/verify", method: "POST", body: ["invisibleCode": JSONValue.string(code)])
    }

    func recordBlockchain(batchNo: String, data: String) async throws -> AnyJSONObject {
        try await request("/api/v1/blockchain/record", method: "POST", body: [
            "batchNo": JSONValue.string(batchNo),
            "data": JSONValue.string(data)
        ])
    }

    func verifyBlockchain(batchNo: String, data: String) async throws -> AnyJSONObject {
        try await request("/api/v1/blockchain/verify", method: "POST", body: [
            "batchNo": JSONValue.string(batchNo),
            "data": JSONValue.string(data)
        ])
    }

    func trace(batchNo: String) async throws -> TraceResponse {
        try await request("/api/v1/trace/\(encodedPath(batchNo))")
    }

    func chat(messages: [ChatMessage], traceContext: AITraceContext?) async throws -> AIChatResponse {
        let body = AIChatRequest(messages: messages, sessionSource: "ios", traceContext: traceContext)
        return try await rawRequest("/api/v1/ai/chat/sync", method: "POST", body: body)
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET") async throws -> T {
        try await request(path, method: method, body: Optional<String>.none)
    }

    private func request<T: Decodable, Body: Encodable>(_ path: String, method: String = "GET", body: Body?) async throws -> T {
        let envelope: APIEnvelope<T> = try await rawRequest(path, method: method, body: body)
        if let code = envelope.code, code != 200 {
            throw APIError.businessError(envelope.message ?? "请求失败")
        }
        guard let data = envelope.data else {
            if T.self == EmptyPayload.self {
                return EmptyPayload() as! T
            }
            throw APIError.missingData
        }
        return data
    }

    private func encodedPath(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
    }

    private func rawRequest<T: Decodable, Body: Encodable>(_ path: String, method: String = "GET", body: Body?) async throws -> T {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError.invalidBaseURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            if let envelope = try? decoder.decode(APIEnvelope<EmptyPayload>.self, from: data) {
                throw APIError.businessError(envelope.message ?? "HTTP \(http.statusCode)")
            }
            throw APIError.businessError("HTTP \(http.statusCode)")
        }
        return try decoder.decode(T.self, from: data)
    }
}
