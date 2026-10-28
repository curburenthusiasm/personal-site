---
title: "METABRIC Survival Modeling: Protocol Before Results"
slug: metabric-survival-status
description: The experimental runner and evaluation protocol exist; formal-run metrics remain pending and stated thresholds are targets only.
pubDate: 2026-10-27
draft: false
category: Research status
---

## Current status

The experimental runner and evaluation protocol for breast-cancer survival modeling using METABRIC exist. A completed formal run with reportable metrics was not available for this update. No model-performance result is claimed.

That distinction matters. A runner can be implemented without being executed under the registered protocol. A protocol can define how an evaluation should work without producing observations. The existence of either is not evidence that a model met a target.

## Targets, not results

The planned evaluation uses ten repetitions of five-fold validation. Its stated targets are a mean integrated Brier score (IBS) at or below 0.167, a mean time-dependent concordance at or above 0.665, and an IBS gain greater than twice the repeat-to-repeat standard deviation.

These thresholds are acceptance targets. Completed formal-run means, fold-level results, variation between repetitions, and evidence of target attainment are not available to report here. They should not be converted into achievement language or projected from partial probes.

## What a result report needs

A useful results update should identify the exact comparison and analysis code, summarize all planned repetitions and folds, give the mean and variability, and state whether every target was met. It should also make clear how missing or failed folds were handled. Reporting only a best run or a rounded point estimate would not answer the registered question.

The runner should retain the environment and data-processing choices needed to reproduce the evaluation. If the protocol changes, the update should say what changed and whether the resulting analysis is exploratory or confirmatory.

## Scope and use

This is exploratory research using breast-cancer survival data. It is not a clinical tool, is not validated for patient care, and must not guide diagnosis or treatment. A benchmark result, if one is eventually produced, would still be bounded by the dataset, cohort, protocol, and validation design.

Until formal runs complete and a reviewable report is available, the status remains metrics pending. The most accurate summary is also the least dramatic: the machinery is prepared, the result is not.
