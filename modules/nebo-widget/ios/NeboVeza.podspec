Pod::Spec.new do |s|
  s.name           = 'NeboVeza'
  s.version        = '1.0.0'
  s.summary        = 'Veza aplikacije i widgeta "Nebo sada" (Astro Shop)'
  s.description    = 'Upisuje mesto posmatranja u deljeni App Group i osvezava widget.'
  s.author         = 'Astro Shop'
  s.homepage       = 'https://astroshop.rs'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WidgetKit', 'WatchConnectivity'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
