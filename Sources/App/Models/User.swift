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
import FluentProvider

public final class User: Model {
    public let storage = Storage()

    public var id:       Identifier?
    public var name:     String

    public var exists: Bool = false

    public init(name: String) {
//        self.id     = UUID().uuidString.makeNode()
        self.name   = name
    }
    
    public init(row: Row) throws {
        id     = try row.get("id")
        name   = try row.get("name")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
        try row.set("name", name)
        return row
    }

    public func makeLeafNode() throws -> Node {
        return try makeJSON().converted()
    }

    public static func firstOrCreateBy(name: String) -> User? {
        if name.isEmpty {
            return nil
        }
        do {
            if let user = try User.makeQuery().filter("name", name).first() {
                return user
            } else {
                let user = User(name: name)
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
        try database.create(self) { users in
            users.id()
            users.string("name", unique: true)
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension User: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            //            id           = json.get("id")
            name         : json.get("name")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("id", id)
        try json.set("name", name)
        
        return json
    }
}

extension User: ResponseRepresentable { }

// MARK: NODE
extension User: NodeRepresentable { }
