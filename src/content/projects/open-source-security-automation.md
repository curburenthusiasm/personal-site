---
title: Open-source security automation
slug: open-source-security-automation
summary: A public multi-agent framework for authorized security testing and research, with project notes that distinguish shipped behavior from experiments.
status: prototype
featured: false
tags: [security, agentic]
stack: [Python, multi-agent orchestration, security testing]
diagram: false
order: 8
repoUrl: https://github.com/curburenthusiasm/T3MP3ST
---

## Problem

Security testing spans many specialized tools and investigation steps. An agentic framework can coordinate that work, but an opaque chain of model decisions is not a substitute for clear authorization, observable execution, and reproducible results.

## Constraints

Testing must remain within authorized scope. The public repository is the source of truth for current features; this case study avoids implying that every experimental capability is production-ready or independently validated.

## Approach and Architecture

The project coordinates security-testing workflows through a multi-agent framework and supporting tools. Its role is to organize authorized research and make activity inspectable, not to bypass scope or treat model output as evidence by itself.

## What’s interesting

- Project status is documented separately from roadmap ideas.
- The public repository provides a reviewable implementation surface.
- Authorization and validation remain external requirements, not assumptions made by an agent.

## Results / Status

The source is public and actively maintained. Feature-level claims should be checked against the linked repository and its current documentation.

## Lessons

Security automation needs explicit scope and evidence at each stage. Tool execution is not proof that a finding is correct.
