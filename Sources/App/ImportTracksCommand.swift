//
//  ImportTracksCommand.swift
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
import CSV

let TAGS: [String] = [
    "TRACKNUMBER",
    "TITLE",
    "ALBUM",
    "ARTIST",
    "COMMENT",
    "GENRE",
    "DATE",
    "COPYRIGHT"
]

struct TrackInfo {
    var trackNumber: Int
    var title:       String
    var album:       String
    var artist:      String
    var comment:     String
    var genre:       String
    var date:        String
    var copyright:   String

    init(trackNumber: Int, title: String, album: String, artist: String) {
        self.trackNumber = trackNumber
        self.title       = title
        self.album       = album
        self.artist      = artist
        comment          = ""
        genre            = ""
        date             = ""
        copyright        = ""
    }

    init?(tags: [String:String]) {
        if (tags["TITLE"].map { $0.isEmpty } ?? true)  {
            return nil
        }
        trackNumber = tags["TRACKNUMBER"].flatMap { Int($0) } ?? 0
        title       = tags["TITLE"] ?? ""
        album       = tags["ALBUM"] ?? ""
        artist      = tags["ARTIST"] ?? ""
        comment     = tags["COMMENT"] ?? ""
        genre       = tags["GENRE"] ?? ""
        date        = tags["DATE"] ?? ""
        copyright   = tags["COPYRIGHT"] ?? ""
    }

    init?(pathString: String) {
        let paths = pathString.components(separatedBy: "/")
        if paths.count < 4 { return nil }
        let artistName = paths[1]
        let albumName  = paths[2]
        let trackPath  = paths[3]
        guard trackPath.characters.count > 3 else {
            return nil
        }
        guard let number = Int(trackPath.substring(to: trackPath.index(trackPath.startIndex, offsetBy: 2))) else {
            return nil
        }
        let fileName = trackPath.substring(from: trackPath.index(trackPath.startIndex, offsetBy: 3))
        guard let name = fileName.components(separatedBy: ".flac").get(0) else {
            return nil
        }
        self.init(trackNumber: number, title: name, album: albumName, artist: artistName)
    }

    func row() -> [String] {
        return ["\(trackNumber)", title, album, artist, comment, genre, date, copyright]
    }
}

final class ImportTracksCommand: Command {
    public let id = "tracks"
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
            print("DATABASE_URL \(url)")
        } else {
            let driver = try PostgreSQLDriver.Driver(url: "postgresql://postgres::3306/recordhub")
            Database.default = Database(driver)
        }
        if arguments.count == 0 {
            print("Please specify \"internal\" or \"external\"")
        }
        switch arguments[0] {
        case "internal":
            importInternalTracks()
        case "external":
            importExternalTracks()
        default:
            print("Please specify \"internal\" or \"external\"")
        }
    }

    func importTracks(dir: String, listFilePath: String) {
        let fm = FileManager.default
        guard fm.fileExists(atPath: listFilePath) && fm.fileExists(atPath: dir) else {
            print("\(listFilePath) or \(dir) don't exist")
            return
        }
        var infos: [TrackInfo] = []
        readFile(path: listFilePath).forEach {
            if let trackInfo = trackInfo(of: "\(dir)/\($0)") {
                handleInfo(trackInfo: trackInfo)
                print("flac: \(trackInfo)")
            } else if let trackInfo = TrackInfo(pathString: $0) {
                infos.append(trackInfo)
                print("file path: \(trackInfo)")
            }
        }
    }
    
    func importInternalTracks() {
        let dir = "/Volumes/HAP_Internal"
        importTracks(dir: dir, listFilePath: "./internal.txt")
    }

    func importExternalTracks() {
        let dir = "/Volumes/HAP_External"
        importTracks(dir: dir, listFilePath: "./external.txt")
    }

    func getEnvironmentVar(_ name: String) -> String? {
        guard let rawValue = getenv(name) else { return nil }
        return String(utf8String: rawValue)
    }

    func handleLine(line: String) throws {
        var handled = false
        defer {
            if !handled {
                print("ignored \(line)")
            }
        }
        guard let trackInfo = TrackInfo(pathString: line) else { return }
        handleInfo(trackInfo: trackInfo)
    }

    func handleInfo(trackInfo: TrackInfo) {
        guard let artistId = Artist.firstOrCreateBy(name: trackInfo.artist)?.id else { return }
        guard let albumId  = Album.firstOrCreateBy(name: trackInfo.album, artistId: artistId)?.id else { return }
        guard let track    = Track.firstOrCreateBy(name: trackInfo.title, number: trackInfo.trackNumber, artistId: Identifier(artistId), albumId: albumId) else { return }
        print("\(trackInfo.artist) \(trackInfo.album) \(track.number) \(track.name)")
    }

    func importFromCSV(fileName: String) throws {
        let dir = FileManager.default.currentDirectoryPath
        let str = try String(contentsOf: URL(string: "file://\(dir)/\(fileName)")!)
        var csv = try CSV(string: str)
        var _ = csv.next()
        while true {
            if let row = csv.next() {
                TrackInfo(trackNumber: Int(row[0])!, title: row[1], album: row[2], artist: row[3])
            } else {
                break
            }
        }
    }
}

func shell(launchPath: String, arguments: [String]) -> String {
    let process = Process()
    process.launchPath = launchPath
    process.arguments = arguments
    let pipe = Pipe()
    process.standardOutput = pipe
    process.launch()
    let output_from_command = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: String.Encoding.utf8)!
    if output_from_command.characters.count > 0 {
        let lastIndex = output_from_command.index(before: output_from_command.endIndex)
        return output_from_command[output_from_command.startIndex ..< lastIndex]
    }
    return output_from_command
}

func readFile(path: String) -> [String] {
    let fileContents = try! String(contentsOfFile: path, encoding: String.Encoding.utf8)
    return fileContents.components(separatedBy: "\n")
}

func trackInfo(of path: String) -> TrackInfo? {
    if (path as NSString).pathExtension != "flac" {
        return nil
    }
    var tags: [String:String] = [:]
    var opts = TAGS.map { "--show-tag=\($0)" }
    opts.append(path)
    print("processing track info of \(path)")
    let output = shell(launchPath: "/usr/local/bin/metaflac", arguments: opts)
    output.components(separatedBy: "\n").map { $0.components(separatedBy: "=") }.forEach {
        if $0.count >= 2 {
            tags[$0[0]] = $0[1]
        }
    }
    print("processed \(tags)")
    return TrackInfo(tags: tags)
}
