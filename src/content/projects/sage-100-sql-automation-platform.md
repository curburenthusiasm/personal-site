---
title: Sage 100 SQL automation platform
slug: sage-100-sql-automation-platform
summary: A production automation layer around a legacy ERP using SQL Server Agent, stored procedures, Python, alerts, and governed reporting logic.
status: production
featured: true
tags: [erp, sql, automation]
stack: [Sage 100, SQL Server, SQL Server Agent, Python, pyodbc]
diagram: true
order: 2
---

## Problem

A manufacturing ERP carried critical order, inventory, accounting, and production data, but many operational tasks still depended on manual extracts, repetitive checks, and one-off intervention.

## Approach

I built an automation layer around Sage 100 using SQL Server Agent, stored procedures, views, Python, scheduled exports, and exception reporting. The design favors explicit jobs and auditable data movement over hidden triggers or fragile desktop automation.

## What’s interesting

- Business rules live close to governed data and can be inspected independently of the UI.
- Scheduled jobs replace repetitive administrative work while preserving operational visibility.
- Python and pyodbc bridge the ERP to files, APIs, reporting, and downstream systems without requiring a wholesale ERP replacement.

## Results / Status

The platform became the foundation for reporting, EDI support, inventory reconstruction, exports, exception detection, and operational automation across the manufacturing environment.
