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

public final class Artist: Model {
    public var id:           Node?
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
    
    public init(node: Node, in context: Context) throws {
        id           = try node.extract("id")
        name         = try node.extract("name")
        phoneticName = try node.extract("phonetic_name")
        furigana     = try node.extract("furigana")
    }
    
    public func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id"           : id,
            "name"         : name,
            "phonetic_name": phoneticName,
            "furigana"     : furigana
            ]
        )
    }
    public static func firstOrCreateBy(name: String) -> Artist? {
        if name.count == 0 {
            return nil
        }
        do {
            if let artist = try Artist.query().filter("name", name).first() {
                return artist
            } else {
                var artist = Artist(name: name)
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
        try database.create("artists") { artists in
            artists.id()
            artists.string("name", unique: true)
            artists.string("phonetic_name")
            artists.string("furigana")
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete("artists")
    }
}

