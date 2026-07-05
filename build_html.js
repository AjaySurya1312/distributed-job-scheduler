const fs = require("fs");
const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Software Design Document</title>
    <style>
        body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 900px; margin: 0 auto; padding: 40px; }
        h1, h2, h3 { color: #1e3a8a; }
        code { background-color: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-family: "Courier New", monospace; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
        th { background-color: #f8fafc; font-weight: 600; }
        pre { background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; overflow-x: auto; }
        @media print {
            body { padding: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
    <!-- Include Mermaid JS -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({startOnLoad:true});</script>
</head>
<body>
`;
let content = "";
for (let i = 1; i <= 5; i++) {
    const partPath = `C:/Users/ajays/.gemini/antigravity/brain/ce412c8a-f206-42cb-80a7-f41827f7c72b/report_part${i}.md`;
    if (fs.existsSync(partPath)) {
        content += fs.readFileSync(partPath, "utf8") + "\n\n";
    }
}
fs.writeFileSync("C:/Users/ajays/Desktop/codity/Final_Report_v3.html", template + content + "</body></html>");
console.log("Successfully generated Final_Report_v3.html");
