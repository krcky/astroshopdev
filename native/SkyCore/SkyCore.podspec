# Isti izvori kao Swift paket (`Package.swift`), za Xcode targete widgeta i sata.
# U paketu je C biblioteka poseban modul (`CAstronomy`); ovde je u ISTOM modulu
# kao Swift, pa je Swift vidi kroz javno zaglavlje — otud `#if canImport(CAstronomy)`.
Pod::Spec.new do |s|
  s.name           = 'SkyCore'
  s.version        = '1.0.0'
  s.summary        = 'Racun neba i crtez kruga za widget i sat (Astro Shop)'
  s.description    = 'Pozicije planeta (astronomy-engine, C), kuce, tacke i SwiftUI krug — prepis src/lib.'
  s.author         = 'Astro Shop'
  s.homepage       = 'https://astroshop.rs'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '17.0', :watchos => '10.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.source_files = 'Sources/CAstronomy/**/*.{c,h}', 'Sources/SkyCore/**/*.swift'
  s.public_header_files = 'Sources/CAstronomy/include/*.h'
  s.compiler_flags = '-w'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'APPLICATION_EXTENSION_API_ONLY' => 'YES' }
end
