$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docxPath = "C:\Users\ajays\Desktop\codity\documentation\final\Final_Report.docx"
$pdfPath = "C:\Users\ajays\Desktop\codity\documentation\final\Final_Report.pdf"

Write-Host "Opening Word Document..."
$doc = $word.Documents.Open($docxPath)

Write-Host "Saving as PDF..."
$doc.SaveAs([ref]$pdfPath, [ref]17)

Write-Host "Closing Word..."
$doc.Close()
$word.Quit()
Write-Host "Done."
