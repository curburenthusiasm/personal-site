---
title: Epistemic gates for LLM outputs
slug: epistemic-gates-for-llm-outputs
description: Treat model output as staged evidence that must earn promotion from unverified to checked to trusted.
pubDate: 2026-10-28
draft: true
category: Agentic systems
---

Language models are good at producing complete-looking answers from incomplete evidence. The problem is not only that an answer can be wrong. It is that presentation quality can make an unverified output feel as if it has already passed review.

A practical response is to treat output as moving through epistemic gates. “Unverified” means a model produced a claim, but the system has not checked its inputs or result. “Checked” means a defined validation ran and passed. “Trusted” means the evidence is adequate for a specific use, with a known scope and freshness window. These labels are about the evidence behind the output, not a permanent measure of model quality.

Each gate needs a contract. For a document extraction, the unverified result may be text and proposed fields. A checked result could require schema validation, cross-field consistency, and source-document offsets. Trusted may require a human approval for a consequential write or a stable record that a downstream system accepted the values. A check that only confirms JSON syntax cannot promote a business decision to trusted.

The gate should fail closed when its validator throws an exception or required source data is missing. A fallback such as “assume valid” makes the process look robust while weakening the meaning of every later status. Preserve the failed attempt, error category, and retry state so an operator can distinguish no data from bad data and from a checker outage.

A Judge agent can help evaluate whether a decision followed a reward function, but the Judge itself needs evidence and boundaries. Store the policy version, inputs, decision, and evaluation separately. Do not let a model’s self-description count as proof that its answer was checked. Prefer a deterministic check when the property is deterministic, and make the human approval step explicit where judgment is unavoidable.

Freshness is part of the gate. A once-verified metric or policy statement can become stale. Store when it was observed, which source supplied it, and the maximum useful age for the intended decision. “Trusted at the time” is not the same as “current now.”

This staged model does not solve every reasoning problem. It does prevent an important category error: treating generated output as equivalent to verified fact. The interface should expose what gate was passed and what remains unchecked. Users can then decide whether the available evidence is sufficient for the next action.

Promotion should be earned, scoped, and reversible. If later evidence contradicts a trusted value, the system needs a way to invalidate it and show which downstream decisions relied on it.
