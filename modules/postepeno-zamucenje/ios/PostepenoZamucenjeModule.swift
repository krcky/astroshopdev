import ExpoModulesCore
import UIKit

/**
 * POSTEPENO ZAMUCENJE (Ivan, 30.9.2026): zamucena traka na vrhu ekrana BEZ OSTRE IVICE —
 * zamucenje bledi nadole, pa se ne vidi gde traka prestaje.
 *
 * Javni API: `UIVisualEffectView.mask` (iOS 10+). Maska je preliv: puna do
 * `pocetakPrelaza` (udeo visine), pa do dna providna. Materijal i jacina su isti kao
 * `expo-blur` (`systemUltraThinMaterialLight`, jacina preko `UIViewPropertyAnimator`),
 * pa se u traci izgled ne menja — samo donja ivica nestaje.
 *
 * Maska na RODITELJU (npr. MaskedView u React Native-u) ovde ne radi: iOS tada ne crta
 * efekat. Zato ovo mora nativno, i zato ga Expo Go nema (`components/postepeno-zamucenje.tsx`).
 */
public final class PostepenoZamucenjeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PostepenoZamucenje")

    View(PostepenoZamucenjeView.self) {
      // 0—100, kao `intensity` u `expo-blur`.
      Prop("intensity") { (view: PostepenoZamucenjeView, intensity: Double) in
        view.jacina = intensity / 100
      }
      // Udeo visine (0—1) do kog je zamucenje puno; ispod toga bledi do nule.
      Prop("pocetakPrelaza") { (view: PostepenoZamucenjeView, pocetak: Double) in
        view.pocetakPrelaza = pocetak
      }
    }
  }
}

public final class PostepenoZamucenjeView: ExpoView {
  private let efekat = UIVisualEffectView(effect: nil)
  private let maska = MaskaPreliv()
  private let materijal = UIBlurEffect(style: .systemUltraThinMaterialLight)
  private var animator: UIViewPropertyAnimator?

  var jacina: Double = 0 {
    didSet { primeniJacinu() }
  }

  var pocetakPrelaza: Double = 0.6 {
    didSet { maska.pocetak = pocetakPrelaza }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
    efekat.isUserInteractionEnabled = false
    addSubview(efekat)
    efekat.mask = maska
  }

  deinit {
    animator?.stopAnimation(true)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    efekat.frame = bounds
    maska.frame = efekat.bounds
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    // Animator ume da zavrsi kad prozor ode (pozadina, promena ekrana) — obnovi jacinu.
    if window != nil { primeniJacinu() }
  }

  /// Jacina kao u `expo-blur`: animacija ka materijalu, zaustavljena na udelu `jacina`.
  private func primeniJacinu() {
    animator?.stopAnimation(true)
    animator = nil
    efekat.effect = nil
    guard jacina > 0.001 else { return }
    let a = UIViewPropertyAnimator(duration: 1, curve: .linear) { [weak self] in
      guard let self else { return }
      self.efekat.effect = self.materijal
    }
    a.pausesOnCompletion = true
    a.fractionComplete = CGFloat(min(1, jacina))
    animator = a
  }
}

/// Maska: puna od vrha do `pocetak`, pa meko (ease-out) do providne na dnu.
final class MaskaPreliv: UIView {
  override class var layerClass: AnyClass { CAGradientLayer.self }

  var pocetak: Double = 0.6 {
    didSet { osvezi() }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    osvezi()
  }

  required init?(coder: NSCoder) { nil }

  private func osvezi() {
    guard let g = layer as? CAGradientLayer else { return }
    let p = max(0, min(0.95, pocetak))
    let ostatak = 1 - p
    g.startPoint = CGPoint(x: 0.5, y: 0)
    g.endPoint = CGPoint(x: 0.5, y: 1)
    g.colors = [1, 1, 0.75, 0.4, 0.12, 0].map { UIColor(white: 0, alpha: $0).cgColor }
    g.locations = [0, p, p + ostatak * 0.25, p + ostatak * 0.5, p + ostatak * 0.75, 1].map { NSNumber(value: $0) }
  }
}
