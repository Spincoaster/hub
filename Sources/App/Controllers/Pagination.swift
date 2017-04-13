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
}

extension Pagination {
    public func paginate(request: Request) throws -> [E] {
        let offset = request.query?["offset"]?.int ?? 0
        let limit  = request.query?["limit"]?.int ?? 100
        return try indexQuery(request: request).limit(limit, withOffset: offset).all()
    }
    public func pages(request: Request) throws -> Node {
        let offset  = request.query?["offset"]?.int ?? 0
        let limit   = request.query?["limit"]?.int ?? 100
        let href    = try indexPath(request: request)
        let count   = try indexQuery(request: request).count()
        let currentPage = offset / limit
        let pages = try (0...Int(count / limit)).map { i in
            return try [
                "label": "\(i+1)",
                "active": currentPage == i ? "active" : "",
                "href": "\(href)offset=\(i * limit)&limit=\(limit)",
                ].makeNode()
        }
        return try pages.makeNode()
    }
}
