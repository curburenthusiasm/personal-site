---
title: UKG RFID attendance integration
slug: ukg-rfid-attendance-integration
summary: An API-based attendance workflow that converts RFID kiosk events into authenticated UKG Ready time punches with normalized timestamps.
status: prototype
featured: false
tags: [integration, workforce, automation]
stack: [UKG Ready, RFID, Python, REST API]
diagram: true
order: 10
---

## Problem

Physical attendance events need to become trustworthy workforce records without manual entry or ambiguous device timestamps.

## Approach

I developed an integration path from an RFID kiosk into UKG Ready using authenticated API calls, account-aware payloads, UTC timestamp normalization, punch types, and terminal identifiers.

## What’s interesting

- Device identity is preserved alongside each punch.
- Timestamp handling is explicit so local device time does not silently corrupt attendance history.
- The integration treats the kiosk as an event source rather than embedding business logic in the device itself.

## Results / Status

The API workflow and payload structure were validated as a prototype for automated attendance capture and broader workforce-system integration.
