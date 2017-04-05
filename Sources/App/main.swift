import Vapor
import VaporPostgreSQL

let drop = Droplet(
    providers: [VaporPostgreSQL.Provider.self]
)


drop.get("version") { request in
    if let db = drop.database?.driver as? PostgreSQLDriver {
        let version = try db.raw("SELECT version()")
        return try JSON(node: version)
    } else {
        return "No db connection"
    }
}
/*
drop.get { req in
    return try drop.view.make("welcome", [
        "message": drop.localization[req.lang, "welcome", "title"]
    ])
}*/

drop.resource("posts", PostController())

drop.run()
