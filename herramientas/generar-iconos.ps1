# Genera los iconos PNG de la app (192, 512 y versión "maskable") a partir del diseño del icono SVG.
# Uso: powershell -File herramientas/generar-iconos.ps1

Add-Type -AssemblyName System.Drawing

$colorFondo = [System.Drawing.ColorTranslator]::FromHtml('#2F7FE0')
$colorNota = [System.Drawing.Color]::White
$carpeta = Join-Path $PSScriptRoot '..\iconos'

function Dibujar-Icono([int]$tamano, [bool]$maskable, [string]$ruta) {
  $mapa = New-Object System.Drawing.Bitmap($tamano, $tamano)
  $g = [System.Drawing.Graphics]::FromImage($mapa)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $pincelFondo = New-Object System.Drawing.SolidBrush($colorFondo)
  $pincelNota = New-Object System.Drawing.SolidBrush($colorNota)

  if ($maskable) {
    # Android recorta el icono maskable: fondo a sangre y contenido en el 60 % central.
    $g.FillRectangle($pincelFondo, 0, 0, $tamano, $tamano)
    $escala = 0.6
  } else {
    $radio = [int]($tamano * 0.25)
    $camino = New-Object System.Drawing.Drawing2D.GraphicsPath
    $camino.AddArc(0, 0, $radio * 2, $radio * 2, 180, 90)
    $camino.AddArc($tamano - $radio * 2, 0, $radio * 2, $radio * 2, 270, 90)
    $camino.AddArc($tamano - $radio * 2, $tamano - $radio * 2, $radio * 2, $radio * 2, 0, 90)
    $camino.AddArc(0, $tamano - $radio * 2, $radio * 2, $radio * 2, 90, 90)
    $camino.CloseFigure()
    $g.FillPath($pincelFondo, $camino)
    $escala = 0.72
  }

  # Nota musical: cabeza ovalada, plica y bandera, centradas.
  $u = $tamano * $escala
  $x0 = ($tamano - $u) / 2
  $y0 = ($tamano - $u) / 2
  $cabezaAncho = $u * 0.42
  $cabezaAlto = $u * 0.30
  $cabezaX = $x0 + $u * 0.12
  $cabezaY = $y0 + $u * 0.66
  $g.FillEllipse($pincelNota, [single]$cabezaX, [single]$cabezaY, [single]$cabezaAncho, [single]$cabezaAlto)
  $plicaAncho = $u * 0.11
  $plicaX = $cabezaX + $cabezaAncho - $plicaAncho
  $plicaY = $y0 + $u * 0.08
  $g.FillRectangle($pincelNota, [single]$plicaX, [single]$plicaY, [single]$plicaAncho, [single]($cabezaY + $cabezaAlto / 2 - $plicaY))
  $banderaAncho = $u * 0.30
  $banderaAlto = $u * 0.11
  $g.FillRectangle($pincelNota, [single]$plicaX, [single]$plicaY, [single]$banderaAncho, [single]$banderaAlto)

  $mapa.Save($ruta, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $mapa.Dispose()
}

Dibujar-Icono 192 $false (Join-Path $carpeta 'icono-192.png')
Dibujar-Icono 512 $false (Join-Path $carpeta 'icono-512.png')
Dibujar-Icono 512 $true (Join-Path $carpeta 'icono-maskable-512.png')
Write-Output 'Iconos generados en iconos/'
