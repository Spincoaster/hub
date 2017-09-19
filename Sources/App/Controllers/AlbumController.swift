import Vapor
import HTTP
import Fluent

final class AlbumController: ResourceRepresentable, Pagination {
    typealias E = Album
    func indexQuery(request: Request) throws -> Query<Album> {
        let query = try Album.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                         .sort(Sort(Artist.self, "phonetic_name", .ascending))
        if let artistId = request.query?["artist_id"]?.int {
            try query.filter("artist_id", artistId)
        }
        let c = request.query?["has_prefix"]?.string ?? "a"
        try query.filter(Artist.self, "phonetic_name", .hasPrefix, c)
        if let c = request.query?["contains"]?.string {
            let _ = try query.or { orGroup in
                try orGroup.contains(Artist.self, "name", c)
                try orGroup.contains(Artist.self, "furigana", c)
                try orGroup.contains(Album.self, "name", c)
                try orGroup.contains(Album.self, "furigana", c)
            }
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        var href = "/albums?"
        if let artistId = request.query?["artist_id"]?.int {
            href += "artist_id=\(artistId)&"
        }
        return href
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let albums = try paginate(request: request)
        if albums.count > 0 {
            let artists = try Artist.makeQuery().filter(Filter(Artist.self, .subset("id", .in, albums.map { $0.artistId.makeNode(in: nil) }))).all()
            Album.setParents(albums: albums, artists: artists)
        }
        let contains: String = request.query?["contains"]?.string ?? "";
        let parameters = try Node.object([
            "title": getTitle()?.makeNode(in: nil) ?? "",
            "home_icon_url": getHomeIconUrl()?.makeNode(in: nil) ?? "",
            "resource_name": "Album",
            "albums": albums.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "pages": pages(request: request),
            "has_pages": try (pagesCount(request: request) > 1).makeNode(in: nil),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request),
            "menus": menus(request: request),
            "contains": contains.makeNode(in: nil),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
            "current_user": request.currentUser?.makeNode(in: nil) ?? nil
        ])
        return try drop.view.make("albums", parameters)
    }
    func menus(request: Request) throws -> Node {
        var items: [[String:String]] = []
        for menu in Menu.items {
            if menu["label"] == "Albums" {
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
        let album = try request.album()
        try album.save()
        return album
    }
    
    func show(request: Request, album: Album) throws -> ResponseRepresentable {
        return album
    }
    
    func delete(request: Request, album: Album) throws -> ResponseRepresentable {
        try album.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try Album.makeQuery().delete()
        return JSON([])
    }
    
    func update(request: Request, album: Album) throws -> ResponseRepresentable {
        let new = try request.album()
        album.name = new.name
        try album.save()
        return album
    }
    
    func replace(request: Request, album: Album) throws -> ResponseRepresentable {
        try album.delete()
        return try create(request: request)
    }
    
    func makeResource() -> Resource<Album> {
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
    func album() throws -> Album {
        guard let json = json else { throw Abort.badRequest }
        return try Album(json: json)
    }
}
