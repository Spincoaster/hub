//
//  UserController.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation

import Vapor
import HTTP
import Fluent

final class UserController: ResourceRepresentable {
    func index(request: Request) throws -> ResponseRepresentable {
        let users = try User.query().sort("name", Sort.Direction.ascending).all().makeNode()
        let parameters = try Node(node: ["users": users])
        return try drop.view.make("users", parameters)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        var user = try request.user()
        try user.save()
        return user
    }
    
    func show(request: Request, user: User) throws -> ResponseRepresentable {
        return user
    }
    
    func delete(request: Request, user: User) throws -> ResponseRepresentable {
        try user.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try User.query().delete()
        return JSON([])
    }
    
    func update(request: Request, user: User) throws -> ResponseRepresentable {
        let new = try request.user()
        var user = user
        user.name   = new.name
        try user.save()
        return user
    }
    
    func replace(request: Request, user: User) throws -> ResponseRepresentable {
        try user.delete()
        return try create(request: request)
    }
    
    func makeResource() -> Resource<User> {
        return Resource(
            index:   index,
            store:   create,
            show:    show,
            replace: replace,
            modify:  update,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func user() throws -> User {
        guard let json = json else { throw Abort.badRequest }
        return try User(node: json)
    }
}
