param(
    [string]$docxPath = "C:\Users\ajays\Desktop\codity\Enterprise_Report.docx",
    [string]$pdfPath = "C:\Users\ajays\Desktop\codity\Enterprise_Report.pdf"
)

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($docxPath)
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    $doc.Close()
    Write-Host "PDF created successfully at $pdfPath"
} catch {
    Write-Error "Failed to convert document: $_"
} finally {
    if ($word) {
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
}
