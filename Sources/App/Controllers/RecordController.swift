import Vapor
import HTTP
import Fluent


final class RecordController: ResourceRepresentable, Pagination {
    func indexQuery(request: Request) throws -> Query<Record> {
        let query = try Record.query().sort("name", Sort.Direction.ascending)
        if let artistId = request.query?["artist_id"]?.int {
            try query.filter("artist_id", artistId)
        }
        if let userId = request.query?["user_id"]?.int {
            try query.filter("user_id", userId)
        }
        if let c = request.query?["has_prefix"]?.string {
            try query.filter("phonetic_name", .hasPrefix, c)
        }
        if let c = request.query?["contains"]?.string {
            let _ = try query.union(Artist.self).or { query in
                let _ = try query.filter(Artist.self, "name", .contains, c).or { query in
                    let _ = try query.filter("name", .contains, c).or { query in
                        let _ = try query.filter("comment", .contains, c)
                    }
                }
            }
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        var href = "/records?"
        if let artistId = request.query?["artist_id"]?.int {
            href += "artist_id=\(artistId)&"
        }
        if let userId = request.query?["user_id"]?.int {
            href += "user_id=\(userId)&"
        }
        return href
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let records = try paginate(request: request)
        if records.count > 0 {
            let artists = try Artist.query().filter("id", Filter.Scope.in, records.map { $0.artistId }).all()
            let users   = try User.query().filter("id", Filter.Scope.in, records.map { $0.userId }).all()
            Record.setParents(records: records, users: users, artists: artists)
        }
        let parameters = try Node.object([
            "records": records.map { try $0.makeLeafNode() }.makeNode(),
            "pages": pages(request: request),
            "pages_with_initial_letter": pagesWithInitialLetter(request: request),
            "show_phonetic_name": (request.query?["show_phonetic_name"]?.bool ?? false).makeNode()
            ])
        return try drop.view.make("records", parameters)
    }

    func create(request: Request) throws -> ResponseRepresentable {
        var record = try request.record()
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
        try Record.query().delete()
        return JSON([])
    }

    func update(request: Request, record: Record) throws -> ResponseRepresentable {
        let new         = try request.record()
        var record      = record
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
            replace: replace,
            modify:  update,
            destroy: delete,
            clear:   clear
        )
    }
}

extension Request {
    func record() throws -> Record {
        guard let json = json else { throw Abort.badRequest }
        return try Record(node: json)
    }
}
