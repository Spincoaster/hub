import Vapor
import VaporPostgreSQL
import Fluent

let drop = Droplet(
    providers: [VaporPostgreSQL.Provider.self]
)

drop.preparations.append(Record.self)
drop.preparations.append(Artist.self)
drop.preparations.append(User.self)
drop.preparations.append(Genre.self)
drop.preparations.append(Pivot<Genre, Record>.self)
drop.preparations.append(Album.self)
drop.preparations.append(Track.self)

drop.get("version") { request in
    if let db = drop.database?.driver as? PostgreSQLDriver {
        let version = try db.raw("SELECT version()")
        return try JSON(node: version)
    } else {
        return "No db connection"
    }
}

drop.resource("records", RecordController())
drop.resource("artists", ArtistController())
drop.resource("users"  , UserController())
drop.resource("genres" , GenreController())
drop.resource("albums" , AlbumController())
drop.resource("tracks" , TrackController())

drop.run()
