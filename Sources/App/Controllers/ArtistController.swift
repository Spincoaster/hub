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
        let query = try Artist.makeQuery().sort(Sort(Artist.self, "name", .ascending))
        if let c = request.query?["has_prefix"]?.string {
            try query.filterByHasPrefix(Artist.self, "name", c)
        }
        if let c = request.query?["contains"]?.string {
            try query.or { orGroup in
                try orGroup.contains(Artist.self, "name", c)
                try orGroup.contains(Artist.self, "furigana", c)
            }
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        return "/artists?"
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let artists = try paginate(request: request)
        let contains: String = request.query?["contains"]?.string ?? "";
        let parameters = try Node.object([
            "title": getTitle()?.makeNode(in: nil) ?? "",
            "home_icon_url": getHomeIconUrl()?.makeNode(in: nil) ?? "",
            "resource_name": "Artist",
            "artists": artists.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "pages": pages(request: request),
            "has_pages": try (pagesCount(request: request) > 1).makeNode(in: nil),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request),
            "menus": menus(request: request),
            "contains": contains.makeNode(in: nil),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
//            "current_user": request.currentUser?.makeNode(in: nil) ?? nil
            ])
        return try drop.view.make("artists", parameters)

    }
    func menus(request: Request) throws -> Node {
        var items: [[String:String]] = []
        for menu in Menu.items {
            if menu["label"] == "Artists" {
                items.append(["href": menu["href"]!,
                            "label":  menu["label"]!,
                            "icon":   menu["icon"]!,
                            "active": "active"])
            } else {
                items.append(menu)
            }
        }
        return try items.makeNode(in: nil)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        let artist = try request.artist()
        try artist.save()
        return artist
    }
    
    func show(request: Request, artist: Artist) throws -> ResponseRepresentable {
        let records = try Record.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                            .sort(Sort(Artist.self, "phonetic_name", .ascending))
                                            .filter("artist_id", artist.id!)
                                            .all()
        if records.count > 0 {
            let artists = try Artist.makeQuery().filter(Filter(Artist.self, .subset("id", Filter.Scope.in, records.map { $0.artistId.makeNode(in: nil) }))).all()
            let owners   = try Owner.makeQuery().filter(Filter(Owner.self, .subset("id", Filter.Scope.in, records.map { $0.ownerId.makeNode(in: nil) }))).all()
            Record.setParents(records: records, owners: owners, artists: artists)
        }
        let albums = try Album.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                          .sort(Sort(Artist.self, "phonetic_name", .ascending))
                                          .filter("artist_id", artist.id!)
                                          .all()
        let parameters = try Node.object([
            "has_records": (records.count > 0).makeNode(in: nil),
            "records": records.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "albums": albums.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "has_albums": (albums.count > 0).makeNode(in: nil),
            "artist": artist.makeLeafNode(),
            "title": getTitle()?.makeNode(in: nil) ?? "",
            "menus": menus(request: request),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
            ])
        return try drop.view.make("artist", parameters)
    }
    
    func delete(request: Request, artist: Artist) throws -> ResponseRepresentable {
        try artist.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try Artist.makeQuery().delete()
        return JSON([])
    }
    
    func update(request: Request, artist: Artist) throws -> ResponseRepresentable {
        let new = try request.artist()
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
            update:  update,
            replace: replace,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func artist() throws -> Artist {
        guard let json = json else { throw Abort.badRequest }
        return try Artist(json: json)
    }
}
