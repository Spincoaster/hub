//
//  ArtistController.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/05.
//
//

import Foundation

import Vapor
import HTTP
import Fluent

final class ArtistController: ResourceRepresentable, Pagination {
    typealias E = Artist
    func indexQuery(request: Request) throws -> Query<Artist> {
        let query = try Artist.query()
        if let c = request.query?["has_prefix"]?.string {
            try query.filter("phonetic_name", .hasPrefix, c)
        }
        if let c = request.query?["contains"]?.string {
            try query.filter("name", .contains, c)
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        return "/artists?"
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let artists = try paginate(request: request)
        let parameters = try Node.object([
            "title": getTitle()?.makeNode() ?? "",
            "resource_name": "Artist",
            "artists": artists.map { try $0.makeNode() }.makeNode(),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request),
            "show_phonetic_name": (request.query?["show_phonetic_name"]?.bool ?? false).makeNode()
            ])
        return try drop.view.make("artists", parameters)

    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        var artist = try request.artist()
        try artist.save()
        return artist
    }
    
    func show(request: Request, artist: Artist) throws -> ResponseRepresentable {
        return artist
    }
    
    func delete(request: Request, artist: Artist) throws -> ResponseRepresentable {
        try artist.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try Artist.query().delete()
        return JSON([])
    }
    
    func update(request: Request, artist: Artist) throws -> ResponseRepresentable {
        let new = try request.artist()
        var artist  = artist
        artist.name = new.name
        try artist.save()
        return artist
    }
    
    func replace(request: Request, artist: Artist) throws -> ResponseRepresentable {
        try artist.delete()
        return try create(request: request)
    }
    
    func makeResource() -> Resource<Artist> {
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
    func artist() throws -> Artist {
        guard let json = json else { throw Abort.badRequest }
        return try Artist(node: json)
    }
}
