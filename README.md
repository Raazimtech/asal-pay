# Asal Pay

Asal Pay is a browser-based digital wallet interface built with HTML, CSS, and vanilla JavaScript.

## Current features

- Account registration with a Somali mobile number and password
- Phone-number validation for `+252 6x xxxxxxx` mobile numbers
- Sign in and sign out
- Individual wallet balances
- Peer-to-peer transfers between registered accounts
- Transaction history for both sender and recipient
- Payment requests between registered accounts
- Profile and wallet ID
- Responsive mobile-first interface
- Local browser persistence
- Inline SVG interface icons

## Important deployment note

This version is a functional wallet prototype that stores account and wallet data in the browser's localStorage. It does **not** move real money and must not be presented as a production financial service.

For real-money operation, the application needs a secure server-side backend, production authentication/password hashing, a real payment-provider API, webhooks, transaction idempotency, database transactions, reconciliation, rate limits, fraud controls, audit logs, and secure secret storage. Payment-provider credentials must never be exposed in frontend JavaScript.

Built for Asal Pay by Raazim Tech.