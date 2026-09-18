# Charges

## Overview

A charge represents a single payment from a customer. This document describes how to create, retrieve, and list charges.

## Request

To create a charge, send a POST to the charges endpoint:

```http
POST /v1/charges
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "amount": 1999,
  "currency": "usd",
  "customer_id": "cus_abc123",
  "description": "Annual subscription"
}
```

To retrieve a charge by ID:

```http
GET /v1/charges/ch_xyz789
Authorization: Bearer <api_key>
```

## Response

A successful POST returns the created charge object:

```json
{
  "id": "ch_xyz789",
  "amount": 1999,
  "currency": "usd",
  "status": "succeeded",
  "customer_id": "cus_abc123"
}
```

The `status` field is one of `pending`, `succeeded`, or `failed`.

## Errors

| Code | Reason |
|------|--------|
| 400  | Invalid request body (e.g., missing required field) |
| 402  | Card declined |
| 404  | Charge not found |
