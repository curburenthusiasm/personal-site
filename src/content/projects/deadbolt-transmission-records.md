---
title: DeadBolt — tamper-evident transmission records
slug: deadbolt-transmission-records
summary: Hash each EDI transmission and anchor its custody record to a public timechain, making delivery disputes independently verifiable.
status: prototype
featured: true
tags: [security, edi]
stack: [X12 EDI, SHA-256, OpenTimestamps, Bitcoin timechain]
diagram: true
order: 2
---

## Problem

After an EDI connection migration, a large online retailer stopped receiving invoices for roughly three months. The sender had transmitted correctly and followed up repeatedly, but had no independent evidence that could settle the dispute. The gap was eventually found in a CSV export, while remediation still fell to the sender.

The underlying problem is broader than one integration: without an independently verifiable record, each party can tell a plausible story about what crossed a boundary.

## Constraints

An audit trail must avoid exposing invoice contents publicly, remain useful even when a partner disputes receipt, and let a third party verify the evidence without trusting the sender’s database. Public material here uses no real partner identifiers or documents.

## Approach and Architecture

DeadBolt models a six-step custody chain for each document: capture the outbound artifact, normalize the bytes being attested, compute a cryptographic hash, record transmission metadata, anchor the hash commitment, and retain a verification receipt. OpenTimestamps can anchor a commitment to the Bitcoin public timechain. The chain proves that the committed bytes existed no later than the anchor; it does not claim that a receiver processed the document.

### Synthetic X12 810 excerpt

```text
ST*810*0001~
BIG*20261001*INV-TEST*20260930*PO-TEST~
N1*BT*EXAMPLE BUYER~
IT1*1*2*EA*10.00**VP*ITEM-TEST~
TDS*2000~
SE*5*0001~
```

Stamp and verify the synthetic document’s proof file:

```sh
ots stamp sample-810.edi
ots verify sample-810.edi.ots
```

## What’s interesting

- Hashes bind the evidence to exact bytes without publishing business content.
- A custody chain separates “we sent it” from “they received or processed it.”
- The verification walkthrough is designed so an independent party can repeat the check.

## Results / Status

The concept and verification path have been explored with a synthetic X12 invoice and a public timechain proof. This page does not claim a production deployment. Extensions considered include carrier handoffs, physical fulfillment, and device-firmware attestation.

## Lessons

When parties disagree, a sender-controlled log is weaker than a commitment that another person can verify. Define exactly what an anchor proves—and what it does not—before calling it evidence.
