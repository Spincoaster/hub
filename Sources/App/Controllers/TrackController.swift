import Vapor
import HTTP
import Fluent
import Lib

final class TrackController: ResourceRepresentable, Pagination {
    typealias E = Track
    func indexQuery(request: Request) throws -> Query<Track> {
        let query = try Track.query()
        if let artistId = request.query?["artist_id"]?.int {
            try query.sort("album_id", Sort.Direction.ascending).filter("artist_id", artistId)
        }
        if let albumId = request.query?["album_id"]?.int {
            try query.sort("number", Sort.Direction.ascending).filter("album_id", albumId)
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
        let tracks = try paginate(request: request)
        if tracks.count > 0 {
            let artists = try Artist.query().filter("id", Filter.Scope.in, tracks.map { $0.artistId }).all()
            let albums  = try Album.query().filter("id", Filter.Scope.in, tracks.map { $0.albumId }).all()
            Track.setParents(tracks: tracks, albums: albums, artists: artists)
        }
        let parameters = try Node.object([
            "tracks": tracks.map { try $0.makeLeafNode() }.makeNode(),
            "pages": pages(request: request)
            ])
        return try drop.view.make("tracks", parameters)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        var record = try request.record()
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
        try Record.query().delete()
        return JSON([])
    }
    
    func update(request: Request, track: Track) throws -> ResponseRepresentable {
        let new         = try request.track()
        var track       = track
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
            replace: replace,
            modify:  update,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func track() throws -> Track {
        guard let json = json else { throw Abort.badRequest }
        return try Track(node: json)
    }
}

