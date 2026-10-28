---
title: Pre-register your engineering decisions
slug: preregister-engineering-decisions
description: "Borrow hypothesis pre-registration for consequential technical choices: write the claim, test, and reversal condition before seeing the result."
pubDate: 2026-10-28
draft: true
category: Research methods
---

Engineering decisions are often made under uncertainty, then explained afterward as if the answer had been obvious. A small amount of pre-registration can make the reasoning more honest. Before a migration, experiment, or architecture choice, write down the claim being tested, the expected observations, and what result would change the decision.

This does not require turning every code review into a research paper. A useful record can fit in a short note: the question, the alternatives, the metric, the measurement window, the known constraints, and the reversal condition. For a database change, the question might be whether a resolved view can replace a set of report-specific rules without changing outputs for the checked sample. For a failover design, it might be whether two nodes can carry the required workload during a single-node failure.

The key is to choose the measure before seeing the result. If the metric is selected after a test, it is easy to emphasize the one that supports the preferred outcome. A prewritten acceptance check narrows that freedom. It also makes it easier to distinguish a confirmatory test from exploratory debugging.

Hashing the hypothesis and anchoring the hash with a public timestamp creates a tamper-evident marker for the original wording. The timestamp does not prove the hypothesis is good or that the test is valid. It proves only that a particular commitment existed by a particular time. Preserve the full text and the hash so another person can verify the relationship.

Pre-registration is especially useful when a project has strong sunk costs or organizational momentum. If a migration is already underway, the team may unconsciously redefine success to fit what has been built. A reversal condition gives the project a fair way to stop, simplify, or return to an earlier option.

The record should include assumptions and exclusions. A test that only covers synthetic inputs cannot establish production performance. A benchmark from one workload does not prove another workload behaves the same. Stating limits is not a weakness; it defines what the evidence can support.

After the decision, compare the observed outcome with the preregistered expectation. Explain deviations and whether they changed the conclusion. Keep exploratory results, formal acceptance results, and later interpretations distinct.

The point is not to remove engineering judgment. It is to preserve the question that judgment was answering, so future reviewers can tell whether the evidence changed the decision or the decision changed the story.
