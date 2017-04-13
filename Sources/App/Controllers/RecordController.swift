import Vapor
import HTTP
import Fluent
import Lib


final class RecordController: ResourceRepresentable {
    func index(request: Request) throws -> ResponseRepresentable {
        let query      = try Record.query().sort("title", Sort.Direction.ascending)
        let countQuery = try Record.query()
        let offset     = request.query?["offset"]?.int ?? 0
        let limit      = request.query?["limit"]?.int ?? 100
        var href       = "/records?"
        if let artistId = request.query?["artist_id"]?.int {
            href += "artist_id=\(artistId)&"
            try query.filter("artist_id", artistId)
            try countQuery.filter("artist_id", artistId)
        }
        if let userId = request.query?["user_id"]?.int {
            href += "user_id=\(userId)&"
            try query.filter("user_id", userId)
            try countQuery.filter("user_id", userId)
        }
        let records = try query.limit(limit, withOffset: offset).all()
        if records.count > 0 {
            let artists = try Artist.query().filter("id", Filter.Scope.in, records.map { $0.artistId }).all()
            let users   = try User.query().filter("id", Filter.Scope.in, records.map { $0.userId }).all()
            Record.setParents(records: records, users: users, artists: artists)
        }
        let count = try countQuery.count()
        let currentPage = offset / limit
        let pages = try (0...Int(count / limit)).map { i in
            return try [
                "label": "\(i+1)",
                "active": currentPage == i ? "active" : "",
                "href": "\(href)offset=\(i * limit)&limit=\(limit)",
            ].makeNode()
        }
        let parameters = try Node.object([
            "records": records.map { try $0.makeLeafNode() }.makeNode(),
            "pages": pages.makeNode()
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
        record.title    = new.title
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
