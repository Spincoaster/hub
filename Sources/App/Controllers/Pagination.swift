//
//  Pagination.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/13.
//
//

import Foundation
import Vapor
import HTTP
import Fluent

protocol Pagination {
    associatedtype E: Entity
    func indexQuery(request: Request) throws -> Query<E>
    func indexPath(request: Request) throws -> String
    func pages(request: Request) throws -> Node
    func pagesWithInitialLetter(request: Request) throws -> Node
}

extension Pagination {
    public func paginate(request: Request) throws -> [E] {
        let offset = request.query?["offset"]?.int ?? 0
        let limit  = request.query?["limit"]?.int ?? 100
        return try indexQuery(request: request).limit(limit, offset: offset).all()
    }
    public func pages(request: Request) throws -> Node {
        let offset  = request.query?["offset"]?.int ?? 0
        let limit   = request.query?["limit"]?.int ?? 100
        let href    = try indexPath(request: request)
        let count   = try indexQuery(request: request).count()
        let currentPage = offset / limit
        let lastPage = Int(count / limit)
        let pages = try (0...lastPage).map { i in
            return try [
                "label": "\(i+1)",
                "active": currentPage == i ? "active" : "",
                "href": "\(href)offset=\(i * limit)&limit=\(limit)",
                ].makeNode(in: nil)
        }
        return try pages.makeNode(in: nil)
    }
    public func pagesWithInitialLetter(request: Request) throws -> Node {
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let href    = try indexPath(request: request)
        let pages = try letters.characters.map { c in
            return try [
                "label": "\(c)",
                "active": "",
                "href": "\(href)has_prefix=\(String(c).lowercased())",
                ].makeNode(in: nil)
        }
        return try pages.makeNode(in: nil)
    }
    func getTitle() -> String? {
        guard let rawValue = getenv("APP_NAME") else { return nil }
        return String(utf8String: rawValue)
    }
}
