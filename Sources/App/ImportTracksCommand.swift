//
//  ImportTracksCommand.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/16.
//
//

import Foundation
import Vapor
import VaporPostgreSQL
import Console
import Fluent

final class ImportTracksCommand: Command {
    public let id = "records"
    public let help = ["This command imports tracks."]
    public let console: ConsoleProtocol
    
    public init(console: ConsoleProtocol) {
        self.console = console
    }
    
    public func run(arguments: [String]) throws {
        console.print("running custom command...")
        
        if let url = getEnvironmentVar("DATABASE_URL") {
            let provider = try VaporPostgreSQL.Provider(url: url)
            Database.default = Database(provider.driver)
            print("DATABASE_URL \(url)")
        } else {
            let driver = VaporPostgreSQL.PostgreSQLDriver(dbname: "recordhub", user: "postgres", password: "")
            Database.default = Database(driver)
        }
        
        let externalId = getEnvironmentVar("EXTERNAL_ID") ?? ""
        let internalId = getEnvironmentVar("INTERNAL_ID") ?? ""
        GoogleDrive.apiKey = getEnvironmentVar("API_KEY") ?? ""
        
        let _ = GoogleDrive().fetchText(fileId: externalId).on() { (lines: [String]) -> Void in
            lines.forEach { self.handleLine(line: $0) }
            }.single()
        
        let _ = GoogleDrive().fetchText(fileId: internalId).on() { (lines: [String]) -> Void in
            lines.forEach { self.handleLine(line: $0) }
            }.single()
    }
    
    func getEnvironmentVar(_ name: String) -> String? {
        guard let rawValue = getenv(name) else { return nil }
        return String(utf8String: rawValue)
    }
    
    func handleLine(line: String) {
        var handled = false
        defer {
            if !handled {
                print("ignored \(line)")
            }
        }
        let paths = line.components(separatedBy: "/")
        if paths.count < 4 { return }
        let artistName = paths[1]
        let albumName  = paths[2]
        let trackPath  = paths[3]
        guard trackPath.count > 3 else { return }
        guard let number = Int(trackPath.substring(to: trackPath.index(trackPath.startIndex, offsetBy: 2))) else { return }
        let fileName = trackPath.substring(from: trackPath.index(trackPath.startIndex, offsetBy: 3))
        guard let name = fileName.components(separatedBy: ".flac").get(0) else { return }
        
        guard let artistId = Artist.firstOrCreateBy(name: artistName)?.id else { return }
        guard let albumId  = Album.firstOrCreateBy(name: albumName, artistId: artistId)?.id else { return }
        guard let track    = Track.firstOrCreateBy(name: name, number: number, artistId: artistId, albumId: albumId) else { return }
        handled = true
        print("\(artistName) \(albumName) \(track.number) \(track.name)")
    }
}
