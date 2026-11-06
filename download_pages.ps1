$urls = @(
  "https://www.playstation.com/en-in/ps5/ps5-pro/",
  "https://www.playstation.com/en-in/accessories/ps5-console-covers/",
  "https://www.playstation.com/en-in/accessories/dualsense-wireless-controller/",
  "https://www.playstation.com/en-in/accessories/"
)

$i = 1
foreach ($u in $urls) {
  try {
    $file = "page_$i.html"
    Invoke-WebRequest -Uri $u -UserAgent "Mozilla/5.0" -UseBasicParsing | Select-Object -ExpandProperty Content | Set-Content -Path $file -Encoding utf8
    Write-Host "Success $u -> $file"
  } catch {
    Write-Host "Failed $u"
  }
  $i++
}
