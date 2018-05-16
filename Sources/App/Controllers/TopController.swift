//
//  TopController.swift
//  App
//
//  Created by Hiroki Kumamoto on 2017/10/12.
//

import Foundation
import Vapor
import HTTP
import Fluent

final class TopController: HTMLController {
    func menus(request: Request) throws -> Node {
        var items: [[String:String]] = []
        for menu in Menu.items {
            if menu["label"] == "Top" {
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
    func show(_ request: Request) throws -> ResponseRepresentable {
        let features = try Feature.makeQuery()
                                  .filter(Filter(Feature.self, .compare("number", .greaterThanOrEquals, 0)))
                                  .sort("number", Sort.Direction.descending).all()
        try Feature.setItems(features: features)
        let parameters = Node.object([
            "title": getTitle().makeNode(in: nil),
            "google_analytics_id": getGoogleAnalyticsId().makeNode(in: nil),
            "home_icon_url": getHomeIconUrl().makeNode(in: nil),
            "features": try features.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "menus": try menus(request: request)
            ])
        return try drop.view.make("top", parameters)
    }
}
