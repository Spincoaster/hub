//
//  Array+get.swift
//  recordhub
//
//  Created by Hiroki Kumamoto on 2017/04/16.
//
//

import Foundation

public extension Array {
    func get(_ index: Int) -> Element? {
        if index < self.count {
            return self[index]
        }
        return nil
    }
}
