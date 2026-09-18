# Refunds

## Overview

A refund returns funds to the customer for a previously successful charge. You can refund a charge in full or in part.

## Request

To refund the full amount of a charge:

```http
POST /v2/charges/ch_xyz789/refunds
Authorization: Bearer <api_key>
Content-Type: application/json

{}
```

To refund a partial amount, include the `amount` field:

```http
POST /v2/charges/ch_xyz789/refunds
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "amount": 500,
  "reason": "Customer requested partial refund"
}
```

## Response

```json
{
  "id": "re_abc456",
  "charge_id": "ch_xyz789",
  "amount": 500,
  "status": "succeeded"
}
```

## Errors

| Code | Reason |
|------|--------|
| 400  | Refund amount exceeds remaining refundable balance |
| 404  | Charge not found |
| 409  | Charge is not in a refundable state |
