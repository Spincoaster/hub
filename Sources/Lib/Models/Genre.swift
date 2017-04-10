//
//  Genre.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation
import Vapor
import Fluent

public final class Genre: Model {
    public var id:       Node?
    public var name:    String

    public var exists: Bool = false

    public init(name: String) {
//        self.id     = UUID().uuidString.makeNode()
        self.name   = name
    }
    
    public init(node: Node, in context: Context) throws {
        id     = try node.extract("id")
        name   = try node.extract("name")
    }
    
    public func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id"    : id,
            "name"  : name,
            ]
        )
    }
}

extension Genre: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create("genres") { records in
            records.id()
            records.string("name")
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete("genres")
    }
}
