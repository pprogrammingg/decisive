#!/usr/bin/env python3
"""Dev server — static GET (no-cache) + PUT/POST for data/state.json."""
from __future__ import annotations

import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
NO_CACHE_EXT = {".html", ".css", ".js", ".json", ".mjs", ".map", ".svg"}
DEFAULT_PORT = 8080
HOST = os.environ.get("HOST", "127.0.0.1")
STATE_FILE = ROOT / "data" / "state.json"
STATE_URL = "/data/state.json"


class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        ext = Path(self.path.split("?", 1)[0]).suffix.lower()
        if ext in NO_CACHE_EXT:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_PUT(self):
        self._write_state()

    def do_POST(self):
        self._write_state()

    def _write_state(self) -> None:
        path = unquote(self.path.split("?", 1)[0])
        if path != STATE_URL:
            self.send_error(404, "Only /data/state.json is writable")
            return
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        try:
            data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            self.send_error(400, f"Invalid JSON: {exc}")
            return
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        payload = b'{"ok":true}\n'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def pick_port(start: int) -> int:
    import socket

    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((HOST, port))
                return port
            except OSError:
                continue
    raise OSError(f"No free port between {start} and {start + 19}")


def main() -> int:
    requested = int(os.environ.get("PORT", DEFAULT_PORT))
    try:
        port = pick_port(requested)
    except OSError as exc:
        print(exc, file=sys.stderr)
        return 1
    server = HTTPServer((HOST, port), DevHandler)
    print(f"http://{HOST}:{port}/")
    print("PUT /data/state.json enabled. Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
