import PackageDescription

var dependencies: [Package.Dependency] = [
    .Package(url: "https://github.com/vapor/vapor.git", majorVersion: 2),
    .Package(url: "https://github.com/vapor/fluent-provider.git", majorVersion: 1),
    .Package(url: "https://github.com/vapor-community/postgresql-provider.git", majorVersion: 2, minor: 0),
    .Package(url: "https://github.com/vapor/node.git", majorVersion: 2),
    .Package(url: "https://github.com/vapor/leaf-provider.git", majorVersion: 1),
    .Package(url: "https://github.com/ReactiveCocoa/ReactiveSwift.git", majorVersion: 1),
    .Package(url: "https://github.com/yaslab/CSV.swift.git", majorVersion: 1, minor: 1),
]

#if os(OSX)
    dependencies.append(.Package(url: "https://github.com/novi/mecab-swift.git", majorVersion: 0, minor: 2))
#endif

let package = Package(
    name: "recordhub",
    targets: [
         Target(name: "App"),
    ],
    dependencies: dependencies,
    exclude: [
        "Config",
        "Database",
        "Localization",
        "Public",
        "Resources",
    ]
)

