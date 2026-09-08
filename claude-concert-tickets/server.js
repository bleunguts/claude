import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize } from "node:path";
import { listEvents, getEvent } from "./db.js";

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function sendFile(res, urlPath) {
  // normalize() collapses ".." before the join, so requests can't escape public/.
  const safe = normalize(decodeURIComponent(urlPath));
  const filePath = join(PUBLIC_DIR, safe === "\\" || safe === "/" ? "index.html" : safe);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[extname(filePath)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === "/api/events") {
    sendJson(res, 200, listEvents());
    return;
  }

  const match = pathname.match(/^\/api\/events\/([\w-]+)$/);
  if (match) {
    const event = getEvent(match[1]);
    if (event) sendJson(res, 200, event);
    else sendJson(res, 404, { error: "No such event" });
    return;
  }

  await sendFile(res, pathname);
});

server.listen(PORT, () => {
  console.log(`Concert tickets running at http://localhost:${PORT}`);
});
