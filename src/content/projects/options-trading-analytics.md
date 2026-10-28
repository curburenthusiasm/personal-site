---
title: Options trading analytics and risk engine
slug: options-trading-analytics
summary: A personal analytics system that parses brokerage activity, measures ticker-level edge, and converts historical performance into risk tiers and sizing rules.
status: in-progress
featured: false
tags: [quant, analytics, trading]
stack: [Python, Google Sheets, Monte Carlo, Fidelity Exports]
diagram: false
order: 7
---

## Problem

Brokerage activity reports show transactions, not whether a trading process has a repeatable edge. I wanted a system that could separate strategy types, reconstruct P&L, compare performance by ticker, and turn historical results into explicit risk rules.

## Approach

I built parsing and analytics around brokerage exports and activity statements, including opening and closing option transactions, stock activity, and covered calls. The resulting dashboard tracks trade count, win rate, losses, profit factor, net wins and losses, P&L by ticker, and tiered risk limits.

## What’s interesting

- Risk sizing is driven by observed strategy performance instead of a single fixed percentage.
- Monte Carlo simulation is used to stress bankroll and scaling assumptions.
- Strategy research extends into opening-range and intraday sigma behavior rather than relying only on aggregate win rate.

## Results / Status

The system is actively used as a personal research and decision-support tool. It is not presented as a prediction engine or investment recommendation.
