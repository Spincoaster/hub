import Foundation

public protocol HTMLController {}

public extension HTMLController {
    func getEnvAsString(_ key: String) -> String {
        guard let rawValue = getenv(key) else { return "" }
        return String(utf8String: rawValue) ?? ""
    }
    func getTitle() -> String {
        return getEnvAsString("APP_NAME")
    }
    func getGoogleAnalyticsId() -> String {
        return getEnvAsString("GOOGLE_ANALYTICS_ID")
    }
    func getHomeIconUrl() -> String {
        return getEnvAsString("HOME_ICON_URL")
    }
}
