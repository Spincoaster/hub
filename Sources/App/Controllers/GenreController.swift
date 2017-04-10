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
import Lib

final class GenreController: ResourceRepresentable {
    func index(request: Request) throws -> ResponseRepresentable {
        let genres = try Genre.all().makeNode()
        let parameters = try Node(node: ["genres": genres])
        return try drop.view.make("genres", parameters)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        var genre = try request.artist()
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
        try Genre.query().delete()
        return JSON([])
    }
    
    func update(request: Request, genre: Genre) throws -> ResponseRepresentable {
        let new = try request.genre()
        var genre  = genre
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
            replace: replace,
            modify:  update,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func genre() throws -> Genre {
        guard let json = json else { throw Abort.badRequest }
        return try Genre(node: json)
    }
}
