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
import Lib

final class ArtistController: ResourceRepresentable {
    func index(request: Request) throws -> ResponseRepresentable {
        let artists = try Artist.query().sort("name", Sort.Direction.ascending).all().makeNode()
        let parameters = try Node(node: ["artists": artists])
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
