---
title: Turning orchestrator judgment into worker rules
slug: turning-orchestrator-judgment-into-worker-rules
description: Convert recurring one-off decisions into explicit, testable worker-agent rules without pretending that the first judgment was infallible.
pubDate: 2026-10-28
draft: true
category: Agentic systems
---

An orchestrator often begins as the part of an agent system that notices ambiguity and decides what should happen next. That is useful during discovery: the system encounters an unfamiliar state, gathers context, and chooses a path. But if the same decision recurs, leaving it buried in orchestrator reasoning makes the system harder to predict and audit.

The opportunity is to turn a judgment into a rule. The safe path is not to copy the first answer into a prompt and call it policy. Capture the decision, the context available at the time, the evidence that supported it, and the outcome. Then look for a stable condition that another worker can evaluate deterministically.

For example, an orchestrator may observe that a document was already acknowledged and choose not to resend it. A worker rule can state that a verified acknowledgment for the same idempotency key suppresses a duplicate write. The rule should name its inputs, the scope of the key, and what happens when the evidence is missing. It should also have examples for both allowed and rejected cases.

The state substrate matters. A durable store such as Supabase can keep the current order state, event history, evaluation result, and failure lesson in separate records. The worker should receive only the relevant facts, not an unbounded transcript. That makes it possible to replay a case, compare versions of the rule, and ask whether the rule caused a later failure.

The Judge has a different job from the worker. It evaluates whether a decision met a declared reward function and records misses with enough detail to improve future behavior. It should not silently rewrite the rules during the same evaluation it is judging. Otherwise the system can redefine success after observing the result.

There is also a human boundary. A rule that decides whether a duplicate read can be skipped is not equivalent to one that spends money or changes a customer-facing commitment. Convert judgment into rules first for low-risk, observable decisions. Keep a person in the loop when the consequence is material or the evidence is ambiguous.

This method improves when failures are treated as data rather than embarrassing exceptions. Store what was expected, what was observed, what the worker did, and how the outcome was checked. A lesson becomes a rule only after review and a test that would have caught the original failure.

The goal is not to eliminate judgment. It is to make recurring judgment legible, bounded, and repeatable—while preserving the ability to recognize when a case falls outside the rule.
