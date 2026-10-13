import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(import.meta.dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const relative = decodeURIComponent(
        url.pathname === "/" ? "/index.html" : url.pathname,
      );
      const path = resolve(root, "." + relative);
      if (
        !path.startsWith(root + sep) ||
        relative.split("/").some((part) => part.startsWith("."))
      )
        throw Error("Forbidden");
      const body = await readFile(path);
      res.writeHead(200, {
        "Content-Type": types[extname(path)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("No encontrado");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Mahjong disponible en http://127.0.0.1:4173"),
  );
