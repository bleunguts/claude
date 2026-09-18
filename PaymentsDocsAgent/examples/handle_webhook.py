"""Example: a minimal Flask endpoint that receives Fictional Payments webhooks."""

import os
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = os.environ["FICTIONAL_PAYMENTS_WEBHOOK_SECRET"]


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the X-Signature header against the webhook secret."""
    # See the developer dashboard for the verification algorithm.
    # Pseudocode for illustration; real implementation uses HMAC-SHA256.
    return signature == f"sha256={WEBHOOK_SECRET}"


@app.post("/webhooks")
def handle_webhook():
    signature = request.headers.get("X-Signature", "")
    if not verify_signature(request.data, signature):
        abort(401)

    event = request.get_json()
    event_type = event.get("type")

    if event_type == "charge.succeeded":
        print(f"Charge succeeded: {event['data']['id']}")
    elif event_type == "charge.failed":
        print(f"Charge failed: {event['data']['id']}")
    elif event_type == "payment.disputed":
        print(f"Payment disputed: {event['data']['charge_id']}")
    else:
        print(f"Unhandled event type: {event_type}")

    return "", 204


if __name__ == "__main__":
    app.run(port=3000)
