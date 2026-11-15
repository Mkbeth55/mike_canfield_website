# Rebuild the self-contained Blue Trouble King puzzle after changing puzzle assets.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$encoding = New-Object System.Text.UTF8Encoding($false)
$image = 'data:image/webp;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root 'assets/blue-trouble-king.webp')))
$html = [IO.File]::ReadAllText((Join-Path $root 'puzzle.html'))
$js = [IO.File]::ReadAllText((Join-Path $root 'assets/puzzle.js'))
$catalog = '  const posters = {"blue-trouble-king": {name: "Blue Trouble King", src: "' + $image + '", link: "' + $image + '"}};'
$js = [regex]::Replace($js, '(?s)  const posters = \{.*?\r?\n  \};', $catalog)
$js = $js.Replace("const requestedPoster = params.get('poster');", "const requestedPoster = 'blue-trouble-king';")
$js = $js.Replace("poster.src.split('/').pop()", "'blue-trouble-king.webp'")
$html = $html.Replace('<title>Excuse Monster Jigsaw | Mike Canfield</title>', '<title>Blue Trouble King Offline Jigsaw | Mike Canfield</title>')
foreach ($css in @('site', 'puzzle')) {
    $html = $html.Replace('<link rel="stylesheet" href="assets/' + $css + '.css">', '<style>' + [IO.File]::ReadAllText((Join-Path $root ('assets/' + $css + '.css'))) + '</style>')
}
$html = $html.Replace('<script src="assets/puzzle.js" defer></script>', '')
$html = [regex]::Replace($html, '(?s)<header>.*?</header>', '<header><div class="wrap"><strong>Mike Canfield · Blue Trouble King</strong><p>Saved offline puzzle. Open this HTML file in your browser to play.</p></div></header>')
$html = [regex]::Replace($html, '<p class="intro"><a.*?</p>', '')
$html = [regex]::Replace($html, '<p class="offline-download">.*?</p>', '')
$html = $html.Replace("url('excuse-monster.png')", 'none')
$html = $html.Replace('assets/excuse-monster.png', $image)
$html = $html.Replace('excuse-monster.png', 'blue-trouble-king.webp')
$html = [regex]::Replace($html, '(?s)<noscript>.*?</noscript>', '<noscript><p>Enable JavaScript in your browser to play this offline puzzle.</p></noscript>')
$html = $html.Replace('href="index.html"', 'href="https://mikecanfield.net/"')
$html = $html.Replace('</body>', '<script>' + $js + '</script></body>')
$destination = Join-Path $root 'assets/downloads/blue-trouble-king-100-piece-jigsaw.html'
[IO.Directory]::CreateDirectory((Split-Path $destination -Parent)) | Out-Null
[IO.File]::WriteAllText($destination, $html, $encoding)
Write-Output "Built $destination"
