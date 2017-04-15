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

public final class Record: Model {
    public var id:       Node?
    public var number:   Int
    public var name:     String
    public var comment:  String
    public var artistId: Node
    public var userId:   Node
    
    public var exists: Bool = false

    public var user: User?
    public var artist: Artist?

    public init(number: Int, name: String, comment: String, artistId: Node, userId: Node) {
//        self.id       = UUID().uuidString.makeNode()
        self.number   = number
        self.name     = name
        self.comment  = comment
        self.artistId = artistId
        self.userId   = userId
    }
    
    public init(node: Node, in context: Context) throws {
        id       = try node.extract("id")
        number   = try node.extract("number")
        name     = try node.extract("name")
        comment  = try node.extract("comment")
        artistId = try node.extract("artist_id")
        userId   = try node.extract("user_id")
    }
    
    public func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id"       : id,
            "number"   : number,
            "name"     : name,
            "comment"  : comment,
            "artist_id": artistId,
            "user_id"  : userId,
            ]
        )
    }

    public func makeLeafNode() throws -> Node {
        return try Node(node: [
            "id"       : id,
            "number"   : number,
            "name"     : name,
            "comment"  : comment,
            "artist_id": artistId,
            "user_id"  : userId,
            "user"     : user,
            "artist"   : artist,
            ]
        )

    }

    public static func firstOrCreateBy(number: Int, name: String, comment: String, artistId: Node, userId: Node) -> Record? {
        if name.count == 0 {
            return nil
        }
        do {
            if let record = try Record.query().filter("number", String(number)).filter("name", name).first() {
                return record
            } else {
                var record = Record(number: number, name: name, comment: comment, artistId: artistId, userId: userId)
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
        try database.create("records") { records in
            records.id()
            records.int("number")
            records.string("name")
            records.string("comment")
            records.parent(Artist.self, optional: false, unique: false)
            records.parent(User.self, optional: false, unique: false)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete("records")
    }
}

