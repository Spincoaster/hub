import PostgreSQLProvider
import LeafProvider
import Fluent
import Console
import BrowserMethodMiddlewareProvider

let config = try Config()
try config.addProvider(PostgreSQLProvider.Provider.self)
try config.addProvider(LeafProvider.Provider.self)
try config.addProvider(BrowserMethodMiddlewareProvider.Provider.self)

config.preparations.append(Owner.self)
config.preparations.append(Artist.self)
config.preparations.append(Record.self)
config.preparations.append(Genre.self)
config.preparations.append(Pivot<Genre, Record>.self)
config.preparations.append(Album.self)
config.preparations.append(Track.self)
config.preparations.append(Feature.self)
config.preparations.append(FeaturedItem.self)
config.preparations.append(NewsEntry.self)
config.preparations.append(AddExternalLinkToFeature.self)
config.preparations.append(AddCategoryToFeature.self)

let console: ConsoleProtocol = Terminal(arguments: CommandLine.arguments)
let commands: [Command] = [
    ImportRecordsCommand(console: console),
    ImportTracksCommand(console: console),
    CrawlNewsCommand(console: console),
]
let drop = try Droplet(config: config, commands: commands)

drop.get("version") { request in
    if let db = drop.database?.driver as? PostgreSQLDriver.Driver {
        let version = try db.raw("SELECT version()")
        return JSON(node: version)
    } else {
        return "No db connection"
    }
}

var root: RouteBuilder = drop
root.resource("records" , RecordController())
root.resource("artists" , ArtistController())
root.resource("owners"  , OwnerController())
root.resource("genres"  , GenreController())
root.resource("artists" , ArtistController())
root.resource("albums"  , AlbumController())
root.resource("tracks"  , TrackController())
root.resource("features", FeatureController(mode: .member))
root.get("search", handler: SearchController().search)
root.get("top"   , handler: TopController().show)

let admin = drop.grouped([BasicAuthMiddleware()])
admin.resource("admin/features"      ,  FeatureController(mode: .admin))
admin.resource("admin/featured_items", FeaturedItemController())
admin.get("admin/search", handler: SearchController().searchApi)

drop.get("/") { request in
    return Response(redirect: "/top")
}

try drop.run()
