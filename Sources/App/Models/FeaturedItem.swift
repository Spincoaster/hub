//
//  FeaturedItem.swift
//  App
//
//  Created by Hiroki Kumamoto on 2017/10/12.
//

import Foundation
import Vapor
import Fluent
import FluentProvider

public final class FeaturedItem: Model {
    public let storage = Storage()
    
    public var id:           Identifier?
    public var featureId:    Identifier
    public var itemId:       Identifier
    public var itemType:     String
    public var number:       Int
    
    public init(featureId: Identifier, itemId: Identifier, itemType: String, number: Int) {
        self.featureId = featureId
        self.itemId    = itemId
        self.itemType  = itemType
        self.number    = number
    }
    
    public init(row: Row) throws {
        featureId = try row.get("feature_id")
        itemId    = try row.get("item_id")
        itemType  = try row.get("item_type")
        number    = try row.get("number")
    }
    
    public func makeRow() throws -> Row {
        var row = Row()
        try row.set("id"        , id)
        try row.set("feature_id", featureId)
        try row.set("item_id"   , itemId)
        try row.set("item_type" , itemType)
        try row.set("number"    , number)
        return row
    }
    
    public func makeLeafNode() throws -> Node {
        return try makeJSON().converted()
    }
}

extension FeaturedItem: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { featuredItems in
            featuredItems.id()
            featuredItems.parent(Feature.self)
            featuredItems.parent(Track.self, optional: true, unique: false, foreignIdKey: "item_id")
            featuredItems.string("item_type")
            featuredItems.int("number")
        }
        try database.raw("CREATE UNIQUE INDEX featured_items_idx ON featured_items (feature_id, item_id, item_type)")
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension FeaturedItem: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            featureId: json.get("featured_id"),
            itemId:    json.get("item_id"),
            itemType:  json.get("item_type"),
            number  :  json.get("number")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("id"        , id)
        try json.set("feature_id", featureId)
        try json.set("item_id"   , itemId)
        try json.set("item_type" , itemType)
        try json.set("number"    , number)
        return json
    }
}

extension FeaturedItem: ResponseRepresentable { }

// MARK: NODE
extension FeaturedItem: NodeRepresentable { }
