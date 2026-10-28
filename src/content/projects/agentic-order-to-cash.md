---
title: Agentic order-to-cash platform
slug: agentic-order-to-cash
summary: A seven-agent EDI workflow for a mid-market manufacturer, with a Judge that scores decisions and feeds failure lessons back into the system.
status: production
featured: true
tags: [agentic, edi, data]
stack: [X12 EDI, Sage 100, ROI InSynch, Supabase, Tray.io, ShipStation, Orderful, Logicbroker]
diagram: true
order: 1
---

## Problem

Retail trading partners send orders as X12 EDI. Each order must enter an ERP, be acknowledged, shipped, described in an advance ship notice, and invoiced according to the applicable partner rules. A missed or malformed step can become a chargeback or an operational exception that is difficult to see until much later.

## Constraints

Documents have partner-specific requirements, while the workflow crosses systems with different state models. Replays must not duplicate writes. Agents need enough context to resolve routine cases, but consequential decisions need a measurable boundary and a path for learning from failure. Employer, customer, partner, endpoint, and host details are intentionally omitted.

## Approach and Architecture

The pipeline receives X12 850 purchase orders and supports corresponding 997, 855, 856, and 810 documents. A persistent order state machine tracks progress and an event stream records changes. An idempotent sync orchestrator mediates Sage 100 reads and writes through ROI InSynch. Partner specifications guide document generation. Shipping and EDI-network integrations are coordinated through an orchestration layer.

Seven agents cover operational monitoring and supporting order-to-cash tasks, including EDI watching, lead-time checks, inbox classification, and executive summaries. A Judge scores decisions against an explicit reward function. When a decision fails, a structured lesson is retained and supplied as context for later work.

## What’s interesting

- Idempotency is treated as a system contract, so safe reruns are part of the design rather than an operator convention.
- The Judge evaluates autonomy against stated criteria instead of routing every decision through blanket human review.
- Failure lessons are queryable data that change future context, not notes lost in a postmortem document.

## Results / Status

A production run sent ASNs cleanly, with idempotency verified. The same run exposed dozens of sales orders that had not imported to the ERP. That gap was not hidden by a successful downstream send; it became visible as an actionable system finding. Four business-value streams were modeled—chargeback reduction, avoided headcount, onboarding speed, and revenue acceleration—but no dollar estimate is published here.

## Lessons

Automation earns trust when it reveals the gaps between systems as well as moving data through them. A successful step should not be allowed to imply that the entire workflow is healthy.
