---
title: Failure-mode-derived research infrastructure
slug: failure-mode-research-infrastructure
summary: A research system designed by cataloguing 33 failure modes first, then deriving explicit countermeasures and falsifiable tests.
status: research
featured: true
tags: [research, agentic]
stack: [Python, SQL, OpenTimestamps, known-answer tests]
diagram: false
order: 3
---

## Problem

Agentic research systems can produce confident-looking output while the data, state, or evaluation is wrong. A useful research system needs to distinguish a falsifiable result from a plausible narrative and make it difficult to begin confirmatory work before the measurement path is known to function.

## Constraints

The system must keep research separate from production and money movement, preserve the confirmatory clock, and make operational failures visible. The work is about methodology and infrastructure only: no positions, personal balances, broker details, performance claims, or trade recommendations are included.

## Approach and Architecture

The design starts from inversion: assume the research effort fails, enumerate 33 ways that could happen, and derive each component as a named countermeasure. The failure catalogue spans five classes: statistical and epistemic mistakes, state and infrastructure failures, agent-layer failures, risk controls, and operator process.

Hypotheses are recorded and hashed before testing, then anchored with OpenTimestamps so their wording cannot be silently revised after results are seen. Examples include H-BTC-TAIL-1, about whether tail insurance is fairly priced in BTC options, and H-GAP-LEAD-1, about whether overnight-gap variance share rises before realized-volatility regime breaks.

The most likely failure identified was not statistical: it was spending too long building infrastructure before doing science. The countermeasure is a Known-Answer-Test gate enforced by a database trigger. A volatility-risk-premium gate for major index ETFs was also evaluated daily and iterated through four versions; this is a methodology note, not a result claim.

## What’s interesting

- The failure catalogue constrains architecture before implementation scope expands.
- Pre-registration hashes and timestamps fix the confirmatory question before observations arrive.
- A database trigger makes the known-answer prerequisite enforceable instead of relying on a calendar reminder.

## Results / Status

The failure-mode analysis, pre-registration workflow, and gate design are documented research infrastructure. Hypothesis outcomes are not reported here. No P&L, positions, account data, or recommendations are presented.

## Lessons

The first correctness test should validate the measuring instrument, not the hypothesis. If a known-answer test cannot pass, additional infrastructure does not make later results more credible.
