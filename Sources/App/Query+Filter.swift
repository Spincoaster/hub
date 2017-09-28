//
//  Filter.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/06/07.
//
//

import Foundation
import Fluent
import FluentProvider

extension Query {
    @discardableResult
    public func contains<T: Entity> (_ entity: T.Type, _ field: String, _ value: String) throws -> Query {
        let node = "%\(value.trim())%".makeNode(in: nil)
        return try self.filter(Filter(entity, .compare(field, .custom("ILIKE"), node)))
    }
    @discardableResult
    public func filterByHasPrefix<T: Entity> (_ entity: T.Type, _ key: String, _ value: String) throws -> Query {
        let valueToLetters: [String: String] = [
            "あ": "あいうえお",
            "か": "かきくけこ",
            "さ": "さしすせそ",
            "た": "たちつてと",
            "な": "なにぬねの",
            "は": "はひふへほ",
            "ま": "まみむめも",
            "や": "やゆよ",
            "ら": "らりるれろ",
            "わ": "わをん",
            "＃" : "01234567890!$",
            ]
        switch value {
        case "＃", "あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ":
            if let letters = valueToLetters[value] {
                return try or { orGroup in
                    try letters.forEach { try orGroup.filter(T.self, key, .hasPrefix, "\($0)") }
                    try letters.forEach { try orGroup.filter(T.self, "furigana", .hasPrefix, "\($0)") }
                }
            }
            return self
        default:
            return try or { orGroup in
                try orGroup.filter(entity, key, .hasPrefix, value.lowercased())
                try orGroup.filter(entity, key, .hasPrefix, value.uppercased())
            }
        }
    }
}
