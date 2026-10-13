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
    let sat: Sat
  }
  struct Sat: Decodable {
    struct Mesec: Decodable { let znak: Int; let stepen: Double; let usao, izlazi: Double; let osvetljen: Double; let faza: Int }
    struct Voc: Decodable { let od: Double; let `do`: Double; let sada: Bool }
    struct Sati: Decodable { let vladar, sledeci: String; let od: Double; let `do`: Double; let indeks: Int; let dan: Bool; let izlazak, zalazak: Double }
    struct Dogadjaj: Decodable { let vrsta: String; let kad: Double; let telo: String; let broj: Int }
    let mesec: Mesec; let voc: Voc; let sat: Sati?; let dogadjaji: [Dogadjaj]
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

  /// Racun za sat (`Sat.swift`) protiv `src/lib/sat.ts`. Vremena smeju da se razidju do 2 sekunde
  /// (bisekcija staje na pola sekunde, a zapis je zaokruzen na sekundu); stanice do minut.
  func testSat() throws {
    let url = try XCTUnwrap(Bundle.module.url(forResource: "golden", withExtension: "json"))
    let golden = try JSONDecoder().decode(Golden.self, from: Data(contentsOf: url))
    var najveceVreme = 0.0
    func vreme(_ d: Date, _ g: Double, _ sta: String, tol: Double = 2, line: UInt = #line) {
      let r = abs(d.timeIntervalSince1970 - g)
      najveceVreme = max(najveceVreme, r)
      XCTAssertLessThan(r, tol, sta, line: line)
    }
    for s in golden.slucajevi {
      let date = Date(timeIntervalSince1970: s.unix)
      let gde = "\(s.mesto) \(s.unix)"
      let m = moonNow(at: date)
      XCTAssertEqual(m.sign, s.sat.mesec.znak, "znak Meseca, \(gde)")
      XCTAssertEqual(m.degree, s.sat.mesec.stepen, accuracy: 1e-6, "stepen Meseca, \(gde)")
      vreme(m.enteredAt, s.sat.mesec.usao, "ulazak Meseca u znak, \(gde)")
      vreme(m.ingressAt, s.sat.mesec.izlazi, "izlazak Meseca iz znaka, \(gde)")
      XCTAssertEqual(m.illumination, s.sat.mesec.osvetljen, accuracy: 1e-6, "osvetljenost, \(gde)")
      XCTAssertEqual(m.phase, s.sat.mesec.faza, "faza, \(gde)")

      let v = voidOfCourse(at: date, moon: m)
      vreme(v.start, s.sat.voc.od, "pocetak Meseca bez kursa, \(gde)")
      vreme(v.end, s.sat.voc.do, "kraj Meseca bez kursa, \(gde)")
      XCTAssertEqual(v.active, s.sat.voc.sada, "bez kursa sada, \(gde)")

      let h = planetaryHour(at: date, place: Place(latitude: s.lat, longitude: s.lon))
      XCTAssertEqual(h == nil, s.sat.sat == nil, "ima li planetarnog sata, \(gde)")
      if let h, let g = s.sat.sat {
        XCTAssertEqual(h.ruler.rawValue, g.vladar, "vladar sata, \(gde)")
        XCTAssertEqual(h.next.rawValue, g.sledeci, "sledeci vladar, \(gde)")
        XCTAssertEqual(h.index, g.indeks, "redni broj sata, \(gde)")
        XCTAssertEqual(h.day, g.dan, "dan ili noc, \(gde)")
        vreme(h.start, g.od, "pocetak sata, \(gde)")
        vreme(h.end, g.do, "kraj sata, \(gde)")
        vreme(h.sunrise, g.izlazak, "izlazak Sunca, \(gde)")
        vreme(h.sunset, g.zalazak, "zalazak Sunca, \(gde)")
      }

      let e = upcomingEvents(at: date)
      XCTAssertEqual(e.count, s.sat.dogadjaji.count, "broj dogadjaja, \(gde)")
      for (a, g) in zip(e, s.sat.dogadjaji) {
        let (vrsta, telo, broj): (String, String, Int) = {
          switch a {
          case let .moonSign(_, sign): return ("moonSign", "", sign)
          case .voc: return ("voc", "", 0)
          case let .phase(_, q): return ("phase", "", q)
          case let .ingress(_, b, sign): return ("ingress", b.rawValue, sign)
          case let .station(_, b, r): return ("station", b.rawValue, r ? 1 : 0)
          }
        }()
        XCTAssertEqual("\(vrsta) \(telo) \(broj)", "\(g.vrsta) \(g.telo) \(g.broj)", "dogadjaj, \(gde)")
        vreme(a.at, g.kad, "vreme dogadjaja \(g.vrsta) \(g.telo), \(gde)", tol: vrsta == "station" ? 60 : 2)
      }
    }
    print("SkyCore sat: \(golden.slucajevi.count) trenutaka, najvece odstupanje vremena \(najveceVreme) s")
  }

  /// Bez mesta nema kuca ni Tacke srece — ne izmislja se ascendent.
  func testBezMesta() {
    let sky = buildSky(at: Date(timeIntervalSince1970: 1_791_849_600), place: nil)
    XCTAssertNil(sky.houses)
    XCTAssertEqual(sky.points.map(\.key), [.northNode, .lilith])
    XCTAssertEqual(sky.planets.count, 10)
  }
}
