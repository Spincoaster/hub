//
//  Artist.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation
import Vapor
import Fluent
import FluentProvider

public final class Artist: Model {
    public let storage = Storage()

    public var id:           Identifier?
    public var name:         String
    public var phoneticName: String
    public var furigana:     String

    public var exists: Bool = false

    public init(name: String) {
//        self.id   = UUID().uuidString.makeNode()
        self.name    = name
        phoneticName = name.phonetic()
        furigana     = name.furigana()
    }

    public init(name: String, phoneticName: String, furigana: String) {
        //        self.id   = UUID().uuidString.makeNode()
        self.name    = name
        self.phoneticName = phoneticName
        self.furigana     = furigana
    }
    
    public init(row: Row) throws {
        id           = try row.get("id")
        name         = try row.get("name")
        phoneticName = try row.get("phonetic_name")
        furigana     = try row.get("furigana")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
        try row.set("name"         , name)
        try row.set("phonetic_name", phoneticName)
        try row.set("furigana"     , furigana)
        return row
    }

    public func makeLeafNode() throws -> Node {
        return try makeJSON().converted()
    }

    public static func firstOrCreateBy(name: String) -> Artist? {
        if name.isEmpty {
            return nil
        }
        do {
            if let artist = try Artist.makeQuery().filter("name", name).first() {
                return artist
            } else {
                let artist = Artist(name: name)
                try artist.save()
                return artist
            }
        } catch {
            return nil
        }
    }
}

extension Artist: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { artists in
            artists.id()
            artists.string("name", unique: true)
            artists.string("phonetic_name")
            artists.string("furigana")
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension Artist: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            //            id           = json.get("id")
            name         : json.get("name"),
            phoneticName : json.get("phonetic_name"),
            furigana     : json.get("furigana")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("id", id)
        try json.set("name", name)
        try json.set("phonetic_name", phoneticName)
        try json.set("furigana", furigana)
        return json
    }
}

extension Artist: ResponseRepresentable { }

// MARK: NODE
extension Artist: NodeRepresentable { }
