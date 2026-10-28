---
title: Sports-picks feed publisher
slug: sports-picks-publisher
summary: Selected free-channel bot outputs flow to a public site feed only after the corresponding Discord post succeeds.
status: in-progress
featured: false
tags: [agentic, data]
stack: [Scheduled jobs, Discord, JSON feed, GitHub Pages]
diagram: false
order: 9
---

## Problem

Automated picks are easy to mistake for a current recommendation or a measured edge. A public display needs to show what was actually posted, when it was posted, and which parts are bot-reported metadata rather than independently calibrated probabilities.

## Constraints

Only selected free-channel output is published. Private-channel content, bankrolls, stakes, and unsupported performance claims stay out of the feed. A failed Discord send must not appear as a successful public publication.

## Approach and Architecture

After a corresponding free-channel Discord post succeeds, the publisher writes the selected output into a versioned JSON feed in this site repository. The `/picks/` page polls that feed every minute and offers a manual refresh. It labels the bot’s score as a score, not a calibrated probability, and marks older slates so they are not confused with current output.

## What’s interesting

- Publication is downstream of the successful channel post, reducing divergence between the two surfaces.
- The feed contains selected public output rather than raw model state.
- Timestamps and staleness labels are part of the user interface, not hidden metadata.

## Results / Status

The website feed is live and refreshable. The source repository has no remote configured, so no source link is provided. No betting performance or profitability claim is made.

## Lessons

Displaying predictions responsibly is a data-governance problem: publish only the intended channel, preserve the timestamp, and distinguish a model score from validated performance.
