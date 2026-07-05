const fs = require("fs");
const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Software Architecture Document</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 900px; margin: 0 auto; padding: 40px; }
        h1, h2, h3 { color: #0f172a; }
        .section-title { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 3rem; }
        code { background-color: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-family: "Courier New", monospace; font-size: 0.9em; color: #be123c; }
        .data-dict { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 14px; }
        .data-dict th, .data-dict td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
        .data-dict th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
        .terminal { background-color: #0f172a; color: #38bdf8; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: "Courier New", monospace; font-size: 12px; line-height: 1.4; white-space: pre; }
        .toc { background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .list-none { list-style-type: none; padding-left: 0; }
        .list-none li { margin-bottom: 0.5rem; }
        @media print {
            body { padding: 0; max-width: none; }
            .page-break { page-break-before: always; }
        }
    </style>
    <!-- Include Mermaid JS -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({startOnLoad:true, theme: "neutral"});</script>
</head>
<body>
`;
let content = "";
for (let i = 1; i <= 7; i++) {
    const partPath = `C:/Users/ajays/.gemini/antigravity/brain/ce412c8a-f206-42cb-80a7-f41827f7c72b/doc_part${i}.md`;
    if (fs.existsSync(partPath)) {
        content += fs.readFileSync(partPath, "utf8") + "\n\n";
    }
}
fs.writeFileSync("C:/Users/ajays/Desktop/codity/Enterprise_Report.html", template + content + "</body></html>");
console.log("Successfully generated Enterprise_Report.html");
