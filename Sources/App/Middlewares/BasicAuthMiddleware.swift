import HTTP
import Vapor

public struct Credential {
    public let username: String
    public let password: String
    
    public init(username: String, password: String) {
        self.username = username
        self.password = password
    }
}

extension Request {
    var currentUser: String? {
        return storage["current_user"] as? String
    }
    func setRequireLogin() {
        storage["require_login"] = true
    }
    var requireLogin: Bool {
        return storage["require_login"] as? Bool ?? true
    }
}

final class BasicAuthMiddleware: Middleware {
    func respond(to request: Request, chainingTo next: Responder) throws -> Response {
        authroize(request)
        let response = try next.respond(to: request)
        if request.currentUser == nil && request.requireLogin {
            response.headers[HeaderKey.wwwAuthenticate] = "Basic realm=\"SECRET AREA\""
            response.status = Status.unauthorized
            return response
        }
        return response
    }
    func authroize(_ request: Request) {
        guard let password = getEnvironmentVar("BASIC_AUTH_PASSWORD") else {
            return
        }
        guard let credential = getPassword(request.headers[HeaderKey.authorization]) else {
            return
        }
        if password == credential.password {
            request.storage["current_user"] = credential.username
        }
    }
    func getPassword(_ string: String?) -> Credential? {
        guard let string = string, let range = string.range(of: "Basic ") else {
            return nil
        }
        let token = string.substring(from: range.upperBound)
        let decodedToken = token.makeBytes().base64Decoded.makeString()
        guard let separatorRange = decodedToken.range(of: ":") else {
            return nil
        }
        
        let username = decodedToken.substring(to: separatorRange.lowerBound)
        let password = decodedToken.substring(from: separatorRange.upperBound)
        
        return Credential(username: username, password: password)
    }
    func getEnvironmentVar(_ name: String) -> String? {
        guard let rawValue = getenv(name) else { return nil }
        return String(utf8String: rawValue)
    }
}
