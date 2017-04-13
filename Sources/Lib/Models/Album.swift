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

public final class Album: Model {
    public var id:       Node?
    public var name:     String
    public var artistId: Node
    
    public var exists: Bool = false
    
    public var artist: Artist?
    
    public init(name: String, artistId: Node) {
        //        self.id       = UUID().uuidString.makeNode()
        self.name     = name
        self.artistId = artistId
    }
    
    public init(node: Node, in context: Context) throws {
        id       = try node.extract("id")
        name     = try node.extract("name")
        artistId = try node.extract("artist_id")
    }
    
    public func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id"       : id,
            "name"     : name,
            "artist_id": artistId,
            ]
        )
    }
    
    public func makeLeafNode() throws -> Node {
        return try Node(node: [
            "id"       : id,
            "name"     : name,
            "artist_id": artistId,
            "artist"   : artist,
            ]
        )
        
    }
    
    public static func firstOrCreateBy(name: String, artistId: Node) -> Album? {
        if name.count == 0 {
            return nil
        }
        do {
            if let album = try Album.query().filter("name", name).first() {
                return album
            } else {
                var album = Album(name: name, artistId: artistId)
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
        try database.create("albums") { audios in
            audios.id()
            audios.string("name")
            audios.parent(Artist.self, optional: false, unique: false)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete("albums")
    }
}
