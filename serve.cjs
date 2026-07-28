const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5173;
const ROOT = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".json": "application/json", ".woff2": "font/woff2",
};

http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(ROOT, "index.html"), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end("Not Found"); return; }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Static server: http://localhost:${PORT}`));
