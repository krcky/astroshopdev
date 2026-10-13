// swift-tools-version:5.9
// SkyCore — racun neba i crtez kruga za widget i sat. Isti izvori idu u Xcode
// targete kroz `SkyCore.podspec`; ovaj paket postoji da bi se racun proveravao
// na Mac-u (`npm run check:skycore`) i da bi se krug crtao u PNG bez simulatora.
import PackageDescription

let package = Package(
  name: "SkyCore",
  platforms: [.iOS(.v17), .watchOS(.v10), .macOS(.v14)],
  products: [.library(name: "SkyCore", targets: ["SkyCore"])],
  targets: [
    .target(name: "CAstronomy", cSettings: [.unsafeFlags(["-w"])]),
    .target(name: "SkyCore", dependencies: ["CAstronomy"]),
    .executableTarget(name: "SkyRender", dependencies: ["SkyCore"]),
    .testTarget(name: "SkyCoreTests", dependencies: ["SkyCore"], resources: [.copy("golden.json")]),
  ]
)
