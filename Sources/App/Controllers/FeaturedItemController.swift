//
//  FeaturedItemController.swift
//  App
//
//  Created by Hiroki Kumamoto on 2017/10/15.
//

import Foundation

import Vapor
import HTTP
import Fluent

final class FeaturedItemController: ResourceRepresentable {
    typealias E = FeaturedItem

    func create(request: Request) throws -> ResponseRepresentable {
        guard let _ = request.currentUser else { return try drop.view.make("error") }
        let featuredItem = try request.featuredItem()
        try featuredItem.save()
        return featuredItem
    }

    func delete(request: Request, featuredItem: FeaturedItem) throws -> ResponseRepresentable {
        guard let _ = request.currentUser else { return try drop.view.make("error") }
        guard let id = featuredItem.id else { return JSON([:]) }
        try FeaturedItem.makeQuery().filter(Filter(FeaturedItem.self, .compare("feature_id", .equals, Node(id)))).delete()
        try featuredItem.delete()
        return JSON([:])
    }

    func makeResource() -> Resource<FeaturedItem> {
        let resource = Resource(
            store:   create,
            destroy: delete
        )
        return resource
    }
}

extension Request {
    func featuredItem() throws -> FeaturedItem {
        guard let data      = formURLEncoded            else { throw Abort.badRequest }
        guard let featureId = data["feature_id"]?.int   else { throw Abort.badRequest }
        guard let itemId    = data["item_id"]?.int      else { throw Abort.badRequest }
        guard let itemType  = data["item_type"]?.string else { throw Abort.badRequest }
        guard let number    = data["number"]?.int       else { throw Abort.badRequest }
        return FeaturedItem(featureId: Identifier(.number(.int(featureId)), in: nil),
                               itemId: Identifier(.number(.int(itemId)), in: nil),
                             itemType: itemType,
                               number: number)
    }
}
