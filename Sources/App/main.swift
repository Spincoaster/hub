import PostgreSQLProvider
import LeafProvider
import Fluent
import Console

let config = try Config()
try config.addProvider(PostgreSQLProvider.Provider.self)
try config.addProvider(LeafProvider.Provider.self)

config.preparations.append(Owner.self)
config.preparations.append(Artist.self)
config.preparations.append(Record.self)
config.preparations.append(Genre.self)
config.preparations.append(Pivot<Genre, Record>.self)
config.preparations.append(Album.self)
config.preparations.append(Track.self)

let console: ConsoleProtocol = Terminal(arguments: CommandLine.arguments)
let commands: [Command] = [
    ImportReordsCommand(console: console),
    ImportTracksCommand(console: console)
]
let drop = try Droplet(config: config, commands: commands)

drop.get("version") { request in
    if let db = drop.database?.driver as? PostgreSQLDriver.Driver {
        let version = try db.raw("SELECT version()")
        return try JSON(node: version)
    } else {
        return "No db connection"
    }
}

let auth = drop.grouped([BasicAuthMiddleware()])

auth.resource("records", RecordController())
auth.resource("artists", ArtistController())
auth.resource("owners" , OwnerController())
auth.resource("genres" , GenreController())
auth.resource("artists", ArtistController())
auth.resource("albums" , AlbumController())
auth.resource("tracks" , TrackController())
drop.get("/") { request in
    return Response(redirect: "/records")
}
try drop.run()
