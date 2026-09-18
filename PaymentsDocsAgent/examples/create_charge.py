"""Example: create a charge against the Fictional Payments API."""

import os
import requests

API_KEY = os.environ["FICTIONAL_PAYMENTS_API_KEY"]
BASE_URL = "https://api.fictional-payments.example/v2"


def create_charge(customer_id: str, amount_cents: int, currency: str = "usd") -> dict:
    """Create a charge for the given customer.

    Args:
        customer_id: The customer to charge.
        amount_cents: Amount in the smallest currency unit (e.g., cents for USD).
        currency: ISO 4217 currency code, lowercased.
    """
    response = requests.post(
        f"{BASE_URL}/charges",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "amount_cents": amount_cents,
            "currency": currency,
            "customer_id": customer_id,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    charge = create_charge(customer_id="cus_abc123", amount_cents=1999)
    print(f"Created charge {charge['id']} for {charge['amount']} {charge['currency']}")
