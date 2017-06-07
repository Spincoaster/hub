import Vapor
import HTTP
import Fluent

final class TrackController: ResourceRepresentable, Pagination {
    typealias E = Track
    func indexQuery(request: Request) throws -> Query<Track> {
        let query = try Track.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                         .join(Album.self, baseKey: "album_id", joinedKey: "id")
                                         .sort(Sort(Artist.self, "phonetic_name", .ascending))
        if let artistId = request.query?["artist_id"]?.int {
            try query.sort("album_id", Sort.Direction.ascending).filter("artist_id", artistId)
        }
        if let albumId = request.query?["album_id"]?.int {
            try query.sort("number", Sort.Direction.ascending).filter("album_id", albumId)
        }
        if let c = request.query?["has_prefix"]?.string {
            try query.filter(Artist.self, "phonetic_name", .hasPrefix, c)
        }
        if let c = request.query?["contains"]?.string {
            try query.or { orGroup in
                    try orGroup.contains(Artist.self, "name", c)
                    try orGroup.contains(Artist.self, "furigana", c)
                    try orGroup.contains(Album.self, "name", c)
                    try orGroup.contains(Album.self, "furigana", c)
                    try orGroup.contains(Track.self, "name", c)
                    try orGroup.contains(Track.self, "furigana", c)
            }
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        var href = "/tracks?"
        if let artistId = request.query?["artist_id"]?.int {
            href += "artist_id=\(artistId)&"
        }
        if let albumId = request.query?["album_id"]?.int {
            href += "album_id=\(albumId)&"
        }
        return href
    }
    func index(request: Request) throws -> ResponseRepresentable {
        request.setRequireLogin()
        guard let currentUser = request.currentUser else {
            return try drop.view.make("error")
        }
        let tracks = try paginate(request: request)
        if tracks.count > 0 {
            let artists = try Artist.makeQuery().filter(Filter(Artist.self, .subset("id", Filter.Scope.in, tracks.map { $0.artistId.makeNode(in: nil) }))).all()
            let albums  = try Album.makeQuery().filter(Filter(Album.self, .subset("id", Filter.Scope.in, tracks.map { $0.albumId.makeNode(in: nil) }))).all()
            Track.setParents(tracks: tracks, albums: albums, artists: artists)
        }
        let parameters = try Node.object([
            "title": getTitle()?.makeNode(in: nil) ?? "",
            "resource_name": "Hi-Res Audio",
            "tracks": tracks.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "pages": pages(request: request),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request),
            "show_phonetic_name": (request.query?["show_phonetic_name"]?.bool ?? false).makeNode(in: nil),
            "current_user": currentUser.makeNode(in: nil),
            ])
        return try drop.view.make("tracks", parameters)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        let record = try request.record()
        try record.save()
        return record
    }
    
    func show(request: Request, track: Track) throws -> ResponseRepresentable {
        return track
    }
    
    func delete(request: Request, track: Track) throws -> ResponseRepresentable {
        try track.delete()
        return JSON([:])
    }
    
    func clear(request: Request) throws -> ResponseRepresentable {
        try Record.makeQuery().delete()
        return JSON([])
    }
    
    func update(request: Request, track: Track) throws -> ResponseRepresentable {
        let new        = try request.track()
        track.number   = new.number
        track.name     = new.name
        track.artistId = new.artistId
        track.albumId  = new.albumId
        try track.save()
        return track
    }
    
    func replace(request: Request, track: Track) throws -> ResponseRepresentable {
        try track.delete()
        return try create(request: request)
    }
    
    func makeResource() -> Resource<Track> {
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
    func track() throws -> Track {
        guard let json = json else { throw Abort.badRequest }
        return try Track(json: json)
    }
}

