//
//  NewsEntry.swift
//  App
//
//  Created by Hiroki Kumamoto on 2018/05/16.
//

import Foundation
import Vapor
import Fluent
import FluentProvider


public final class NewsEntry: Model {
    public let storage = Storage()
    public var newsId:    Int    = 0
    public var title:     String = ""
    public var url:       String = ""
    public var date:      String = ""
    public var content:   String = ""
    public var thumbnail: String = ""
    
    public init(newsId: Int, title: String, url: String, date: String, content: String, thumbnail: String) {
        self.newsId    = newsId
        self.title     = title
        self.url       = url
        self.date      = date
        self.content   = content
        self.thumbnail = thumbnail
    }

    public init?(item: [String: Any]) {
        let v = ["id", "title", "link", "date", "content"].first(where: { item[$0] == nil })
        if v != nil {
            return nil
        }
        self.newsId = item["id"] as? Int ?? 0
        if let title = item["title"] as? [String:String] {
            self.title = title["rendered"] ?? ""
        }
        self.url = item["link"] as! String
        self.date = item["date"] as! String
        if let content = item["content"] as? [String:String] {
            print("\(content)")
            self.content = content["rendered"] ?? ""
        }
        self.thumbnail = ""
    }

    public init(row: Row) throws {
        self.newsId     = try row.get("newsId")
        self.title      = try row.get("title")
        self.url        = try row.get("url")
        self.date       = try row.get("date")
        self.content    = try row.get("content")
        self.thumbnail  = try row.get("thumbnail")
    }

    public func fetchThumbnail() throws {
        guard let rawValue = getenv("NEWS_URL") else { return }
        guard let baseUrl = String(utf8String: rawValue) else { return }
        guard let url = URL(string: "\(baseUrl)/wp-json/wp/v2/media?parent=\(newsId)") else { return }
        let session = URLSession(configuration: URLSessionConfiguration.default)
        let result = session.synchronousDataTask(with: url)
        guard let data = result.data else {
            return
        }
        let obj = try JSONSerialization.jsonObject(with: data, options: .allowFragments)
        if let items = obj as? [[String:Any]] {
            for item in items {
                if let details = item["media_details"] as? [String:Any] {
                    if let sizes = details["sizes"] as? [String:Any] {
                        if let img = sizes["medium"] as? [String:Any] {
                            if let sourceUrl = img["source_url"] as? String {
                                self.thumbnail = sourceUrl
                                print(sourceUrl)
                            }
                        }
                    }
                }
            }
        }
    }

    public func makeRow() throws -> Row {
        var row = Row()
        try row.set("newsId"   , newsId)
        try row.set("title"    , title)
        try row.set("url"      , url)
        try row.set("date"     , date)
        try row.set("content"  , content)
        try row.set("thumbnail", thumbnail)
        return row
    }
    public static func firstOrCreateBy(newsId: Int, title: String, url: String, date: String, content: String, thumbnail: String) -> NewsEntry? {
        if newsId == 0 {
            return nil
        }
        do {
            if let newsEntry = try NewsEntry.makeQuery().filter("newsId", newsId).first() {
                newsEntry.title     = title
                newsEntry.url       = url
                newsEntry.date      = date
                newsEntry.content   = content
                newsEntry.thumbnail = thumbnail
                try newsEntry.save()
                return newsEntry
            } else {
                let newsEntry = NewsEntry(newsId: newsId, title: title, url: url, date: date, content: content, thumbnail: thumbnail)
                try newsEntry.save()
                return newsEntry
            }
        } catch {
            print(error)
            return nil
        }
    }
    public func makeLeafNode() throws -> Node {
        return try makeJSON().converted()
    }
}

extension NewsEntry: Preparation {
    public static func prepare(_ database: Database) throws {
        try database.create(self) { news in
            news.id()
            news.int("newsId")
            news.string("title")
            news.string("url")
            news.date("date")
            news.string("content")
            news.string("thumbnail")
        }
    }
    
    public static func revert(_ database: Database) throws {
        try database.delete(self)
    }
}

// MARK: JSON
extension NewsEntry: JSONConvertible {
    public convenience init(json: JSON) throws {
        try self.init(
            newsId    : json.get("newsId"),
            title     : json.get("title"),
            url       : json.get("url"),
            date      : json.get("date"),
            content   : json.get("content"),
            thumbnail : json.get("thumbnail")
        )
    }
    
    public func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set("newsId"   , newsId)
        try json.set("title"    , title)
        try json.set("url"      , url)
        try json.set("date"     , date)
        try json.set("content"  , content)
        try json.set("thumbnail", thumbnail)
        return json
    }
}

extension NewsEntry: ResponseRepresentable { }

// MARK: NODE
extension NewsEntry: NodeRepresentable { }

