import Vapor
import HTTP
import Fluent
import Lib

final class AlbumController: ResourceRepresentable, Pagination {
    typealias E = Album
    func indexQuery(request: Request) throws -> Query<Album> {
        let query = try Album.query().sort("name", Sort.Direction.ascending)
        if let artistId = request.query?["artist_id"]?.int {
            try query.filter("artist_id", artistId)
        }
        if let c = request.query?["has_prefix"]?.string {
            try query.filter("phonetic_name", .hasPrefix, c)
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
            let artists = try Artist.query().filter("id", Filter.Scope.in, albums.map { $0.artistId }).all()
            Album.setParents(albums: albums, artists: artists)
        }
        let parameters = try Node.object([
            "albums": albums.map { try $0.makeLeafNode() }.makeNode(),
            "pages": pages(request: request),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request)
        ])
        return try drop.view.make("albums", parameters)
        
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        var album = try request.album()
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
        try Album.query().delete()
        return JSON([])
    }
    
    func update(request: Request, album: Album) throws -> ResponseRepresentable {
        let new = try request.album()
        var album  = album
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
            replace: replace,
            modify:  update,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func album() throws -> Album {
        guard let json = json else { throw Abort.badRequest }
        return try Album(node: json)
    }
}
