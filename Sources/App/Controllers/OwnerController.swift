//
//  OwnerController.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation

import Vapor
import HTTP
import Fluent

final class OwnerController: ResourceRepresentable,  Pagination {
    func indexQuery(request: Request) throws -> Query<Owner> {
        let query = try Owner.makeQuery().sort("name", Sort.Direction.ascending)
        if let c = request.query?["has_prefix"]?.string {
            try query.filter("name", .hasPrefix, c)
        }
        if let c = request.query?["contains"]?.string {
            try query.contains(Owner.self, "name", c)
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        return "/owners?"
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let owners = try paginate(request: request)
        let parameters = try Node.object([
            "title": getTitle()?.makeNode(in: nil) ?? "",
            "home_icon_url": getHomeIconUrl()?.makeNode(in: nil) ?? "",
            "resource_name": "Owner",
            "owners": owners.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "pages": pages(request: request),
            "current_user": request.currentUser?.makeNode(in: nil) ?? nil
            ])
        return try drop.view.make("owners", parameters)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        let owner = try request.owner()
        try owner.save()
        return owner
    }
    
    func show(request: Request, owner: Owner) throws -> ResponseRepresentable {
        return owner
    }
    
    func delete(request: Request, owner: Owner) throws -> ResponseRepresentable {
        try owner.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try Owner.makeQuery().delete()
        return JSON([])
    }
    
    func update(request: Request, owner: Owner) throws -> ResponseRepresentable {
        let new = try request.owner()
        owner.name = new.name
        try owner.save()
        return owner
    }
    
    func replace(request: Request, owner: Owner) throws -> ResponseRepresentable {
        try owner.delete()
        return try create(request: request)
    }
    
    func makeResource() -> Resource<Owner> {
        return Resource(
            index:   index,
            store:   create,
            show:    show,
            update:  update,
            replace: replace,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func owner() throws -> Owner {
        guard let json = json else { throw Abort.badRequest }
        return try Owner(json: json)
    }
}
