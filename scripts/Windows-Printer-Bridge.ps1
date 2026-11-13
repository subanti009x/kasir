$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Drawing

function Write-Result([hashtable] $Value) {
  [Console]::Out.WriteLine(($Value | ConvertTo-Json -Compress -Depth 10))
  [Console]::Out.Flush()
}

function Get-PrinterInfo {
  $defaultName = $null
  try { $defaultName = (Get-CimInstance Win32_Printer | Where-Object { $_.Default } | Select-Object -First 1 -ExpandProperty Name) } catch {}
  $printers = @()
  foreach ($printer in @(Get-Printer | Sort-Object Name)) {
    $settings = New-Object System.Drawing.Printing.PrinterSettings
    $settings.PrinterName = $printer.Name
    $defaultPaperName = $null
    $sizes = @()
    if ($settings.IsValid) {
      try { $defaultPaperName = $settings.DefaultPageSettings.PaperSize.PaperName } catch {}
      foreach ($paper in $settings.PaperSizes) {
        $widthMm = [Math]::Round($paper.Width * 0.254, 1)
        $heightMm = [Math]::Round($paper.Height * 0.254, 1)
        $namedAsRoll = $paper.PaperName -match '(?i)receipt|roll|58\s*mm|80\s*mm|thermal|struk'
        $commonRollWidth = ($widthMm -ge 54 -and $widthMm -le 62) -or ($widthMm -ge 76 -and $widthMm -le 84)
        $looksLikeRoll = $namedAsRoll -or ($commonRollWidth -and $heightMm -ge 150)
        if ($looksLikeRoll) {
          $sizes += [pscustomobject]@{
            name = [string]$paper.PaperName
            widthMm = $widthMm
            heightMm = $heightMm
            width = [int]$paper.Width
          }
        }
      }
    }
    $recommended = $null
    if ($sizes.Count -gt 0) {
      $recommended = $sizes | Where-Object { $_.name -eq $defaultPaperName } | Select-Object -First 1
      if (-not $recommended -and $sizes.Count -eq 1) { $recommended = $sizes[0] }
      if (-not $recommended) { $recommended = $sizes | Sort-Object width -Descending | Select-Object -First 1 }
    }
    $printers += [pscustomobject]@{
      name = [string]$printer.Name
      driver = [string]$printer.DriverName
      status = [string]$printer.PrinterStatus
      isDefault = ([string]$printer.Name -eq [string]$defaultName)
      defaultPaperName = [string]$defaultPaperName
      receiptPaperSizes = @($sizes)
      recommendedPaper = $recommended
    }
  }
  return @{ status = 'ok'; defaultPrinter = $defaultName; printers = @($printers) }
}

function Add-ReceiptLine {
  param([System.Collections.Generic.List[object]]$Lines, [string]$Text, [string]$Align = 'left', [bool]$Bold = $false, [string]$RightText = $null)
  $line = @{ text = $Text; align = $Align; bold = $Bold }
  if ($null -ne $RightText) { $line.rightText = $RightText }
  $Lines.Add($line)
}

function Add-WrappedLine {
  param([System.Collections.Generic.List[object]]$Lines, [string]$Text, [int]$Columns, [string]$Align = 'left', [bool]$Bold = $false)
  if ([string]::IsNullOrWhiteSpace($Text)) { return }
  $remaining = $Text.Trim()
  while ($remaining.Length -gt $Columns) {
    $cut = $remaining.LastIndexOf(' ', [Math]::Min($Columns, $remaining.Length - 1))
    if ($cut -lt 1) { $cut = $Columns }
    Add-ReceiptLine -Lines $Lines -Text $remaining.Substring(0, $cut).TrimEnd() -Align $Align -Bold $Bold
    $remaining = $remaining.Substring($cut).TrimStart()
  }
  Add-ReceiptLine -Lines $Lines -Text $remaining -Align $Align -Bold $Bold
}

function Format-Rupiah([double]$Value) {
  return 'Rp ' + [Math]::Round($Value).ToString('N0', [Globalization.CultureInfo]::GetCultureInfo('id-ID'))
}

function Format-PaymentMethod([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return 'Cash' }
  $trimmed = $Value.Trim()
  return $trimmed.Substring(0, 1).ToUpperInvariant() + $trimmed.Substring(1).ToLowerInvariant()
}

function Add-PairLine {
  param([System.Collections.Generic.List[object]]$Lines, [string]$Label, [string]$Value, [int]$Columns, [bool]$Bold = $false)
  if ($Label.Length + $Value.Length + 1 -le $Columns) {
    Add-ReceiptLine -Lines $Lines -Text ($Label + (' ' * ($Columns - $Label.Length - $Value.Length)) + $Value) -Bold $Bold
  } else {
    Add-WrappedLine -Lines $Lines -Text $Label -Columns $Columns -Bold $Bold
    Add-ReceiptLine -Lines $Lines -Text $Value -Align 'right' -Bold $Bold
  }
}

function Add-FajarPairLine {
  param([System.Collections.Generic.List[object]]$Lines, [string]$Label, [string]$Value, [int]$Columns, [bool]$Bold = $False)
  if ($Label.Length + $Value.Length + 1 -le $Columns) {
    Add-ReceiptLine -Lines $Lines -Text $Label -RightText $Value -Bold $Bold
  } else {
    Add-WrappedLine -Lines $Lines -Text $Label -Columns $Columns -Bold $Bold
    Add-ReceiptLine -Lines $Lines -Text $Value -Align 'right' -Bold $Bold
  }
}

function Print-Receipt($InputData) {
  $printerName = [string]$InputData.printerName
  $paperName = [string]$InputData.paperSizeName
  $receipt = $InputData.receipt
  $store = $InputData.store
  $settings = New-Object System.Drawing.Printing.PrinterSettings
  $settings.PrinterName = $printerName
  if (-not $settings.IsValid) { throw "Printer '$printerName' tidak tersedia di Windows." }
  $paper = $settings.PaperSizes | Where-Object { $_.PaperName -eq $paperName } | Select-Object -First 1
  if (-not $paper) { throw "Ukuran struk '$paperName' tidak lagi dilaporkan oleh driver printer. Muat ulang daftar printer." }

  $fajarFormat = [string]$InputData.receiptFormat -eq 'FAJAR_CLIENT'
  $paperWidth = [int]$paper.Width
  $paperWidthMm = [Math]::Round($paperWidth * 0.254, 1)
  $fontSize = if ($fajarFormat) { if ($paperWidthMm -le 62) { 8.5 } else { 10.5 } } elseif ($paperWidthMm -le 62) { 7.5 } else { 9.0 }
  $fontFamily = 'Courier New'
  $lineHeightPoints = $fontSize * 1.45
  $printablePoints = ($paperWidth * 0.72) - 17
  $columns = [Math]::Max(18, [int][Math]::Floor($printablePoints / ($fontSize * 0.60)))
  $lines = New-Object 'System.Collections.Generic.List[object]'
  $culture = [Globalization.CultureInfo]::GetCultureInfo('id-ID')
  $receiptInstant = $null
  try { $receiptInstant = [DateTimeOffset]::Parse([string]$receipt.createdAt, $culture) } catch {}
  $jakartaReceiptTime = $null
  if ($fajarFormat -and $receiptInstant) {
    $jakartaZone = [TimeZoneInfo]::FindSystemTimeZoneById('SE Asia Standard Time')
    $jakartaReceiptTime = [TimeZoneInfo]::ConvertTime($receiptInstant, $jakartaZone)
  }
  $dateText = if ($fajarFormat -and $jakartaReceiptTime) { $jakartaReceiptTime.ToString('yyyy-MM-dd', $culture) } else { try { ([DateTime]::Parse([string]$receipt.createdAt)).ToString($(if ($fajarFormat) { 'yyyy-MM-dd' } else { 'dd MMM yyyy, HH.mm' }), $culture) } catch { [string]$receipt.createdAt } }
  $dash = '-' * $columns

  $storeName = if ($fajarFormat) { 'Toko Fajar' } else { [string]$store.name }
  Add-WrappedLine -Lines $lines -Text $storeName -Columns $columns -Align 'center' -Bold $true
  if ($fajarFormat) {
    Add-WrappedLine -Lines $lines -Text 'M737+XG5, Panyingkiran Kidul, Kec. Cantigi, Kabupaten Indramayu, Jawa Barat 45258, Indonesia' -Columns $columns -Align 'center'
    Add-WrappedLine -Lines $lines -Text '+62 823 93495020' -Columns $columns -Align 'center'
  } else {
    if ($store.address) { Add-WrappedLine -Lines $lines -Text ([string]$store.address) -Columns $columns -Align 'center' }
    if ($store.phone) { Add-WrappedLine -Lines $lines -Text ([string]$store.phone) -Columns $columns -Align 'center' }
  }
  Add-ReceiptLine -Lines $lines -Text $dash
  if ($fajarFormat) {
    $cashierName = if ($receipt.cashier -and $receipt.cashier.name) { [string]$receipt.cashier.name } else { '' }
    if ($cashierName -and $dateText.Length + $cashierName.Length + 1 -le $columns) {
      Add-PairLine -Lines $lines -Label $dateText -Value $cashierName -Columns $columns
    } else {
      Add-WrappedLine -Lines $lines -Text $dateText -Columns $columns
      if ($cashierName) { Add-WrappedLine -Lines $lines -Text $cashierName -Columns $columns -Align 'right' }
    }
    $timeText = if ($jakartaReceiptTime) { $jakartaReceiptTime.ToString('HH:mm:ss', $culture) } else { try { ([DateTime]::Parse([string]$receipt.createdAt)).ToString('HH:mm:ss', $culture) } catch { '' } }
    if ($timeText) { Add-WrappedLine -Lines $lines -Text $timeText -Columns $columns }
    Add-WrappedLine -Lines $lines -Text ("No." + [string]$receipt.receiptId) -Columns $columns
  } else {
    Add-WrappedLine -Lines $lines -Text ([string]$receipt.receiptId) -Columns $columns -Bold $true
    Add-WrappedLine -Lines $lines -Text $dateText -Columns $columns
    if ($receipt.cashier.name) { Add-WrappedLine -Lines $lines -Text ("Kasir: " + [string]$receipt.cashier.name) -Columns $columns }
  }
  Add-ReceiptLine -Lines $lines -Text $dash

  foreach ($item in $receipt.items) {
    $name = [string]$item.product.name
    if ($item.unitName) { $name += " ($($item.unitName))" }
    Add-WrappedLine -Lines $lines -Text $name -Columns $columns -Bold $true
    $quantity = [double]$item.quantity
    $unitPrice = if ($quantity -ne 0) { [double]$item.subtotal / $quantity } else { 0 }
    $unitPriceText = if ($fajarFormat) { [Math]::Round($unitPrice).ToString('N0', [Globalization.CultureInfo]::GetCultureInfo('en-US')) } else { Format-Rupiah $unitPrice }
    $left = ('{0} x {1}' -f $quantity.ToString('0.##', $culture), $unitPriceText)
    $right = Format-Rupiah ([double]$item.subtotal)
    if ($fajarFormat) { Add-FajarPairLine -Lines $lines -Label $left -Value $right -Columns $columns }
    elseif ($left.Length + $right.Length + 1 -le $columns) {
      Add-ReceiptLine -Lines $lines -Text ($left + (' ' * ($columns - $left.Length - $right.Length)) + $right)
    } else {
      Add-WrappedLine -Lines $lines -Text $left -Columns $columns
      Add-ReceiptLine -Lines $lines -Text $right -Align 'right'
    }
  }

  Add-ReceiptLine -Lines $lines -Text $dash
  if ($fajarFormat) {
    $paymentMethod = if (@($receipt.payments).Count -gt 0) { [string]$receipt.payments[0].method } else { [string]$receipt.paymentMethod }
    Add-FajarPairLine -Lines $lines -Label 'Total' -Value (Format-Rupiah ([double]$receipt.total)) -Columns $columns
    Add-FajarPairLine -Lines $lines -Label ("Bayar (" + (Format-PaymentMethod $paymentMethod) + ")") -Value (Format-Rupiah ([double]$receipt.amountPaid)) -Columns $columns
    Add-FajarPairLine -Lines $lines -Label 'Kembali' -Value (Format-Rupiah ([double]$receipt.changeDue)) -Columns $columns
    Add-ReceiptLine -Lines $lines -Text ''
    Add-WrappedLine -Lines $lines -Text 'Link Kritik dan Saran' -Columns $columns -Align 'center'
    Add-WrappedLine -Lines $lines -Text 'olshopin.com/f/2751517' -Columns $columns -Align 'center'
  } else {
    Add-PairLine -Lines $lines -Label 'Subtotal' -Value (Format-Rupiah ([double]$receipt.subtotal)) -Columns $columns
    if ([double]$receipt.discount -gt 0) { Add-PairLine -Lines $lines -Label 'Diskon' -Value ('-' + (Format-Rupiah ([double]$receipt.discount))) -Columns $columns }
    Add-PairLine -Lines $lines -Label 'Pajak' -Value (Format-Rupiah ([double]$receipt.tax)) -Columns $columns
    Add-ReceiptLine -Lines $lines -Text $dash
    Add-PairLine -Lines $lines -Label 'TOTAL' -Value (Format-Rupiah ([double]$receipt.total)) -Columns $columns -Bold $true
    Add-ReceiptLine -Lines $lines -Text $dash
    $payments = @($receipt.payments)
    if ($payments.Count -eq 0) { $payments = @(@{ method = $receipt.paymentMethod; amount = $receipt.amountPaid }) }
    foreach ($payment in $payments) { Add-PairLine -Lines $lines -Label ([string]$payment.method) -Value (Format-Rupiah ([double]$payment.amount)) -Columns $columns }
    Add-PairLine -Lines $lines -Label 'Bayar' -Value (Format-Rupiah ([double]$receipt.amountPaid)) -Columns $columns -Bold $true
    Add-PairLine -Lines $lines -Label 'Kembali' -Value (Format-Rupiah ([double]$receipt.changeDue)) -Columns $columns
    Add-ReceiptLine -Lines $lines -Text $dash
    Add-WrappedLine -Lines $lines -Text 'Terima Kasih!' -Columns $columns -Align 'center' -Bold $true
    Add-WrappedLine -Lines $lines -Text 'Barang yang sudah dibeli' -Columns $columns -Align 'center'
    Add-WrappedLine -Lines $lines -Text 'tidak dapat dikembalikan' -Columns $columns -Align 'center'
  }

  $height = [Math]::Max(100, [int][Math]::Ceiling(($lines.Count * $lineHeightPoints + 16) / 72 * 100))
  $customPaper = [System.Drawing.Printing.PaperSize]::new($paperName, $paperWidth, $height)
  $document = New-Object System.Drawing.Printing.PrintDocument
  $document.DocumentName = "Struk $($receipt.receiptId)"
  $document.PrinterSettings = $settings
  $document.DefaultPageSettings.PaperSize = $customPaper
  $document.DefaultPageSettings.Margins = [System.Drawing.Printing.Margins]::new(0, 0, 0, 0)
  $document.OriginAtMargins = $false
  $document.PrintController = New-Object System.Drawing.Printing.StandardPrintController
  $document.add_PrintPage({
    param($sender, $eventArgs)
    $graphics = $eventArgs.Graphics
    $graphics.PageUnit = [System.Drawing.GraphicsUnit]::Point
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit
    $regular = [System.Drawing.Font]::new($fontFamily, [single]$fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
    $boldFont = [System.Drawing.Font]::new($fontFamily, [single]$fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
    $pageWidthPoints = $paperWidth * 0.72
    $left = 5.0
    $width = $pageWidthPoints - 10.0
    $y = 4.0
    foreach ($line in $lines) {
      $font = if ($line.bold) { $boldFont } else { $regular }
      $format = [System.Drawing.StringFormat]::new()
      switch ($line.align) {
        'center' { $format.Alignment = [System.Drawing.StringAlignment]::Center }
        'right' { $format.Alignment = [System.Drawing.StringAlignment]::Far }
        default { $format.Alignment = [System.Drawing.StringAlignment]::Near }
      }
      $rect = [System.Drawing.RectangleF]::new($left, $y, $width, ($lineHeightPoints + 1))
      if ($null -ne $line.rightText) {
        $rightSize = $graphics.MeasureString([string]$line.rightText, $font).Width
        $leftRect = [System.Drawing.RectangleF]::new($left, $y, [Math]::Max(1, $width - $rightSize - 4), ($lineHeightPoints + 1))
        $rightRect = [System.Drawing.RectangleF]::new(($left + $width - $rightSize - 2), $y, ($rightSize + 2), ($lineHeightPoints + 1))
        $rightFormat = [System.Drawing.StringFormat]::new()
        $rightFormat.Alignment = [System.Drawing.StringAlignment]::Far
        $graphics.DrawString([string]$line.text, $font, [System.Drawing.Brushes]::Black, $leftRect, $format)
        $graphics.DrawString([string]$line.rightText, $font, [System.Drawing.Brushes]::Black, $rightRect, $rightFormat)
        $rightFormat.Dispose()
      } else {
        $graphics.DrawString([string]$line.text, $font, [System.Drawing.Brushes]::Black, $rect, $format)
      }
      $y += $lineHeightPoints
      $format.Dispose()
    }
    $regular.Dispose()
    $boldFont.Dispose()
    $eventArgs.HasMorePages = $false
  }.GetNewClosure())
  $document.Print()
  return @{ status = 'printed'; printer = $printerName; paper = $paperName; paperWidthMm = $paperWidthMm; receiptHeightMm = [Math]::Round($height * 0.254, 1) }
}

try {
  $inputData = [Console]::In.ReadToEnd() | ConvertFrom-Json
  if ($inputData.action -eq 'list') { Write-Result (Get-PrinterInfo); exit 0 }
  if ($inputData.action -eq 'print') { Write-Result (Print-Receipt $inputData); exit 0 }
  throw 'Aksi printer tidak dikenal.'
} catch {
  Write-Result @{ status = 'error'; message = $_.Exception.Message }
  exit 1
}
