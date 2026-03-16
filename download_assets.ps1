New-Item -ItemType Directory -Force -Path "assets"
Invoke-WebRequest -Uri "https://unpkg.com/lucide@latest/dist/umd/lucide.js" -OutFile "assets/lucide.min.js"
Invoke-WebRequest -Uri "https://giza.moe.gov.eg/Images/logo2.png" -OutFile "assets/logo2.png"

$cssUrl = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap"
$cssFile = "assets/cairo.css"
Invoke-WebRequest -Uri $cssUrl -OutFile $cssFile -Headers @{"User-Agent"="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"}

$cssContent = Get-Content $cssFile -Raw

$urlRegex = 'url\((https://[^)]+)\)'
$matches = [regex]::Matches($cssContent, $urlRegex)

$i = 0
foreach ($match in $matches) {
    if ($match.Groups.Count -gt 1) {
        $fontUrl = $match.Groups[1].Value
        $fontName = "cairo-$i.woff2"
        Invoke-WebRequest -Uri $fontUrl -OutFile "assets/$fontName" -Headers @{"User-Agent"="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        $cssContent = $cssContent.Replace($fontUrl, $fontName)
        $i++
    }
}

Set-Content -Path $cssFile -Value $cssContent
