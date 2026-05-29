import Foundation

struct APIEnvelope<T: Decodable>: Decodable {
    let code: Int?
    let message: String?
    let data: T?
}

struct EmptyPayload: Decodable {}

struct AuthRequest: Encodable {
    let username: String
    let password: String
}

struct AuthPayload: Decodable {
    let token: String
    let username: String?
    let role: String?
}

struct Batch: Identifiable, Decodable, Hashable {
    let id: Int?
    let batchNo: String?
    let minCode: String?
    let name: String?
    let category: String?
    let origin: String?
    let status: String?
    let description: String?
    let imageUrl: String?
    let usageAdvice: String?
    let contraindications: String?
    let commonPairings: String?
    let quantity: Decimal?
    let remainingQuantity: Decimal?
    let unit: String?
    let gs1LotNo: String?
    let gs1Code: String?
    let gs1Locked: Bool?
    let createdAt: String?
    let updatedAt: String?

    var stableID: String {
        batchNo ?? minCode ?? "\(id ?? 0)"
    }

    var displayName: String {
        let title = (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return title.isEmpty ? (batchNo ?? "未知批次") : title
    }
}

struct TraceResponse: Decodable {
    let batch: Batch?
    let lineageBatches: [Batch]?
    let plantingRecords: [AnyJSONObject]?
    let processingRecords: [AnyJSONObject]?
    let logisticsRecords: [AnyJSONObject]?
    let inspectionRecords: [AnyJSONObject]?
    let shipmentsWithEvents: [AnyJSONObject]?
    let blockchainRecord: AnyJSONObject?
}

struct ChatMessage: Codable, Identifiable, Hashable {
    var id = UUID()
    let role: String
    let content: String

    enum CodingKeys: String, CodingKey {
        case role
        case content
    }
}

struct AITraceContext: Encodable {
    let name: String?
    let batchNo: String?
    let origin: String?
}

struct AIChatRequest: Encodable {
    let messages: [ChatMessage]
    let sessionSource: String
    let traceContext: AITraceContext?
}

struct AIChatResponse: Decodable {
    let success: Bool?
    let content: String?
    let error: String?
    let message: String?
}

struct AnyJSONObject: Codable, Hashable, Identifiable {
    let values: [String: JSONValue]

    var id: String {
        values["id"]?.displayText.nonEmpty ?? values["batchNo"]?.displayText.nonEmpty ?? values["shipmentNo"]?.displayText.nonEmpty ?? UUID().uuidString
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        values = (try? container.decode([String: JSONValue].self)) ?? [:]
    }

    init(values: [String: JSONValue]) {
        self.values = values
    }

    func value(_ key: String) -> String {
        values[key]?.displayText ?? ""
    }
}

enum JSONValue: Codable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            self = .object((try? container.decode([String: JSONValue].self)) ?? [:])
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }

    var displayText: String {
        switch self {
        case .string(let value):
            return value
        case .number(let value):
            return value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(value)
        case .bool(let value):
            return value ? "是" : "否"
        case .object:
            return "对象"
        case .array(let value):
            return "\(value.count) 项"
        case .null:
            return ""
        }
    }
}

extension String {
    var nonEmpty: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}

func localizedFieldLabel(_ key: String) -> String {
    let labels = [
        "id": "编号",
        "batchNo": "批次号",
        "parentBatchNo": "父批次号",
        "childBatchNo": "派生批次号",
        "minCode": "最小码",
        "name": "名称",
        "category": "品类",
        "origin": "产地",
        "status": "状态",
        "quantity": "数量",
        "remainingQuantity": "剩余数量",
        "unit": "单位",
        "description": "描述",
        "usageAdvice": "用法建议",
        "contraindications": "禁忌",
        "commonPairings": "常见搭配",
        "gs1LotNo": "GS1 批号",
        "gs1Code": "GS1 编码",
        "gs1Locked": "GS1 锁定",
        "createdAt": "创建时间",
        "updatedAt": "更新时间",
        "productionDate": "生产日期",
        "imageUrl": "图片链接",
        "audioUrl": "音频链接",
        "fieldName": "地块",
        "operation": "操作",
        "operationTime": "操作时间",
        "details": "详情",
        "operator": "操作人",
        "latitude": "纬度",
        "longitude": "经度",
        "processType": "工艺类型",
        "lineName": "生产产线",
        "factory": "工厂",
        "extractedQuantity": "投入数量",
        "outputQuantity": "产出数量",
        "outputUnit": "产出单位",
        "inspectionType": "质检类型",
        "result": "结果",
        "reportUrl": "报告链接",
        "inspector": "质检员",
        "shipmentNo": "发运单号",
        "distributorName": "经销商",
        "carrier": "承运方",
        "trackingNo": "运单号",
        "remarks": "备注",
        "location": "位置",
        "traceUrl": "溯源链接",
        "txHash": "交易哈希",
        "blockHeight": "区块高度",
        "contractAddress": "合约地址",
        "username": "用户名",
        "password": "密码",
        "role": "角色",
        "nickname": "昵称",
        "phone": "电话"
    ]
    return labels[key] ?? key
}

func localizedFieldValue(key: String, value: JSONValue) -> String {
    formattedFieldText(key: key, value: value.displayText)
}

func formattedFieldText(key: String, value: String) -> String {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return trimmed }
    let timeKeys: Set<String> = ["createdAt", "updatedAt", "operationTime", "productionDate"]
    if timeKeys.contains(key) {
        return formattedDateTime(trimmed)
    }
    return trimmed
}

private func formattedDateTime(_ value: String) -> String {
    let withoutFraction = value.split(separator: ".", maxSplits: 1).first.map(String.init) ?? value
    let normalized = withoutFraction.replacingOccurrences(of: "T", with: " ")
    if normalized.count >= 16 {
        return String(normalized.prefix(16))
    }
    return normalized
}

struct FormField: Identifiable, Hashable {
    let id: String
    let title: String
    let placeholder: String
    let required: Bool

    init(_ id: String, _ title: String, placeholder: String = "", required: Bool = false) {
        self.id = id
        self.title = title
        self.placeholder = placeholder
        self.required = required
    }
}

struct ModuleSpec: Identifiable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let systemImage: String
    let listPath: String
    let createPath: String?
    let updatePathPrefix: String?
    let deletePathPrefix: String?
    let fields: [FormField]
    let primaryKeys: [String]
}
