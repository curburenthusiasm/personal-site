---
title: Data governance gates
slug: data-governance-gates
summary: Customer-configuration and SKU-creation gates that stop incomplete master data before it reaches production schedules.
status: in-progress
featured: false
tags: [data]
stack: [Power Apps, SQL Server, governed rule tables]
diagram: true
order: 4
---

## Problem

Incomplete customer configuration and SKU records create downstream scheduling errors and repeated manual investigation. Catching the omission after it has entered the workflow is more expensive than preventing it at the point of setup.

## Constraints

The app must remain simple and delegation-safe, while the rules need an auditable source of truth. Existing scheduled reports contain hard-coded conditions that are difficult to trace back to an owner or business rationale. Internal database, server, and customer names are omitted.

## Approach and Architecture

The setup flow uses two ordered gates: G0 Customer Configuration must pass before G1 SKU creation becomes available. Power Apps presents the workflow over SQL Server, while the core business logic is kept in views and rule tables.

The governing principle is **“SQL decides, the app displays.”** App queries use delegation-safe equality filters; the application does not duplicate the decision logic in a large client-side expression. The next step is replacing hard-coded report conditions with a governed lead-time rule table and a resolved view that records provenance and maps each rule to the reports it drives.

## What’s interesting

- Gates encode prerequisite order instead of relying on a checklist in someone’s memory.
- A resolved view keeps reporting and the app aligned on the same rule interpretation.
- Rule provenance makes it possible to ask who owns a rule and where its effects appear.

## Results / Status

The customer-configuration and SKU gates are the established pattern. The governed lead-time table, resolved view, provenance record, and report map remain in progress; they are not described as completed.

## Lessons

Client-side logic is a poor home for decisions that affect multiple reports and workflows. Put policy in a reviewable data layer and let each interface present the resolved result.
