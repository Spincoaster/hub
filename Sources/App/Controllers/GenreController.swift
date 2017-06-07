//
//  GenreController.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation
import Vapor
import HTTP
import Fluent

final class GenreController: ResourceRepresentable {
    func index(request: Request) throws -> ResponseRepresentable {
        let genres = try Genre.all().makeNode(in: nil)
        let parameters = try Node(node: ["genres": genres])
        return try drop.view.make("genres", parameters)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        let genre = try request.artist()
        try genre.save()
        return genre
    }
    
    func show(request: Request, genre: Genre) throws -> ResponseRepresentable {
        return genre
    }
    
    func delete(request: Request, genre: Genre) throws -> ResponseRepresentable {
        try genre.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try Genre.makeQuery().delete()
        return JSON([])
    }
    
    func update(request: Request, genre: Genre) throws -> ResponseRepresentable {
        let new = try request.genre()
        genre.name = new.name
        try genre.save()
        return genre
    }
    
    func replace(request: Request, genre: Genre) throws -> ResponseRepresentable {
        try genre.delete()
        return try create(request: request)
    }
    
    func makeResource() -> Resource<Genre> {
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
    func genre() throws -> Genre {
        guard let json = json else { throw Abort.badRequest }
        return try Genre(json: json)
    }
}
