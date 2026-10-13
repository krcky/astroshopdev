// PREPIS geometrije iz `src/lib/wheel.ts` (bez dodira i zuma — widget ih nema).
import Foundation
import CoreGraphics

/// Longituda -> ugao na ekranu: ono sto je `leva` stoji na 9 sati, longituda raste suprotno od kazaljke.
public func chartAngle(_ longitude: Double, _ leva: Double) -> Double { 180 + (longitude - leva) }

/// Tacka na krugu; y ide nadole, pa se sinus oduzima.
public func polar(_ c: CGPoint, _ radius: Double, _ angleDeg: Double) -> CGPoint {
  let a = angleDeg * .pi / 180
  return CGPoint(x: c.x + radius * cos(a), y: c.y - radius * sin(a))
}

/// Cetiri ose (ASC, IC, DSC, MC) iz uglova, ne iz rednog broja kuspide.
public func oseKarte(ascendant: Double, midheaven: Double) -> [Double] {
  [norm360(ascendant), norm360(midheaven + 180), norm360(ascendant + 180), norm360(midheaven)]
}

public func naOsi(_ longitude: Double, _ ose: [Double]) -> Bool {
  ose.contains { abs((longitude - $0 + 540).truncatingRemainder(dividingBy: 360) - 180) < 1e-6 }
}

/// Razmice uglove blize od `minSep`, da se simboli ne preklope. Isti algoritam kao u `wheel.ts`.
public func spreadAngles(_ angles: [Double], minSep: Double) -> [Double] {
  let n = angles.count
  if n < 2 { return angles }
  let idx = angles.indices.sorted { norm360(angles[$0]) < norm360(angles[$1]) }

  if Double(n) * minSep >= 360 {
    var out = [Double](repeating: 0, count: n)
    for (k, orig) in idx.enumerated() { out[orig] = norm360(angles[idx[0]]) + Double(k) * (360 / Double(n)) }
    return out
  }

  let sorted = idx.map { norm360(angles[$0]) }
  var cut = 0
  var widest = -1.0
  for k in 0..<n {
    let gap = norm360(sorted[(k + 1) % n] - sorted[k])
    if gap > widest { widest = gap; cut = (k + 1) % n }
  }

  var seq: [Double] = []
  for k in 0..<n {
    var x = sorted[(cut + k) % n]
    if k > 0 { while x < seq[k - 1] { x += 360 } }
    seq.append(x)
  }

  let before = seq
  for _ in 0..<50 {
    for k in 1..<n where seq[k] - seq[k - 1] < minSep { seq[k] = seq[k - 1] + minSep }
    for k in stride(from: n - 2, through: 0, by: -1) where seq[k + 1] - seq[k] < minSep { seq[k] = seq[k + 1] - minSep }
  }
  let shift = (before.reduce(0, +) - seq.reduce(0, +)) / Double(n)

  var out = [Double](repeating: 0, count: n)
  for k in 0..<n { out[idx[(cut + k) % n]] = seq[k] + shift }
  return out
}
