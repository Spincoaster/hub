//
//  SearchController.swift
//  recordhubPackageDescription
//
//  Created by Hiroki Kumamoto on 2017/09/28.
//

import Foundation
import Vapor
import HTTP
import Fluent

final class SearchController {
    let limit = 100
    func getHomeIconUrl() -> String? {
        guard let rawValue = getenv("HOME_ICON_URL") else { return nil }
        return String(utf8String: rawValue)
    }
    func menus(request: Request) throws -> Node {
        var items: [[String:String]] = []
        for menu in Menu.items {
            items.append(menu)
        }
        return try items.makeNode(in: nil)
    }
    func search(_ request: Request) throws -> ResponseRepresentable {
        guard let q = request.data["query"]?.string else {
            throw Abort(.badRequest)
        }
        let tracks: (count: Int, items: [Track]) = try searchTracks(q)
        if tracks.count > 0 {
            try Track.setParents(tracks: tracks.items)
        }
        let records: (count: Int, items: [Record]) = try searchRecords(q)
        if records.count > 0 {
            try Record.setParents(records: records.items)
        }
        let obj: [String: Node] = [
            "title": "Search results",
            "home_icon_url": getHomeIconUrl()?.makeNode(in: nil) ?? "",
            "query": q.makeNode(in: nil),
            "tracks": try tracks.items.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "has_tracks": (tracks.count > 0).makeNode(in: nil),
            "tracks_count": tracks.count.makeNode(in: nil),
            "records": try records.items.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "has_records": (records.count > 0).makeNode(in: nil),
            "records_count": records.count.makeNode(in: nil),
            "menus": try menus(request: request),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
            //            "current_user": currentUser.makeNode(in: nil),
        ]
        let parameters = Node.object(obj)
        return try drop.view.make("search", parameters)
    }
    func searchTracks(_ c: String) throws -> (count: Int, items: [Track]) {
        let query = try Track.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                         .join(Album.self, baseKey: "album_id", joinedKey: "id")
                                         .sort(Sort(Artist.self, "phonetic_name", .ascending))
        try query.or { orGroup in
            try orGroup.contains(Artist.self, "name", c)
            try orGroup.contains(Artist.self, "furigana", c)
            try orGroup.contains(Album.self, "name", c)
            try orGroup.contains(Album.self, "furigana", c)
            try orGroup.contains(Track.self, "name", c)
            try orGroup.contains(Track.self, "furigana", c)
        }
        let count = try query.count()
        let items = try query.limit(limit).all()
        return (count: count, items: items)
    }
    func searchRecords(_ c: String) throws -> (count: Int, items: [Record]) {
        let query = try Record.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                          .join(Owner.self, baseKey: "owner_id", joinedKey: "id")
                                          .sort(Sort(Artist.self, "phonetic_name", .ascending))
        try query.or { orGroup in
            try orGroup.contains(Owner.self,  "name", c)
            try orGroup.contains(Artist.self, "name", c)
            try orGroup.contains(Artist.self, "furigana", c)
            try orGroup.contains(Record.self, "name", c)
            try orGroup.contains(Record.self, "furigana", c)
            try orGroup.contains(Record.self, "comment", c)
        }
        let count = try query.count()
        let items = try query.limit(limit).all()
        return (count: count, items: items)
    }
}

