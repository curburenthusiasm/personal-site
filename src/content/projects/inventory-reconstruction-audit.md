---
title: Inventory reconstruction and audit engine
slug: inventory-reconstruction-audit
summary: A forensic inventory model that rebuilds SKU balances from a known baseline plus subsequent production and shipment activity.
status: production
featured: false
tags: [inventory, sql, audit]
stack: [SQL Server, Python, Power BI]
diagram: true
order: 4
---

## Problem

When inventory counts drift, a current balance alone does not explain why. The useful question is whether the balance can be reconstructed from an accepted starting point and every subsequent movement.

## Approach

I built audit logic that starts from a known SKU baseline and applies later shipment and production activity in sequence. Duplicate transaction handling, null model or size values, and historical reconstruction are treated explicitly rather than ignored.

## What’s interesting

- The model produces an explainable running balance instead of a black-box adjustment.
- Duplicate removal is deterministic and reproducible.
- The same logic can feed both detailed audit output and executive Power BI reporting.

## Results / Status

The process has been used to audit manufacturing inventory and isolate where system balances diverge from reconstructed operational history.
