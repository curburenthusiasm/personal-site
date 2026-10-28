---
title: Judge-gated MCP tools for shipping actions
slug: judge-gated-shipping-mcp
summary: A model-context tool surface for shipping queries and writes, with a Judge approval boundary before actions that spend money.
status: concept
featured: false
tags: [agentic, security]
stack: [Model Context Protocol, REST APIs, server-side credentials, Judge agent]
diagram: false
order: 7
---

## Problem

An agent can help compare shipping options, create a shipment, print a label, or retrieve tracking. Those capabilities do not carry the same risk: reading rates is informational, while printing a label can spend real money and create an external commitment.

## Constraints

The tool interface should be narrow, credentials must remain server-side, and the approval policy should distinguish reversible reads from consequential writes. The proposal should be auditable without embedding business credentials in a prompt or client application.

## Approach and Architecture

A small MCP server wraps a shipping REST API with four tools: `get_rates`, `create_shipment`, `print_label`, and `get_tracking`. Credentials are held by the server. The Judge evaluates a proposed write against the request, returned quote, and policy; actions such as printing a label require explicit approval before execution.

## What’s interesting

- Capabilities are separated by consequence rather than bundled into one broad “ship” tool.
- A standalone server makes credential custody and approval checks explicit.
- Read-only operations can remain low-friction while money-spending actions cross a human boundary.

## Results / Status

This is a design concept, not a deployed service. No live shipping credentials or external account details are part of this portfolio.

## Lessons

An agent tool is part of the authorization system. The API wrapper should express which actions are observations, which mutate state, and which require a person to approve.
