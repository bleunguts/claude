# Error Codes

## Overview

This document lists all error codes the Fictional Payments API can return and what each one means.

## Request

Errors are returned as JSON with an `error` object:

```json
{
  "error": {
    "code": "invalid_request_error",
    "message": "Missing required field: amount",
    "doc_url": "https://docs.fictional-payments.example/errors/invalid_request_error"
  }
}
```

## Response

The HTTP status indicates the broad category; the `error.code` narrows it down.

## Errors

| HTTP | error.code             | Meaning |
|------|------------------------|---------|
| 400  | invalid_request_error  | Malformed body, missing field, or unknown field |
| 401  | authentication_error   | Missing or invalid credentials |
| 402  | card_declined          | The customer's card was declined |
| 403  | permission_error       | Key lacks permission for this resource |
| 404  | resource_not_found     | The requested resource does not exist |
| 409  | invalid_state          | Resource is not in a state that allows this operation |
| 422  | validation_failed      | Request well-formed but semantically invalid |
| 429  | rate_limited           | Too many requests |
| 500  | server_error           | An unexpected server error |
