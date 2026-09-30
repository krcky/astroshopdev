Pod::Spec.new do |s|
  s.name           = 'PostepenoZamucenje'
  s.version        = '1.0.0'
  s.summary        = 'Zamucena traka koja postepeno bledi nadole (Astro Shop)'
  s.description    = 'UIVisualEffectView sa maskom-prelivom: bez ostre ivice ispod trake.'
  s.author         = 'Astro Shop'
  s.homepage       = 'https://astroshop.rs'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
