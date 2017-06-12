import Vapor
import HTTP
import Fluent

final class RecordController: ResourceRepresentable, Pagination {
    func indexQuery(request: Request) throws -> Query<Record> {
        let query = try Record.makeQuery().join(Artist.self, baseKey: "artist_id", joinedKey: "id")
                                          .join(Owner.self, baseKey: "owner_id", joinedKey: "id")
                                          .sort(Sort(Artist.self, "phonetic_name", .ascending))
        if let artistId = request.query?["artist_id"]?.int {
            try query.filter("artist_id", artistId)
        }
        if let ownerId = request.query?["owner_id"]?.int {
            try query.filter("owner_id", ownerId)
        }
        if let c = request.query?["has_prefix"]?.string {
            try query.filter(Artist.self, "phonetic_name", .hasPrefix, c)
        }
        if let c = request.query?["contains"]?.string {
            try query.or { orGroup in
                    try orGroup.contains(Owner.self,  "name", c)
                    try orGroup.contains(Artist.self, "name", c)
                    try orGroup.contains(Artist.self, "furigana", c)
                    try orGroup.contains(Record.self, "name", c)
                    try orGroup.contains(Record.self, "furigana", c)
                    try orGroup.contains(Record.self, "comment", c)
            }
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        var href = "/records?"
        if let artistId = request.query?["artist_id"]?.int {
            href += "artist_id=\(artistId)&"
        }
        if let ownerId = request.query?["owner_id"]?.int {
            href += "owner_id=\(ownerId)&"
        }
        return href
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let records = try paginate(request: request)
        if records.count > 0 {
            let artists = try Artist.makeQuery().filter(Filter(Artist.self, .subset("id", Filter.Scope.in, records.map { $0.artistId.makeNode(in: nil) }))).all()
            let owners   = try Owner.makeQuery().filter(Filter(Owner.self, .subset("id", Filter.Scope.in, records.map { $0.ownerId.makeNode(in: nil) }))).all()
            Record.setParents(records: records, owners: owners, artists: artists)
        }
        let contains = request.query?["contains"]?.string ?? "";
        let parameters = try Node.object([
            "title": getTitle()?.makeNode(in: nil) ?? "",
            "home_icon_url": getHomeIconUrl()?.makeNode(in: nil) ?? "",
            "resource_name": "Record",
            "records": try records.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "pages": pages(request: request),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request),
            "menus": menus(request: request),
            "contains": contains.makeNode(in: nil),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
            "current_user": request.currentUser?.makeNode(in: nil) ?? nil
            ])
        return try drop.view.make("records", parameters)
    }
    func menus(request: Request) throws -> Node {
        var items: [[String:String]] = []
        for menu in Menu.items {
            if menu["label"] == "Records" {
                items.append(["href":   menu["href"]!,
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
        let record = try request.record()
        try record.save()
        return record
    }

    func show(request: Request, record: Record) throws -> ResponseRepresentable {
        return record
    }

    func delete(request: Request, record: Record) throws -> ResponseRepresentable {
        try record.delete()
        return JSON([:])
    }

    func clear(request: Request) throws -> ResponseRepresentable {
        try Record.makeQuery().delete()
        return JSON([])
    }

    func update(request: Request, record: Record) throws -> ResponseRepresentable {
        let new         = try request.record()
        record.number   = new.number
        record.name     = new.name
        record.comment  = new.comment
        record.artistId = new.artistId
        try record.save()
        return record
    }

    func replace(request: Request, record: Record) throws -> ResponseRepresentable {
        try record.delete()
        return try create(request: request)
    }

    func makeResource() -> Resource<Record> {
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
    func record() throws -> Record {
        guard let json = json else { throw Abort.badRequest }
        return try Record(json: json)
    }
}
