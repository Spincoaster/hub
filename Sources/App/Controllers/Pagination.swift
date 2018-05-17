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
import FluentProvider

class Menu {
    static let items: [[String:String]] = [
      ["href": "/top", "icon": "home", "label":"Top", "active": ""],
      ["href": "/features", "icon": "collections_bookmark", "label": "Feature", "active": ""],
      ["href": "/artists?has_prefix=a", "icon": "assignment_ind", "label":"Artists", "active": ""],
//      ["href": "./albums" , "icon": "library_music" , "label":"Albums" , "active": ""],
      ["href": "/records?has_prefix=a", "icon": "album"         , "label":"Records", "active": ""],
      ["href": "/tracks?has_prefix=a" , "icon": "high_quality"  , "label":"Hi-Res" , "active": ""],
      ["href": "/owners" , "icon": "perm_identity" , "label":"Owners" , "active": ""]
    ]
    static let adminItems: [[String:String]] = [
        ["href": "/top", "icon": "home", "label":"Top", "active": ""],
        ["href": "/admin/features", "icon": "face", "label":"Features", "active": ""],
    ]
}

protocol Pagination {
    associatedtype E: Entity
    func indexQuery(request: Request) throws -> Query<E>
    func indexPath(request: Request) throws -> String
    func pages(request: Request) throws -> Node
    func pagesWithInitialLetter(request: Request) throws -> Node
    func menus(request: Request) throws -> Node
}

extension Pagination {
    public func paginate(request: Request) throws -> [E] {
        let offset = request.query?["offset"]?.int ?? 0
        let limit  = request.query?["limit"]?.int ?? 500
        return try indexQuery(request: request).limit(limit, offset: offset).all()
    }
    public func pages(request: Request) throws -> Node {
        let offset  = request.query?["offset"]?.int ?? 0
        let limit   = request.query?["limit"]?.int ?? 500
        var href    = try indexPath(request: request)
        let count   = try indexQuery(request: request).count()
        let currentPage = offset / limit
        let lastPage = Int(count / limit)
        if let prefix = request.query?["has_prefix"]?.string {
            href += "has_prefix=\(prefix)&"
        }
        let pages = try (0...lastPage).map { i in
            return try [
                "label": "\(i+1)",
                "active": currentPage == i ? "active" : "",
                "href": "\(href)offset=\(i * limit)&limit=\(limit)",
                ].makeNode(in: nil)
        }
        return try pages.makeNode(in: nil)
    }
    public func pagesCount(request: Request) throws -> Int {
        let limit   = request.query?["limit"]?.int ?? 500
        let count   = try indexQuery(request: request).count()
        let lastPage = Int(count / limit)
        return lastPage
    }
    public func pagesWithInitialLetter(request: Request) throws -> Node {
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZあかさたなはまやらわ＃"
        let currentLetter = request.query?["has_prefix"]?.string ?? ""
        let href    = try indexPath(request: request)
        let pages = try letters.map { c in
            return try [
                "label": "\(c)",
                "active": currentLetter.uppercased() == String(c) ? "active" : "",
                "href": "\(href)has_prefix=\(String(c).lowercased())",
                ].makeNode(in: nil)
        }
        return try pages.makeNode(in: nil)
    }
}
