import PackageDescription

let package = Package(
    name: "recordhub",
    targets: [
        Target(name: "Lib"),
        Target(name: "App",  dependencies: [.Target(name: "Lib")]),
        Target(name: "ImportRecords", dependencies: [.Target(name: "Lib")]),
        Target(name: "ImportTracks", dependencies: [.Target(name: "Lib")]),
    ],
    dependencies: [
        .Package(url: "https://github.com/vapor/vapor.git", majorVersion: 1, minor: 5),
        .Package(url: "https://github.com/vapor/postgresql-provider", majorVersion: 1, minor: 0),
        .Package(url: "https://github.com/ReactiveCocoa/ReactiveSwift.git", majorVersion: 1),
    ],
    exclude: [
        "Config",
        "Database",
        "Localization",
        "Public",
        "Resources",
    ]
)

