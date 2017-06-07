//
//  Record.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation
import Vapor
import Fluent
import FluentProvider

public final class Record: Model {
    public let storage = Storage()

    public var id:           Identifier?
    public var number:       Int
    public var name:         String
    public var phoneticName: String
    public var furigana:     String
    public var comment:      String
    public var artistId:     Identifier
    public var userId:       Identifier
    
    public var exists: Bool = false

    public var user: User?
    public var artist: Artist?

    public init(number: Int, name: String, comment: String, artistId: Identifier, userId: Identifier) {
//        self.id       = UUID().uuidString.makeNode()
        self.number   = number
        self.name     = name
        self.comment  = comment
        self.artistId = artistId
        self.userId   = userId
        phoneticName  = name.phonetic()
        furigana      = name.furigana()
    }

    public init(number: Int, name: String, comment: String, artistId: Identifier, userId: Identifier, phoneticName: String, furigana: String) {
        //        self.id       = UUID().uuidString.makeNode()
        self.number        = number
        self.name          = name
        self.comment       = comment
        self.artistId      = artistId
        self.userId        = userId
        self.phoneticName  = phoneticName
        self.furigana      = furigana
    }

    
    public init(row: Row) throws {
        id           = try row.get("id")
        number       = try row.get("number")
        name         = try row.get("name")
        phoneticName = try row.get("phonetic_name")
        furigana     = try row.get("furigana")
        comment      = try row.get("comment")
        artistId     = try row.get("artist_id")
        userId       = try row.get("user_id")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
        //        try row.set("id", name)
        try row.set("number"       , number)
        try row.set("name"         , name)
        try row.set("phonetic_name", phoneticName)
        try row.set("furigana"     , furigana)
        try row.set("comment"      , comment)
        try row.set("artist_id"    , artistId)
        try row.set("user_id"      , userId)
        return row
    }

    public func makeLeafNode() throws -> Node {
        var node: Node = try makeJSON().converted()
        try node.set("artist", artist?.makeLeafNode())
        try node.set("user", user?.makeLeafNode())
        return node
    }

    public static func firstOrCreateBy(number: Int, name: String, comment: String, artistId: Identifier, userId: Identifier) -> Record? {
        if name.isEmpty {
            return nil
        }
        do {
            if let record = try Record.makeQuery().filter("number", String(number)).filter("name", name).first() {
                return record
            } else {
                let record = Record(number: number, name: name, comment: comment, artistId: artistId, userId: userId)
                try record.save()
                return record
            }
        } catch {
            print(error)
            return nil
        }
    }

    public static func setParents(records: [Record], users: [User], artists: [Artist]) {
        records.forEach { r in
            r.user   = users.filter { u in u.id == r.userId }.first
            r.artist = artists.filter { a in a.id == r.artistId }.first
        }
    }
}

/*public extension Record {
    public func user() throws -> Parent<User> {
        return try parent(userId, nil, User.self)
    }
    public func artist() throws -> Parent<Artist> {
        return try parent(artistId, nil, Artist.self)
    }
}*/

extension Record: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { records in
            records.id()
            records.int("number")
            records.string("name")
            records.string("phonetic_name")
            records.string("furigana")
            records.string("comment")
            records.parent(Artist.self, optional: false, unique: false)
            records.parent(User.self, optional: false, unique: false)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension Record: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            //            id           = json.get("id")
            number       : json.get("number"),
            name         : json.get("name"),
            comment      : json.get("comment"),
            artistId     : json.get("artist_id"),
            userId       : json.get("user_id"),
            phoneticName : json.get("phonetic_name"),
            furigana     : json.get("furigana")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("id", id)
        try json.set("number", number)
        try json.set("name", name)
        try json.set("comment", comment)
        try json.set("artist_id", artistId)
        try json.set("user_id", userId)
        try json.set("phonetic_name", phoneticName)
        try json.set("furigana", furigana)
        
        return json
    }
}

extension Record: ResponseRepresentable { }

// MARK: NODE
extension Record: NodeRepresentable { }
