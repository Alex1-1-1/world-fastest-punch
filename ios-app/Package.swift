// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WorldFastestPunch",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .executable(
            name: "WorldFastestPunch",
            targets: ["WorldFastestPunch"]),
    ],
    dependencies: [
        // 必要に応じて依存関係を追加
    ],
    targets: [
        .executableTarget(
            name: "WorldFastestPunch",
            dependencies: []),
        .testTarget(
            name: "WorldFastestPunchTests",
            dependencies: ["WorldFastestPunch"]),
    ]
)
