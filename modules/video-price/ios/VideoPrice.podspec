Pod::Spec.new do |s|
  s.name           = 'VideoPrice'
  s.version        = '1.0.0'
  s.summary        = 'Video dnevne price: kadar po kadar u MP4 (Astro Shop)'
  s.description    = 'Pogled cija se deca crtaju u CVPixelBuffer i slazu u H.264 preko AVAssetWriter-a.'
  s.author         = 'Astro Shop'
  s.homepage       = 'https://astroshop.rs'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'Photos'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
