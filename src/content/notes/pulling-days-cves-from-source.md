---
title: Pulling a day’s CVEs straight from the source
slug: pulling-daily-cves-from-source
description: A small workflow for filtering the official CVE List by publication date and applying a predictable CVSS and KEV selection order.
pubDate: 2026-10-28
draft: true
category: Security automation
---

Daily vulnerability summaries are useful only if the collection method is predictable. A practical starting point is the CVE Program’s public `cvelistV5` repository. A shallow clone with Git LFS downloads skipped reduces unnecessary transfer when the task is to inspect JSON records rather than large objects.

Filter records by their `datePublished` field, not by a filename timestamp that may represent when a record was edited or copied. Then choose a severity score with a fixed precedence: CNA CVSS v4.0 first, then v3.1, v3.0, and v2.0. If the CNA record has no usable score, inspect the ADP enrichment as a fallback. Keep the source of the selected score in the output so readers know whether it came from the assigning authority or later enrichment.

Known Exploited Vulnerabilities status should also be explicit. In this workflow, look for the ADP entry whose `other.type` is `kev`. Absence of that marker means “not marked by this parser,” not a universal statement that exploitation is impossible. The feed can lag, and a parser can be wrong; preserve the retrieval date and record identifier.

For a quick manual inspection, the outline is:

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone --depth=1 \
  https://github.com/CVEProject/cvelistV5.git cvelistV5
rg -l '"datePublished"\s*:\s*"2026-10-28' cvelistV5/cves
```

The production script should parse JSON rather than rely on line-oriented matching alone. A condensed Python selector could follow this shape:

```python
def score(record):
    metrics = record.get("containers", {}).get("cna", {}).get("metrics", [])
    for version in ("cvssV4_0", "cvssV3_1", "cvssV3_0", "cvssV2_0"):
        for item in metrics:
            value = item.get(version)
            if value and isinstance(value.get("baseScore"), (int, float)):
                return version, value["baseScore"]
    return None, None

def is_kev(record):
    adp = record.get("containers", {}).get("adp", [])
    return any(item.get("other", {}).get("type") == "kev" for item in adp)
```

The useful output is not just a ranked list. It is a traceable record of the CVE ID, publication date, selected score source, KEV flag, and retrieval time. That makes it possible to correct the parser and regenerate the report without treating yesterday’s summary as ground truth.

The date filter should use an explicit timezone and calendar-day definition, especially when an automated job runs near midnight. If a record is updated after publication, decide whether the daily report follows the latest revision or preserves the initial snapshot; either choice is defensible if it is documented. Preserve the original JSON path and retrieval timestamp so an analyst can inspect the source record that produced each row.

Finally, report missing values plainly. A CVE without a CNA score should not be silently assigned a severity, and a missing KEV marker should not be displayed as a confirmed negative unless the source and parser support that interpretation. The goal is a repeatable intake process that helps prioritization, not a replacement for vulnerability triage.
