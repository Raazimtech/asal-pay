# Asal Pay

Functional static web-app MVP for a digital wallet demonstration.

## Stack
- HTML
- CSS
- Vanilla JavaScript
- Supabase Auth + Postgres
- PWA manifest

## Demo behavior
New users receive **$1,000 virtual USD** through the Supabase database trigger. Users can send virtual money to another registered Asal Pay user by email. Transfers are performed by the `asal_send_money` database function and appear in transaction history.

**No real money is moved.** Production payment rails must be integrated separately with the client's licensed payment provider.

## Deployment
This repository is intentionally build-free so it can be served directly by GitHub Pages.