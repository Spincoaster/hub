import Foundation
import ReactiveSwift
import CSV

public class GoogleDrive {
    public static var apiKey: String = ""
    public init() {
    }
    public func fetchCSV(fileId: String) -> SignalProducer<CSV, NSError> {
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
                guard let csv = try? CSV(string: str) else { return }
                observer.send(value: csv)
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

