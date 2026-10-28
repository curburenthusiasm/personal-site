---
title: “SQL decides, the app displays”
slug: sql-decides-the-app-displays
description: Keep business rules in governed data and views so applications present one resolved interpretation instead of reimplementing policy.
pubDate: 2026-10-28
draft: true
category: Data governance
---

When the same business rule lives in a form, a report, and a scheduled job, the organization does not really have one rule. It has several implementations that may agree today and drift tomorrow. A change then requires finding every copy and guessing which one has become authoritative.

“SQL decides, the app displays” is a design constraint for reducing that drift. Put the rule in a governed table, resolve its precedence and applicability in a view, and make the application show the result. The app can collect a proposed rule or let an authorized user edit it, but it should not contain a second interpretation hidden in a long conditional expression.

For example, a lead-time rule table might contain a value, scope, effective dates, owner, and provenance. A resolved view applies precedence and returns the rule that should be used for a given item and context. Reports consume that view. A setup application reads the resolved result and writes rule changes through a narrow, auditable path.

The application still has important work. It can enforce required fields, guide the user through prerequisite gates, and explain why a record is blocked. But its query patterns should be predictable and delegation-safe. Equality filters over indexed keys are easier to reason about than retrieving a large table and filtering in the client. The interface should display the server-resolved answer, not approximate it locally.

This approach only works if the data layer is governed. A table without ownership, review, or provenance simply moves the problem from code into data. Record who may change a rule, why it changed, when it applies, and which reports or workflows consume it. Add validation for overlapping effective dates or missing required dimensions where those conditions matter.

Migration should preserve observability. Before replacing existing conditions, compare the resolved view against current outputs on representative cases. Differences should be classified as intended policy changes or defects, not silently normalized. Keep the old output available during comparison when that is operationally feasible.

The benefits are not that SQL is inherently wiser than application code. The benefit is that shared business logic has one inspectable home, close to the data it governs. Applications can then focus on collecting, explaining, and presenting decisions. A rule change becomes a reviewable data change with visible downstream effects—not a hunt through every screen and report.

An implementation should also include an escape hatch for exceptions. If an authorized user can override the resolved value, record the reason, scope, and expiration rather than allowing a permanent shadow rule to emerge in a comment field. The exception belongs in the governance model and should be visible to the next person who reviews the result.
