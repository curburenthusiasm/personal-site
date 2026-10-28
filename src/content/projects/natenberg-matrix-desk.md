---
title: Natenberg matrix options desk
slug: natenberg-matrix-desk
summary: A live, paper-only options desk that maps direction and implied volatility to one defined-risk spread, prices it against theoretical value, and attaches an if-then hedge plan.
status: prototype
featured: false
tags: [quant, trading, research]
stack: [JavaScript, Black-Scholes, Robinhood MCP connector, Claude artifacts]
diagram: false
order: 12
liveUrl: https://claude.ai/artifact/22L7KzcdN1f87K1a7qcXRg
---

## Problem

A small account ($1,000) needs a few high-probability setups, not a stream of trades. Most option tools show prices and Greeks but leave the decisions to the trader: which structure fits the market, whether the price is actually good, how big the position can be, and what to do when the market moves.

## Approach

The desk follows Sheldon Natenberg's *Option Volatility & Pricing*. Each underlying (SPY, QQQ, IWM) gets a direction from its 20- and 50-day averages and a volatility state from at-the-money implied volatility divided by 20-day realized volatility. That picks one cell of Natenberg's strategy matrix, translated to defined-risk spreads only. Moderate volatility means no options trade.

Every candidate spread is filled at the worse side of the market, then has to pass four gates:

- maximum loss within a per-trade risk limit (5% of equity by default, adjustable with a slider);
- a price better than theoretical value (Black-Scholes at a volatility forecast) after fees;
- positive expected value at both 20- and 60-day realized volatility;
- liquidity limits on open interest, bid-ask width and displayed size.

## Risk management

Each pick carries an entry window, a limit price and a void condition. It also carries an ordered if-then plan: take profit, stop, time exit, a tested short strike, and a delta band computed from theoretical delta. Outside the band the plan cuts contracts first. It then buys fractional shares only when the position is short delta, and closes when it is long delta, because a cash account cannot short shares. The paper journal re-evaluates the plan at every 60-second mark.

## Results / Status

The desk is a paper-trading prototype with frozen, fingerprinted rules. It builds a forward record one scan at a time and makes no claim of a demonstrated edge. Most days it reports "no trade", often because a $1,000 account's default 5% limit rules out most spreads; the risk slider shows what a larger allowance would admit.
