//
//  Filter.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/06/07.
//
//

import Foundation
import Fluent

extension Query {
    @discardableResult
    public func contains<T: Entity> (_ entity: T.Type, _ field: String, _ value: String) throws -> Query {
        let node = "%\(value)%".makeNode(in: nil)
        return try self.filter(Filter(entity, .compare(field, .custom("ILIKE"), node)))
    }
}
