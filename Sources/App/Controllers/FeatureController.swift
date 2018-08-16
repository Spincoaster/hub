//
//  FeatureController.swift
//  App
//
//  Created by Hiroki Kumamoto on 2017/10/12.
//

import Foundation

import Vapor
import HTTP
import Fluent

final class FeatureController: ResourceRepresentable, Pagination, HTMLController {
    typealias E = Feature
    enum Mode {
        case admin
        case member
    }
    var mode: Mode
    public init(mode: Mode) {
        self.mode = mode
    }
    func indexQuery(request: Request) throws -> Query<Feature> {
        var query = try Feature.makeQuery()
                               .sort(Sort(Feature.self, "number", .descending))
        if mode != .admin {
            query = try query.filter("number", Filter.Comparison.greaterThanOrEquals, 0)
        }
        return query
    }
    func indexPath(request: Request) throws -> String {
        return "/features?"
    }
    func index(request: Request) throws -> ResponseRepresentable {
        let features = try paginate(request: request)
        let parameters = try Node.object([
            "title": getTitle().makeNode(in: nil),
            "google_analytics_id": getGoogleAnalyticsId().makeNode(in: nil),
            "is_admin": (mode == .admin).makeNode(in: nil),
            "home_icon_url": getHomeIconUrl().makeNode(in: nil),
            "resource_name": "Feature",
            "features": features.map { try $0.makeLeafNode() }.makeNode(in: nil),
            "pages": pages(request: request),
            "has_pages": try (pagesCount(request: request) > 1).makeNode(in: nil),
            "menus": menus(request: request),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
            //            "current_user": request.currentUser?.makeNode(in: nil) ?? nil
            ])
        return try drop.view.make("features", parameters)
        
    }
    func menus(request: Request) throws -> Node {
        var items: [[String:String]] = []
        let menuItems = mode == .admin ? Menu.adminItems : Menu.items
        for menu in menuItems {
            if menu["label"] == "Features" {
                items.append(["href": menu["href"]!,
                              "label":  menu["label"]!,
                              "icon":   menu["icon"]!,
                              "active": "active"])
            } else {
                items.append(menu)
            }
        }
        return try items.makeNode(in: nil)
    }
    func featureParameters(request: Request, feature: Feature) throws -> Node {
        try Feature.setItems(features: [feature])
        let obj: [String: Node] = try [
            "title": getTitle().makeNode(in: nil),
            "google_analytics_id": getGoogleAnalyticsId().makeNode(in: nil),
            "home_icon_url": getHomeIconUrl().makeNode(in: nil),
            "feature": feature.makeLeafNode(),
            "menus": menus(request: request),
            "is_admin": (mode == .admin).makeNode(in: nil),
            "debug": (request.query?["debug"]?.bool ?? false).makeNode(in: nil),
        ]
        return Node.object(obj)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        guard let _ = request.currentUser else { return try drop.view.make("error") }
        let feature = try request.feature()
        try feature.save()
        return feature
    }
    
    func show(request: Request, feature: Feature) throws -> ResponseRepresentable {
        switch mode {
        case .admin:
            guard let _ = request.currentUser else { return try drop.view.make("error") }
            return try drop.view.make("feature_edit", featureParameters(request: request, feature: feature))
        case .member:
            return try drop.view.make("feature", featureParameters(request: request, feature: feature))
        }
    }
    
    func delete(request: Request, feature: Feature) throws -> ResponseRepresentable {
        guard let _ = request.currentUser else { return try drop.view.make("error") }
        guard let id = feature.id else { return JSON([:]) }
        try FeaturedItem.makeQuery().filter(Filter(FeaturedItem.self, .compare("feature_id", .equals, Node(id)))).delete()
        try feature.delete()
        return JSON([:])
    }
    
    func update(request: Request, feature: Feature) throws -> ResponseRepresentable {
        if mode != .admin { throw Abort.unauthorized }
        guard let _ = request.currentUser else { return try drop.view.make("error") }
        let new                   = try request.feature()
        feature.name              = new.name
        feature.number            = new.number
        feature.description       = new.description
        feature.externalLink      = new.externalLink
        feature.externalThumbnail = new.externalThumbnail
        feature.category          = new.category
        try feature.save()
        return try drop.view.make("feature_edit", featureParameters(request: request, feature: feature))
    }

    func makeResource() -> Resource<Feature> {
        let resource = Resource(
            index:   index,
            store:   create,
            show:    show,
            update:  update,
            destroy: delete
        )
        return resource
    }
}

extension Request {
    func feature() throws -> Feature {
        guard let data = formURLEncoded else { throw Abort.badRequest }
        guard let name = data["name"]?.string else { throw Abort.badRequest }
        guard let number = data["number"]?.int else { throw Abort.badRequest }
        let description       = data["description"]?.string ?? ""
        let externalLink      = data["external_link"]?.string ?? ""
        let externalThumbnail = data["external_thumbnail"]?.string ?? ""
        let category          = data["category"]?.string ?? ""
        return Feature(name: name, number: number, description: description, externalLink: externalLink, externalThumbnail: externalThumbnail, category: category)
    }
}
