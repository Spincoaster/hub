//
//  CrawlNewsCommand.swift
//  App
//
//  Created by Hiroki Kumamoto on 2018/05/16.
//

import Foundation
import Vapor
import PostgreSQLProvider
import Console
import Fluent
import CSV


final class CrawlNewsCommand: Command {
    public let id = "crawl_news"
    public let help = ["This command crawl news."]
    public let console: ConsoleProtocol
    
    public init(console: ConsoleProtocol) {
        self.console = console
    }

    public func run(arguments: [String]) throws {
        console.print("running custom command...")
        
        if let url = getEnvironmentVar("DATABASE_URL") {
            let driver = try PostgreSQLDriver.Driver(url: url)
            Database.default = Database(driver)
            print("DATABASE_URL \(url)")
        } else {
            let driver = try PostgreSQLDriver.Driver(url: "postgresql://postgres::3306/recordhub")
            Database.default = Database(driver)
        }
        try crawl()
    }
    
    func crawl() throws {
        let newsEntries = try getLatestNews()
        for entry in newsEntries {
            if let e = NewsEntry.firstOrCreateBy(newsId: entry.newsId, title: entry.title, url: entry.url, date: entry.date, content: entry.content, thumbnail: entry.thumbnail) {
                print("found new entry \(entry.newsId) \(entry.title)")
            }
        }
    }
    
    func getLatestNews() throws -> [NewsEntry] {
        guard let baseUrl = getEnvironmentVar("NEWS_URL") else {
            return []
        }
        guard let url = URL(string: "\(baseUrl)/wp-json/wp/v2/news") else {
            return []
        }
        let session = URLSession(configuration: URLSessionConfiguration.default)
        let result = session.synchronousDataTask(with: url)
        guard let data = result.data else {
            return []
        }
        let obj = try JSONSerialization.jsonObject(with: data, options: .allowFragments)
        var values: [NewsEntry] = []
        if let items = obj as? Array<[String:Any]> {
            for item in items {
                if let v = NewsEntry(item: item) {
                    try v.fetchThumbnail()
                    values.append(v)
                }
             }
        }
        
        return values
    }

    func getEnvironmentVar(_ name: String) -> String? {
        guard let rawValue = getenv(name) else { return nil }
        return String(utf8String: rawValue)
    }
}
