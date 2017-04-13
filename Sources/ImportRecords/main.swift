import Foundation
import Vapor
import VaporPostgreSQL
import Fluent
import Lib

func getEnvironmentVar(_ name: String) -> String? {
    guard let rawValue = getenv(name) else { return nil }
    return String(utf8String: rawValue)
}

if let url = getEnvironmentVar("DATABASE_URL") {
    let provider = try VaporPostgreSQL.Provider(url: url)
    Database.default = Database(provider.driver)
    print("DATABASE_URL \(url)")
} else {
    let driver = VaporPostgreSQL.PostgreSQLDriver(dbname: "recordhub", user: "postgres", password: "")
    Database.default = Database(driver)
}

let fileId = getEnvironmentVar("FILE_ID") ?? ""
GoogleDrive.apiKey = getEnvironmentVar("API_KEY") ?? ""
let _ = GoogleDrive().fetchCSV(fileId: fileId).on() { (rows: [[String]]) -> Void in
    rows.forEach {
        guard $0.count > 7 else { return }
        let position:   String = $0[0]
        let recordNumber: String = $0[1]
        let userName:     String = $0[2]
        let title:        String = $0[3]
        let artistName:   String = $0[4]
        let comment:      String = $0[5]
        let canUse:       String = $0[6]
        let cleaning:     String = $0[7]
        guard let recordNo = Int(recordNumber) else { return }
        guard let userId   = User.firstOrCreateBy(name: userName)?.id else { return }
        guard let artistId = Artist.firstOrCreateBy(name: artistName)?.id else { return }
        guard let record   = Record.firstOrCreateBy(number: recordNo, title: title, comment: comment, artistId: artistId, userId: userId) else { return }
        print("imported \(userName) \(title) \(artistName) \(userId) \(record.userId) \(artistId) \(record.artistId)")
    }
}.single()

print("done")
