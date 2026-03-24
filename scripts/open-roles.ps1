$base = "D:\Claude Projects\seeneyu\roles"

wt `
  new-tab --title "Designer"         -d "$base\designer"         cmd /k "claude ""Alez""" `; `
  new-tab --title "Tester"           -d "$base\tester"           cmd /k "claude ""Alez""" `; `
  new-tab --title "Reporter"         -d "$base\reporter"         cmd /k "claude ""Alez""" `; `
  new-tab --title "Data-Engineer"    -d "$base\data-engineer"    cmd /k "claude ""Alez""" `; `
  new-tab --title "Builder"          -d "$base\builder"          cmd /k "claude ""Alez""" `; `
  new-tab --title "Backend-Engineer" -d "$base\backend-engineer" cmd /k "claude ""Alez""" `; `
  new-tab --title "Marketer"         -d "$base\marketer"         cmd /k "claude ""Alez"""
