// Swift racun protiv racuna aplikacije (`scripts/native/skycore-golden.ts`).
import XCTest
@testable import SkyCore

struct Golden: Decodable {
  struct Planeta: Decodable { let key: String; let lon, brzina: Double; let kuca: Int; let znak: String; let deg, min: Int }
  struct Aspekt: Decodable { let key: String; let orb: Double }
  struct Slucaj: Decodable {
    let unix: Double; let mesto: String; let lat, lon: Double
    let planete: [Planeta]
    let obliquity, ramc, asc, mc: Double
    let kuspide: [Double]; let fellBack: Bool
    let cvor, cvorBrzina, lilit, sreca, faza: Double
    let aspekti: [Aspekt]
    let razmaknuto: [Double]
  }
  let slucajevi: [Slucaj]
}

final class SkyCoreTests: XCTestCase {
  /// Dozvoljeno odstupanje, u stepenima. Kriterijum iz specifikacije je 0,1°;
  /// ista biblioteka u C-u i JS-u se u praksi slaze na milioniti deo stepena.
  let tol = 1e-6
  var najvece = 0.0

  func ugao(_ a: Double, _ b: Double, _ sta: String, file: StaticString = #filePath, line: UInt = #line) {
    let d = abs(angleDelta(a, b))
    najvece = max(najvece, d)
    XCTAssertLessThan(d, tol, sta, file: file, line: line)
  }

  func testProtivAplikacije() throws {
    let url = try XCTUnwrap(Bundle.module.url(forResource: "golden", withExtension: "json"))
    let golden = try JSONDecoder().decode(Golden.self, from: Data(contentsOf: url))
    XCTAssertGreaterThan(golden.slucajevi.count, 40)

    for s in golden.slucajevi {
      let date = Date(timeIntervalSince1970: s.unix)
      let sky = buildSky(at: date, place: Place(latitude: s.lat, longitude: s.lon))
      let houses = try XCTUnwrap(sky.houses)
      let gde = "\(s.mesto) \(s.unix)"

      XCTAssertEqual(sky.planets.map(\.key), s.planete.map(\.key), "redosled tela, \(gde)")
      for (p, g) in zip(sky.planets, s.planete) {
        ugao(p.longitude, g.lon, "\(g.key) longituda, \(gde)")
        XCTAssertEqual(p.speed, g.brzina, accuracy: 1e-5, "\(g.key) brzina, \(gde)")
        XCTAssertEqual(houses.house(of: p.longitude), g.kuca, "\(g.key) kuca, \(gde)")
        XCTAssertEqual(SIGN_KEYS[p.position.signIndex], g.znak, "\(g.key) znak, \(gde)")
        XCTAssertEqual(p.position.deg, g.deg, "\(g.key) stepen, \(gde)")
        XCTAssertEqual(p.position.min, g.min, "\(g.key) minut, \(gde)")
      }

      XCTAssertEqual(obliquity(at: date), s.obliquity, accuracy: 1e-8, "nagnutost, \(gde)")
      ugao(rightAscensionMC(at: date, longitude: s.lon), s.ramc, "RAMC, \(gde)")
      ugao(houses.ascendant, s.asc, "ASC, \(gde)")
      ugao(houses.midheaven, s.mc, "MC, \(gde)")
      XCTAssertEqual(houses.fellBack, s.fellBack, "Whole Sign rezerva, \(gde)")
      for (i, (c, g)) in zip(houses.cusps, s.kuspide).enumerated() { ugao(c, g, "kuspida \(i + 1), \(gde)") }

      ugao(trueNodeLongitude(at: date), s.cvor, "cvor, \(gde)")
      XCTAssertEqual(nodeSpeed(at: date), s.cvorBrzina, accuracy: 1e-5, "brzina cvora, \(gde)")
      ugao(meanLilithLongitude(at: date), s.lilit, "Lilit, \(gde)")
      ugao(sky.points.first { $0.key == .fortune }!.longitude, s.sreca, "Tacka srece, \(gde)")
      ugao(moonPhaseAngle(at: date), s.faza, "faza Meseca, \(gde)")

      XCTAssertEqual(sky.aspects.map(\.contentKey), s.aspekti.map(\.key), "aspekti i njihov redosled, \(gde)")
      for (a, g) in zip(sky.aspects, s.aspekti) { XCTAssertEqual(a.orb, g.orb, accuracy: 1e-6, "\(g.key) orb, \(gde)") }

      let razmaknuto = spreadAngles(sky.planets.map { chartAngle($0.longitude, houses.ascendant) }, minSep: 9.5)
      for (a, g) in zip(razmaknuto, s.razmaknuto) { XCTAssertEqual(a, g, accuracy: 1e-5, "razmicanje simbola, \(gde)") }
    }
    print("SkyCore: \(golden.slucajevi.count) trenutaka, najvece odstupanje ugla \(najvece)°")
  }

  /// Bez mesta nema kuca ni Tacke srece — ne izmislja se ascendent.
  func testBezMesta() {
    let sky = buildSky(at: Date(timeIntervalSince1970: 1_791_849_600), place: nil)
    XCTAssertNil(sky.houses)
    XCTAssertEqual(sky.points.map(\.key), [.northNode, .lilith])
    XCTAssertEqual(sky.planets.count, 10)
  }
}
