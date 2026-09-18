"""Local mock of the two external services used by the docs agent demo.

Endpoints:
  GET  /release-notes/<version>   returns {"changes": [{"area", "change"}, ...]}
  POST /issues                    accepts a docs issue, returns {"id": ...}

Behavior that the demo depends on:
  - Both endpoints require the header  Authorization: Bearer demo-token.
    The agent can provide that value through DOCS_SERVICE_TOKEN or the
    local fallback in the wrapper.
  - /release-notes deterministically answers 429 with Retry-After: 1 on
    the first call after startup, so the first call of every fresh run
    trips the retry path in the agent's wrapper. Restart this service
    before each recording so the counter starts at zero.

Run with:  python mock_service/app.py
Stdlib only; nothing to install, no environment variables to set.
The expected token is hardcoded below; the agent process sets
DOCS_SERVICE_TOKEN=demo-token to match. A real service checks
credentials from its own store, not from your environment, so the
hardcoded value is also the more honest mock.
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8765
TOKEN = "demo-token"  # the agent process sends this via DOCS_SERVICE_TOKEN

# Release notes for the current version. Each entry is one change the
# docs agent should compare against docs/charges.md.
RELEASE_NOTES = {
    "changes": [
        {
            "area": "charges",
            "change": (
                "The idempotency header is renamed from X-Idempotency-Key "
                "to Idempotency-Key."
            ),
        },
        {
            "area": "charges",
            "change": (
                "POST /charges now returns a risk_score field on every "
                "successful response."
            ),
        },
        {
            "area": "charges",
            "change": (
                "The currency parameter no longer defaults to USD; it is "
                "required on every request."
            ),
        },
    ]
}

release_notes_calls = 0  # drives the deterministic 429 pattern
next_issue_number = 101  # DOC-101, DOC-102, ...


class MockServiceHandler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self):
        if self.headers.get("Authorization") == f"Bearer {TOKEN}":
            return True
        self._send_json(401, {"error": "missing or invalid bearer token"})
        return False

    def do_GET(self):
        global release_notes_calls
        if not self.path.startswith("/release-notes/"):
            self._send_json(404, {"error": "unknown endpoint"})
            return
        if not self._authorized():
            return
        release_notes_calls += 1
        # The first call of a fresh run is rate limited so the retry
        # path is always visible. Restart the service before each take.
        if release_notes_calls == 1:
            self._send_json(
                429,
                {"error": "rate limited"},
                extra_headers={"Retry-After": "1"},
            )
            return
        self._send_json(200, RELEASE_NOTES)

    def do_POST(self):
        global next_issue_number
        if self.path != "/issues":
            self._send_json(404, {"error": "unknown endpoint"})
            return
        if not self._authorized():
            return
        # Consume the body; the mock does not need to inspect it.
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        issue_id = f"DOC-{next_issue_number}"
        next_issue_number += 1
        self._send_json(201, {"id": issue_id})

    def log_message(self, fmt, *args):
        pass  # keep the demo terminal quiet; the agent output is the show


if __name__ == "__main__":
    print(f"mock service listening on http://localhost:{PORT}")
    HTTPServer(("localhost", PORT), MockServiceHandler).serve_forever()