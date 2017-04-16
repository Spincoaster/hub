import PackageDescription

let package = Package(
    name: "recordhub",
    targets: [
         Target(name: "App"),
    ],
    dependencies: [
        .Package(url: "https://github.com/vapor/vapor.git", majorVersion: 1, minor: 5),
        .Package(url: "https://github.com/vapor/postgresql-provider", majorVersion: 1, minor: 1),
        .Package(url: "https://github.com/ReactiveCocoa/ReactiveSwift.git", majorVersion: 1),
        .Package(url: "https://github.com/novi/mecab-swift.git", majorVersion: 0, minor: 2),
    ],
    exclude: [
        "Config",
        "Database",
        "Localization",
        "Public",
        "Resources",
    ]
)

