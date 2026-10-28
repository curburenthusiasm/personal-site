---
title: Hutton cipher research toolkit
slug: hutton-cipher-research
summary: A research toolkit for reproducing known Hutton cipher test vectors and exploring unresolved historical ciphertext with automated analysis.
status: research
featured: false
tags: [research, cryptography, history]
stack: [Python, Constraint Search, Statistical Analysis]
diagram: false
order: 9
---

## Problem

Historical cipher work is easy to overstate: reproducing a known decode is not the same as solving an unresolved message. I wanted tooling that could separate validated mechanics from speculative search.

## Approach

I reproduced known Hutton cipher test material, built code to explore candidate transformations, and organized the problem so hypotheses can be tested against known examples before being applied to unresolved ciphertext.

## What’s interesting

- Known vectors are used as regression tests for the cipher mechanics.
- Search hypotheses can be rejected quickly when they fail known material.
- Historical context and computational experimentation are kept together without claiming a solution that has not been demonstrated.

## Results / Status

The research tooling works and the investigation is ongoing. No claim is made that the unresolved Hutton material has been solved.
