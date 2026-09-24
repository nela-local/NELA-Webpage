# Tally connector

NELA connects to **TallyPrime** so Indian MSME owners can ask money questions in plain language — without replacing Tally or uploading full books to a random cloud ERP.

## What it does

- **Read-only** access to live books over TallyPrime’s **HTTP Server** (usually `127.0.0.1:9000`).
- Answers for cash / bank, debtors & creditors outstanding, sales, trial balance, daybook, and related ledgers.
- On **NELA Cloud**: live **HTML dashboard** (KPIs + charts that refresh from Tally) and **Excel export** (including template matching for CA packs).
- In **Private** mode: plain-language **text** summaries from live reads — not live dashboard / Excel file generation.

NELA **never writes vouchers**.

## Requirements

1. TallyPrime installed on the same Windows PC (or reachable localhost).
2. Company open in Tally.
3. **HTTP Server** enabled in Tally (port typically `9000`).
4. NELA desktop app open → **Settings → Connections → Connect Tally**.

## How to connect

1. In TallyPrime, enable the HTTP Server feature and note the port.
2. In NELA, open Connections and choose **Connect Tally**.
3. Confirm the host/port (default `127.0.0.1:9000`).
4. Approve Tally access when NELA asks — each sensitive read can show a confirm card.
5. Ask, for example: *“How much cash and bank do we have today?”* or *“Who owes us the most?”*

## Private vs Cloud for Tally

| Capability | Private | Cloud |
|---|---|---|
| Connect HTTP Server | Yes | Yes |
| Plain-language Q&A | Yes (text) | Yes |
| Live HTML dashboard | No | Yes |
| Excel export for CA | No | Yes |

Prompts and chat attachments leave the device only when you use Cloud (disclosure shown in-app).

## Pricing (Early Access)

List price for the **Tally Connector** add-on is **₹299/mo** or **₹2,999/yr**. Billing is not open yet — Early Access means the connector works in the desktop app today. Cloud Starter / Pro and credit packs are available on [Pricing](/pricing).

## What NELA is not

- Not a Tally replacement
- Not a full GST filing product (partner with your CA)
- Not a writer of vouchers or silent book changes

## Related

- [Welcome](/docs/what-is-it)
- [Private vs Cloud](/docs/features/private-vs-cloud)
- [Create files](/docs/features/artifacts) — Excel and other artifacts on Cloud
- [Get started](/docs/installation)
