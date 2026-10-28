---
title: Hypervisor migration decision analysis
slug: hypervisor-migration
summary: A forced virtualization renewal became a three-node Proxmox and Ceph design—and a decision to reject a fourth node that added little resilience.
status: in-progress
featured: false
tags: [infra]
stack: [Proxmox, Ceph, capacity planning, hypervisor migration]
diagram: false
order: 5
---

## Problem

A hypervisor licensing renewal prompted a comparison between staying on the incumbent platform and moving to a three-node Proxmox/Ceph cluster. The design needed enough capacity to carry the full workload with two nodes available, while keeping the transition testable and economically defensible.

## Constraints

The cluster had to fit a switchless full-mesh topology, tolerate one node loss, and account for storage endurance. Reusing existing hosts through a backplane conversion would prevent the new cluster from being tested alongside the live environment. Vendor quotes and identifying infrastructure details are intentionally omitted.

## Approach and Architecture

The proposed shape is a three-node cluster sized so any two nodes can carry the full workload. A fourth node was reframed as a barebones cold spare rather than an additional quorum advantage: both three and four nodes tolerate only one node loss under the evaluated quorum model.

Storage endurance (TBW) became a sizing input rather than a post-purchase check. The evaluation compared three-year cost to stay—including an aging SAN replacement—with the move cost. It also rejected the backplane conversion because it removed the option to test the new cluster beside the current one.

## What’s interesting

- The “stay” option was priced as a real project, not treated as a zero-cost baseline.
- Quorum behavior was translated into the operational question of what a fourth node buys.
- Parallel testability and endurance were treated as design constraints, not implementation details.

## Results / Status

The comparison modeled moving as roughly 37% cheaper over three years, with the alternatives approximately even in year one. The cluster migration remains in progress; no claim of a completed cutover is made here. A renewal date that was off by a month reduced available planning runway, reinforcing the need to verify contract dates directly.

## Lessons

Compare full lifecycle options, including replacement costs hidden inside “stay.” Also verify the deadline that drives the decision rather than inheriting it from an intermediary.
