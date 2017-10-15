//
//  Track.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/11.
//
//

import Foundation
import Vapor
import Fluent
import FluentProvider

public final class Track: Model {
    public let storage = Storage()

//    public var id:           Node?
    public var name:         String
    public var phoneticName: String
    public var furigana:     String
    public var number:       Int
    public var artistId:     Identifier
    public var albumId:      Identifier
    
    public var exists: Bool = false
    
    public var album:  Album?
    public var artist: Artist?
    
    public init(name: String, number: Int, artistId: Identifier, albumId: Identifier, phoneticName: String? = nil, furigana: String? = nil) {
        //        self.id       = UUID().uuidString.makeNode()
        self.name         = name
        self.number       = number
        self.artistId     = artistId
        self.albumId      = albumId
        self.phoneticName = phoneticName ?? name.phonetic()
        self.furigana     = furigana ?? name.furigana()
    }

    public init(row: Row) throws {
//        id           = try row.get("id")
        name         = try row.get("name")
        phoneticName = try row.get("phonetic_name")
        furigana     = try row.get("furigana")
        number       = try row.get("number")
        artistId     = try row.get("artist_id")
        albumId      = try row.get("album_id")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
//        try row.set("id", name)
        try row.set("name"         , name)
        try row.set("phonetic_name", phoneticName)
        try row.set("furigana"     , furigana)
        try row.set("number"       , number)
        try row.set("artist_id"    , artistId)
        try row.set("album_id"     , albumId)
        return row
    }

    public func makeLeafNode() throws -> Node {
        return try makeJSON().converted()
    }

    public static func firstOrCreateBy(name: String, number: Int, artistId: Identifier, albumId: Identifier) -> Track? {
        if name.isEmpty {
            return nil
        }
        do {
            if let track = try Track.makeQuery().filter("name", name).first() {
                return track
            } else {
                let track = Track(name: name, number: number, artistId: artistId, albumId: albumId)
                try track.save()
                return track
            }
        } catch {
            print(error)
            return nil
        }
    }
    
    public static func setParents(tracks: [Track], albums: [Album], artists: [Artist]) {
        tracks.forEach { r in
            r.album  = albums.filter { a in a.id == r.albumId }.first
            r.artist = artists.filter { a in a.id == r.artistId }.first
        }
    }
}

extension Track: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { tracks in
            tracks.id()
            tracks.string("name")
            tracks.string("phonetic_name")
            tracks.string("furigana")
            tracks.int("number")
            tracks.parent(Artist.self)
            tracks.parent(Album.self)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension Track: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            //            id           = json.get("id")
            name         : json.get("name"),
            number       : json.get("number"),
            artistId     : json.get("artist_id"),
            albumId      : json.get("album_id"),
            phoneticName : json.get("phonetic_name"),
            furigana     : json.get("furigana")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("id", id)
        try json.set("number", number)
        try json.set("name", name)
        try json.set("artist_id", artistId)
        try json.set("album_id", albumId)
        try json.set("phonetic_name", phoneticName)
        try json.set("furigana", furigana)
        try json.set("artist", artist?.makeJSON())
        try json.set("album", album?.makeJSON())
        
        return json
    }
}

extension Track: ResponseRepresentable { }

// MARK: NODE
extension Track: NodeRepresentable { }
