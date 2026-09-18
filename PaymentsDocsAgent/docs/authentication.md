# Authentication

## Overview

All requests to the Fictional Payments API must be authenticated. This document explains how to authenticate your requests.

## Request

Include your API key in the `X-API-Key` header on every request:

```http
GET /v2/charges/ch_xyz789
X-API-Key: sk_live_abc123def456
```

## Key types

- **Live keys** begin with `sk_live_` and operate on real funds.
- **Test keys** begin with `sk_test_` and operate in the sandbox.

## Response

If the key is missing or invalid, the API returns a `401 Unauthorized`.

## Errors

| Code | Reason |
|------|--------|
| 401  | Missing or invalid API key |
| 403  | Key lacks permission for the requested resource |

## Rotating keys

You can rotate keys from the developer dashboard. Old keys remain valid for 24 hours after rotation.
