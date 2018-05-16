//
//  URLSession+sync.swift
//  App
//
//  Created by Hiroki Kumamoto on 2018/05/16.
//

import Foundation

extension URLSession {
    func synchronousDataTask(with request:URLRequest) -> (data:Data?, response:URLResponse?, error:Error?) {
        let semaphore = DispatchSemaphore(value: 0)
        var _dat : Data?
        var _res : URLResponse?
        var _err : Error?
        self.dataTask(with: request) { dat, res, err in
            _dat = dat; _res = res; _err = err
            semaphore.signal()
            }.resume()
        _ = semaphore.wait(timeout: .distantFuture)
        return (_dat, _res, _err)
    }
    
    func synchronousDataTask(with url:URL) -> (data:Data?, response:URLResponse?, error:Error?) {
        return self.synchronousDataTask(with: URLRequest(url: url))
    }
}
