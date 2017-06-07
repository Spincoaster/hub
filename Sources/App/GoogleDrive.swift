import Foundation
import ReactiveSwift

public class GoogleDrive {
    public static var apiKey: String = ""
    public init() {
    }
    public func fetchCSV(fileId: String) -> SignalProducer<[[String]], NSError> {
        return SignalProducer { (observer, disposable) in
            let url = URL(string: "https://www.googleapis.com/drive/v3/files/\(fileId)/export?key=\(GoogleDrive.apiKey)&mimeType=text/csv")
            var request = URLRequest(url: url!)
            request.httpMethod = "GET"
            let session = URLSession(configuration: URLSessionConfiguration.default)
            session.dataTask(with: request) {data, response, err in
                if let err = err {
                    print("error")
                    observer.send(error: err as! NSError)
                    return
                }
                guard let data = data else { return }
                guard let str = String(data: data, encoding: String.Encoding.utf8) else { return }
                let rows: [String] = str.components(separatedBy: "\r\n")
                let cells = rows.map { s -> [String] in
                    return s.components(separatedBy: ",").map { val in
                        if val.isEmpty { return val }
                        if val[val.startIndex] != "\"" { return val }
                        return val.substring(with: val.index(val.startIndex, offsetBy: 1)..<val.index(val.endIndex, offsetBy: -1))
                    }
                }
                observer.send(value: cells)
                observer.sendCompleted()
            }.resume()
        }
    }
    public func fetchText(fileId: String) -> SignalProducer<[String], NSError> {
        return SignalProducer { (observer, disposable) in
            let url = URL(string: "https://www.googleapis.com/drive/v3/files/\(fileId)/export?key=\(GoogleDrive.apiKey)&mimeType=text/plain")
            var request = URLRequest(url: url!)
            request.httpMethod = "GET"
            let session = URLSession(configuration: URLSessionConfiguration.default)
            session.dataTask(with: request) {data, response, err in
                if let err = err {
                    print("error")
                    observer.send(error: err as! NSError)
                    return
                }
                guard let data = data else { return }
                guard let str = String(data: data, encoding: String.Encoding.utf8) else { return }
                let lines: [String] = str.components(separatedBy: "\r\n")
                observer.send(value: lines)
                observer.sendCompleted()
                }.resume()
        }
    }

}

