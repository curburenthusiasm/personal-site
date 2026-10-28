---
title: METABRIC breast cancer survival modeling
slug: metabric-survival-modeling
summary: An experimental survival-analysis pipeline using METABRIC data, DeepHit-style modeling, IPCW evaluation, and calibration.
status: research
featured: false
tags: [research, machine-learning, survival-analysis]
stack: [Python, PyTorch, NumPy, pandas, scikit-learn]
diagram: false
order: 8
---

## Problem

Survival modeling is harder than ordinary classification because outcomes are censored and model quality depends on both discrimination and calibration over time.

## Approach

I built an experimental pipeline around the METABRIC breast cancer dataset using a DeepHit-style survival model, ranking loss, inverse-probability-of-censoring weighting, isotonic recalibration, preprocessing, cross-validation, and benchmark evaluation.

## What’s interesting

- Evaluation separates concordance from integrated Brier score rather than collapsing performance into one number.
- Calibration is treated as a first-class concern alongside ranking quality.
- The project is structured as reproducible research infrastructure rather than a one-off notebook.

## Results / Status

The experimental environment and runner are working, but the target benchmark has not been claimed as solved. This project is published as active research, with status kept separate from aspiration.
