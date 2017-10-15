//
//  Feature.swift
//  App
//
//  Created by Hiroki Kumamoto on 2017/10/12.
//

import Foundation
import Vapor
import Fluent
import FluentProvider

public final class Feature: Model {
    public enum Item {
        case track(Identifier, Track, Int)
        case record(Identifier, Record, Int)
        var type: String {
            switch self {
            case .track: return Track.self.name
            case .record: return Record.self.name
            }
        }
        var id: Int {
            switch self {
            case .track(let i, _, _): return i.wrapped.int!
            case .record(let i, _, _): return i.wrapped.int!
            }
        }
        var number: Int {
            switch self {
            case .track(_, _, let number): return number
            case .record(_, _, let number): return number
            }
        }
        func itemNode() throws -> Node {
            switch self {
            case .track(_, let t, _): return try t.makeLeafNode()
            case .record(_, let r, _): return try r.makeLeafNode()
            }
        }
        func makeNode() throws -> Node {
            return try [
                "id": id,
                "type": type,
                "item": itemNode(),
                "number": number,
                "is_track": type == "track",
                "is_record": type == "record",
            ].makeNode(in: nil)
        }
    }
    public let storage = Storage()

    public var id:           Identifier?
    public var name:         String
    public var number:       Int
    public var description:  String

    public var items:        [Item]?

    public init(name: String, number: Int, description: String) {
        self.name         = name
        self.number       = number
        self.description  = description
    }
    
    public init(row: Row) throws {
        name         = try row.get("name")
        number       = try row.get("number")
        description  = try row.get("description")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
        try row.set("name"         , name)
        try row.set("number"       , number)
        try row.set("description"  , description)
        return row
    }
    
    public func makeLeafNode() throws -> Node {
        return try makeJSON().converted()
    }
    
    public static func firstOrCreateBy(name: String) -> Feature? {
        if name.isEmpty {
            return nil
        }
        do {
            if let feature = try Feature.makeQuery().filter("name", name).first() {
                return feature
            } else {
                let feature = Feature(name: name, number: -1, description: "")
                try feature.save()
                return feature
            }
        } catch {
            print(error)
            return nil
        }
    }
    public func tracks() throws -> Query<Track> {
        return try siblings(to: Track.self, through: FeaturedItem.self, localIdKey: "feature_id", foreignIdKey: "item_id")
                .filter(Filter(FeaturedItem.self, .compare("item_type", .equals, Track.self.name.makeNode(in: nil))))
    }
    public func records() throws -> Query<Record> {
        return try siblings(to: Record.self, through: FeaturedItem.self, localIdKey: "feature_id", foreignIdKey: "item_id")
                .filter(Filter(FeaturedItem.self, .compare("item_type", .equals, Record.self.name.makeNode(in: nil))))
    }
    public func items() throws -> [Item] {
        let ts = try tracks().all()
        if ts.count > 0 {
            let trackAlbums = try Album.makeQuery().filter(Filter(Album.self, .subset("id", Filter.Scope.in, ts.map { $0.albumId.makeNode(in: nil) }))).all()
            let artists = try Artist.makeQuery().filter(Filter(Artist.self, .subset("id", Filter.Scope.in, ts.map { $0.artistId.makeNode(in: nil) }))).all()
            Track.setParents(tracks: ts, albums: trackAlbums, artists: artists)
        }
        let rs = try records().all()
        if rs.count > 0 {
            let artists = try Artist.makeQuery().filter(Filter(Artist.self, .subset("id", Filter.Scope.in, rs.map { $0.artistId.makeNode(in: nil) }))).all()
            let owners   = try Owner.makeQuery().filter(Filter(Owner.self, .subset("id", Filter.Scope.in, rs.map { $0.ownerId.makeNode(in: nil) }))).all()
            Record.setParents(records: rs, owners: owners, artists: artists)
        }
        return [ts.map { .track($0) }, rs.map { .record($0) }].flatMap { $0 }.sorted(by: { $0.0.number > $0.1.number })
    }
    public func add(track: Track) throws {
        if let id = id, let trackId = track.id {
            try FeaturedItem(featureId: id, itemId: trackId, itemType: Track.self.name, number: 0).save()
        }
    }
    public func add(record: Record) throws {
        if let id = id, let recordId = record.id {
            try FeaturedItem(featureId: id, itemId: recordId, itemType: Record.self.name, number: 0).save()
        }
    }
}

extension Feature: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { features in
            features.id()
            features.string("name")
            features.int("number")
            features.string("description")
        }
    }

    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension Feature: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            name         : json.get("name"),
            number       : json.get("number"),
            description  : json.get("description")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("id", id)
        try json.set("number", number)
        try json.set("name", name)
        try json.set("description", description)
        if let items = items {
            try json.set("items", items.map { try $0.makeNode() }.makeNode(in: nil))
        }
        return json
    }
}

extension Feature {
}

extension Feature: ResponseRepresentable { }

// MARK: NODE
extension Feature: NodeRepresentable { }
