//
//  Album.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/11.
//
//

import Foundation
import Vapor
import Fluent
import FluentProvider
import Node

public final class Album: Model {
    public let storage = Storage()

//    public var id:           Node?
    public var name:         String
    public var phoneticName: String
    public var furigana:     String
    public var artistId:     Identifier
    
    public var exists: Bool = false
    
    public var artist: Artist?
    
    public init(name: String, artistId: Identifier) {
        //        self.id       = UUID().uuidString.makeNode()
        self.name     = name
        self.artistId = artistId
        phoneticName  = name.phonetic()
        furigana      = name.furigana()
    }

    public init(name: String, artistId: Identifier, phoneticName: String, furigana: String) {
        //        self.id       = UUID().uuidString.makeNode()
        self.name         = name
        self.artistId     = artistId
        self.phoneticName = phoneticName
        self.furigana     = furigana
    }
    
    public init(row: Row) throws {
//        id           = try row.get("id")
        name         = try row.get("name")
        phoneticName = try row.get("phonetic_name")
        furigana     = try row.get("furigana")
        artistId     = try row.get("artist_id")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
        //        try row.set("id", name)
        try row.set("name"         , name)
        try row.set("phonetic_name", phoneticName)
        try row.set("furigana"     , furigana)
        try row.set("artist_id"    , artistId)
        return row
    }

    public func makeLeafNode() throws -> Node {
        var node: Node = try makeJSON().converted()
        try node.set("artist", artist?.makeLeafNode())
        return node
    }

    public static func firstOrCreateBy(name: String, artistId: Identifier) -> Album? {
        if name.isEmpty {
            return nil
        }
        do {
            if let album = try Album.makeQuery().filter("name", name).first() {
                return album
            } else {
                let album = Album(name: name, artistId: artistId)
                try album.save()
                return album
            }
        } catch {
            print(error)
            return nil
        }
    }

    public static func setParents(albums: [Album], artists: [Artist]) {
        albums.forEach { al in
            al.artist = artists.filter { a in a.id == al.artistId }.first
        }
    }
}

extension Album: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { audios in
            audios.id()
            audios.string("name")
            audios.string("phonetic_name")
            audios.string("furigana")
            audios.parent(Artist.self)
        }
    }

    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension Album: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
//            id           = json.get("id")
            name         : json.get("name"),
            artistId     : json.get("artist_id"),
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
        try json.set("artist_id", artistId)
        return json
    }
}

extension Album: ResponseRepresentable { }


// MARK: NODE
extension Album: NodeRepresentable { }
