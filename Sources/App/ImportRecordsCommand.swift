//
//  ImportRecords.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/16.
//
//

import Foundation

import Vapor
import PostgreSQLProvider
import Console
import Fluent

final class ImportReordsCommand: Command {
    public let id = "records"
    public let help = ["This command imports tracks."]
    public let console: ConsoleProtocol
    
    public init(console: ConsoleProtocol) {
        self.console = console
    }
    
    public func run(arguments: [String]) throws {
        console.print("running custom command...")
        if let url = getEnvironmentVar("DATABASE_URL") {
            let driver = try PostgreSQLDriver.Driver(url: url)
            Database.default = Database(driver)
        } else {
            let driver = try PostgreSQLDriver.Driver(url: "postgresql://postgres::3306/recordhub")
            Database.default = Database(driver)
        }
        
        let fileId = getEnvironmentVar("FILE_ID") ?? ""
        GoogleDrive.apiKey = getEnvironmentVar("API_KEY") ?? ""
        let _ = GoogleDrive().fetchCSV(fileId: fileId).on() { (rows: [[String]]) -> Void in
            rows.forEach {
                guard $0.count > 7 else { return }
//                let position:   String = $0[0]
                let recordNumber: String = $0[1]
                let ownerName:     String = $0[2]
                let name:         String = $0[3]
                let artistName:   String = $0[4]
                let comment:      String = $0[5]
//                let canUse:       String = $0[6]
//                let cleaning:     String = $0[7]
                guard let recordNo = Int(recordNumber) else { return }
                guard let ownerId   = Owner.firstOrCreateBy(name: ownerName)?.id else { return }
                guard let artistId = Artist.firstOrCreateBy(name: artistName)?.id else { return }
                guard let record   = Record.firstOrCreateBy(number: recordNo, name: name, comment: comment, artistId: artistId, ownerId: ownerId) else { return }
                print("imported \(ownerName) \(name) \(artistName) \(ownerId) \(record.ownerId) \(artistId) \(record.artistId)")
            }
        }.single()
    }
    
    func getEnvironmentVar(_ name: String) -> String? {
        guard let rawValue = getenv(name) else { return nil }
        return String(utf8String: rawValue)
    }
}
