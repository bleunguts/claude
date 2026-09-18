# Getting Started

## Overview

The Fictional Payments API lets you accept charges, issue refunds, and listen for payment events. This guide walks you through your first successful charge.

## Prerequisites

You need an API key from the developer dashboard. Keep it server-side; never embed it in a client application.

## Your first charge

Send a POST request to `/charges` with an amount and currency. You will receive a charge object with a unique `id` and a `status` of either `pending` or `succeeded`.

## Request

```http
POST /v2/charges
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "amount": 1999,
  "currency": "usd",
  "customer_id": "cus_abc123"
}
```

## Response

```json
{
  "id": "ch_xyz789",
  "amount": 1999,
  "currency": "usd",
  "status": "succeeded"
}
```

## Errors

See [Error Codes](./error-codes.md) for the full list of error responses.

## Next steps

- Read [Authentication](./authentication.md) for credential management.
- Read [Webhooks](./webhooks.md) to listen for payment events.
