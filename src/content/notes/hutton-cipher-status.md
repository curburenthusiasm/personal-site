---
title: "Hutton Cipher: What Has—and Hasn’t—Been Verified"
slug: hutton-cipher-status
description: An official test vector is reproduced, but no verified solution to MysteryTwister Part 5 is documented.
pubDate: 2026-10-27
draft: false
category: Research status
---

## What is established

The research target is the Hutton cipher challenge identified as MysteryTwister C3 Part 5. An official FEDORA/JUPITER test vector has been reproduced. That is a useful implementation check: it shows that a specific path through the cipher behaves as expected for the published example.

It is not a solution to the challenge. A test vector confirms one known input/output relationship; it does not establish that a key or plaintext for the target has been found.

## What is not established

No verified Part 5 key or plaintext is documented here, and no solve is claimed. Candidate output remains a hypothesis until it passes an acceptance test that connects the candidate back to the published challenge.

## Proposed acceptance test

A candidate should decrypt the published challenge, then re-encrypt the resulting plaintext with the proposed key and reproduce the exact published ciphertext. The inputs, code revision, candidate, and output should be retained so another person can rerun the check.

Exact re-encryption is valuable because it can catch a plausible-looking but incorrect plaintext, a transcription error, a key-format mistake, or an implementation mismatch. If it fails, the candidate is not a near-solution; it is an unverified attempt.

## What would change this status

A useful update needs a reproducible candidate, the exact challenge inputs, and a passing re-encryption check. If the candidate depends on choices or assumptions, those should be stated rather than hidden in the implementation. Until that evidence exists, the status remains unsolved.

The distinction is intentionally conservative. Research updates should make it easier to tell the difference between a tool that runs, a method that passes a known-answer test, and a result that actually answers the research question.
