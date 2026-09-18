# Webhooks

## Overview

Webhooks let your server receive real-time notifications when events occur in the Fictional Payments API. Subscribe by configuring an HTTPS endpoint in the developer dashboard or via the API.

## Events

The following events are emitted:

- `charge.succeeded` — a charge has succeeded
- `charge.failed` — a charge failed
- `payment.disputed` — a payment has been disputed by the customer

## Request

To subscribe to events programmatically:

```http
POST /v2/webhooks
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "url": "https://your-server.example/webhooks",
  "events": ["charge.succeeded", "charge.failed"]
}
```

## Response

```json
{
  "id": "wh_xyz123",
  "url": "https://your-server.example/webhooks",
  "events": ["charge.succeeded", "charge.failed"],
  "status": "active"
}
```

## Errors

| Code | Reason |
|------|--------|
| 400  | Invalid URL or unknown event name |
| 422  | Endpoint failed verification ping |

## Verification

Each webhook delivery includes an `X-Signature` header that you can verify against your endpoint secret. See the dashboard for details.
