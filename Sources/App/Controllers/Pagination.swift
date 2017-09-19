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

class Menu {
    static let items: [[String:String]] = [
      ["href": "./artists", "icon": "assignment_ind", "label":"Artists", "active": ""],
//      ["href": "./albums" , "icon": "library_music" , "label":"Albums" , "active": ""],
      ["href": "./records", "icon": "album"         , "label":"Records", "active": ""],
      ["href": "./tracks" , "icon": "high_quality"  , "label":"Hi-Res" , "active": ""],
      ["href": "./owners" , "icon": "perm_identity" , "label":"Owners" , "active": ""]
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
    public func getPrefix(_ request: Request) -> String? {
        if let prefix = request.query?["has_prefix"]?.string {
            return prefix
        } else if request.query?["contains"] == nil {
            return "a"
        } else {
            return nil
        }
    }
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
        if let prefix = getPrefix(request) {
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
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let currentLetter = getPrefix(request) ?? ""
        let href    = try indexPath(request: request)
        let pages = try letters.characters.map { c in
            return try [
                "label": "\(c)",
                "active": currentLetter.uppercased() == String(c) ? "active" : "",
                "href": "\(href)has_prefix=\(String(c).lowercased())",
                ].makeNode(in: nil)
        }
        return try pages.makeNode(in: nil)
    }
    func getTitle() -> String? {
        guard let rawValue = getenv("APP_NAME") else { return nil }
        return String(utf8String: rawValue)
    }
    func getHomeIconUrl() -> String? {
        guard let rawValue = getenv("HOME_ICON_URL") else { return nil }
        return String(utf8String: rawValue)
    }
}
