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

public final class Track: Model {
    public var id:           Node?
    public var name:         String
    public var phoneticName: String
    public var number:       Int
    public var artistId:     Node
    public var albumId:      Node
    
    public var exists: Bool = false
    
    public var album:  Album?
    public var artist: Artist?
    
    public init(name: String, number: Int, artistId: Node, albumId: Node) {
        //        self.id       = UUID().uuidString.makeNode()
        self.name     = name
        self.number   = number
        self.artistId = artistId
        self.albumId  = albumId
        phoneticName  = name.phonetic()
    }
    
    public init(node: Node, in context: Context) throws {
        id           = try node.extract("id")
        name         = try node.extract("name")
        phoneticName = try node.extract("phonetic_name")
        number       = try node.extract("number")
        artistId     = try node.extract("artist_id")
        albumId      = try node.extract("album_id")
    }
    
    public func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id"           : id,
            "name"         : name,
            "phonetic_name": phoneticName,
            "number"       : number,
            "artist_id"    : artistId,
            "album_id"     : albumId,
            ]
        )
    }
    
    public func makeLeafNode() throws -> Node {
        return try Node(node: [
            "id"           : id,
            "name"         : name,
            "phonetic_name": phoneticName,
            "number"       : number,
            "artist_id"    : artistId,
            "album_id"     : albumId,
            "artist"       : artist,
            "album"        : album,
            ]
        )
        
    }
    
    public static func firstOrCreateBy(name: String, number: Int, artistId: Node, albumId: Node) -> Track? {
        if name.count == 0 {
            return nil
        }
        do {
            if let track = try Track.query().filter("name", name).first() {
                return track
            } else {
                var track = Track(name: name, number: number, artistId: artistId, albumId: albumId)
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
        try database.create("tracks") { tracks in
            tracks.id()
            tracks.string("name")
            tracks.string("phonetic_name")
            tracks.int("number")
            tracks.parent(Artist.self, optional: false, unique: false)
            tracks.parent(Album.self, optional: false, unique: false)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete("tracks")
    }
}
