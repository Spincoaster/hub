//
//  User.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation
import Vapor
import Fluent

public final class User: Model {
    public var id:       Node?
    public var name:     String

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
    public static func firstOrCreateBy(name: String) -> User? {
        if name.count == 0 {
            return nil
        }
        do {
            if let user = try User.query().filter("name", name).first() {
                return user
            } else {
                var user = User(name: name)
                try user.save()
                return user
            }
        } catch {
            return nil
        }
    }
}

extension User: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create("users") { users in
            users.id()
            users.string("name", unique: true)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete("users")
    }
}
