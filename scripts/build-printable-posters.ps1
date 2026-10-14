# Rebuild printable downloads from the original artwork. No external dependencies.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$html = [IO.File]::ReadAllText((Join-Path $root 'index.html'))
$posters = [regex]::Matches($html, 'href="assets/(?:printable/)?([^"/]+)\.(?:png|pdf)" download="([^"]+)-Poster\.(?:png|pdf)"')
$output = Join-Path $root 'assets/printable'
[IO.Directory]::CreateDirectory($output) | Out-Null
$ascii = [Text.Encoding]::ASCII
$culture = [Globalization.CultureInfo]::InvariantCulture
$jpegCodec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
foreach ($poster in $posters) {
    $slug = $poster.Groups[1].Value
    $source = [Drawing.Image]::FromFile((Join-Path $root "assets/$slug.png"))
    $bitmap = New-Object Drawing.Bitmap($source.Width, $source.Height)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([Drawing.Color]::White)
    $graphics.DrawImage($source, 0, 0, $source.Width, $source.Height)
    $jpeg = New-Object IO.MemoryStream
    $parameters = New-Object Drawing.Imaging.EncoderParameters(1)
    $parameters.Param[0] = New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality, [long]98)
    $bitmap.Save($jpeg, $jpegCodec, $parameters)
    # US Letter, with half-inch margins. Scale uniformly to preserve all artwork.
    $scale = [Math]::Min(540 / $source.Width, 720 / $source.Height)
    $width = $source.Width * $scale
    $height = $source.Height * $scale
    $x = (612 - $width) / 2
    $y = (792 - $height) / 2
    $matrix = @($width, $height, $x, $y) | ForEach-Object { $_.ToString('0.######', $culture) }
    $content = "q`n$($matrix[0]) 0 0 $($matrix[1]) $($matrix[2]) $($matrix[3]) cm`n/Poster Do`nQ`n"
    $pdf = New-Object IO.MemoryStream
    $offsets = New-Object 'Collections.Generic.List[long]'
    function Write-PdfText([string]$value) {
        $bytes = $ascii.GetBytes($value)
        $pdf.Write($bytes, 0, $bytes.Length)
    }
    function Start-PdfObject([int]$number) {
        $offsets.Add($pdf.Position)
        Write-PdfText "$number 0 obj`n"
    }
    Write-PdfText "%PDF-1.4`n"
    Start-PdfObject 1
    Write-PdfText "<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>`nendobj`n"
    Start-PdfObject 2
    Write-PdfText "<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n"
    Start-PdfObject 3
    Write-PdfText "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Poster 4 0 R >> >> /Contents 5 0 R >>`nendobj`n"
    Start-PdfObject 4
    Write-PdfText "<< /Type /XObject /Subtype /Image /Width $($source.Width) /Height $($source.Height) /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length $($jpeg.Length) >>`nstream`n"
    $jpeg.WriteTo($pdf)
    Write-PdfText "`nendstream`nendobj`n"
    Start-PdfObject 5
    Write-PdfText "<< /Length $($ascii.GetByteCount($content)) >>`nstream`n${content}endstream`nendobj`n"
    $xref = $pdf.Position
    Write-PdfText "xref`n0 6`n0000000000 65535 f `n"
    foreach ($offset in $offsets) { Write-PdfText ($offset.ToString('0000000000') + " 00000 n `n") }
    Write-PdfText "trailer`n<< /Size 6 /Root 1 0 R >>`nstartxref`n$xref`n%%EOF`n"
    [IO.File]::WriteAllBytes((Join-Path $output "$slug.pdf"), $pdf.ToArray())
    $pdf.Dispose(); $jpeg.Dispose(); $parameters.Dispose()
    $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose()
    Write-Output "Built $slug.pdf"
}
