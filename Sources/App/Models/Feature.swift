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
        case track(Identifier, Track, Int, String)
        case record(Identifier, Record, Int, String)
        var type: String {
            switch self {
            case .track: return Track.self.name
            case .record: return Record.self.name
            }
        }
        var id: Int {
            switch self {
            case .track(let i, _, _, _): return i.wrapped.int!
            case .record(let i, _, _, _): return i.wrapped.int!
            }
        }
        var number: Int {
            switch self {
            case .track(_, _, let number, _): return number
            case .record(_, _, let number, _): return number
            }
        }
        var comment: String {
            switch self {
            case .track(_, _, _, let comment): return comment
            case .record(_, _, _, let comment): return comment
            }
        }
        func itemNode() throws -> Node {
            switch self {
            case .track(_, let t, _, _): return try t.makeLeafNode()
            case .record(_, let r, _, _): return try r.makeLeafNode()
            }
        }
        func makeNode() throws -> Node {
            return try [
                "id": id,
                "type": type,
                "item": itemNode(),
                "number": number,
                "comment": comment,
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
    public static func setItems(features: [Feature]) throws {
        let items     = try FeaturedItem.makeQuery().filter(Filter(FeaturedItem.self, .subset("feature_id", .in, features.map { try $0.id.makeNode(in: nil) }))).all()
        let trackIds  = items.filter { $0.itemType == Track.self.name }.map { $0.itemId.makeNode(in: nil) }
        let tracks    = try Track.makeQuery().filter(Filter(Track.self, .subset("id", .in, trackIds))).all()
        try Track.setParents(tracks: tracks)
        let recordIds = items.filter { $0.itemType == Record.self.name }.map { $0.itemId.makeNode(in: nil) }
        let records   = try Record.makeQuery().filter(Filter(Record.self, .subset("id", .in, recordIds))).all()
        try Record.setParents(records: records)
        for feature in features {
            let featureItems = items.filter{ $0.featureId == feature.id }.sorted(by: { $0.number > $1.number })
            feature.items = featureItems.map { (i: FeaturedItem) -> Item? in
                switch i.itemType {
                case Track.self.name:
                    return tracks.first { $0.id == i.itemId }.map { .track(i.id!, $0, i.number, i.comment) }
                case Record.self.name:
                    return records.first { $0.id == i.itemId }.map { .record(i.id!, $0, i.number, i.comment) }
                default:
                    return nil
                }
            }.filter { $0 != nil }.map { $0! }
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
    public func add(track: Track) throws {
        if let id = id, let trackId = track.id {
            try FeaturedItem(featureId: id, itemId: trackId, itemType: Track.self.name, number: 0, comment: "").save()
        }
    }
    public func add(record: Record) throws {
        if let id = id, let recordId = record.id {
            try FeaturedItem(featureId: id, itemId: recordId, itemType: Record.self.name, number: 0, comment: "").save()
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
