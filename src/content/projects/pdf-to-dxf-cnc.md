---
title: Sketch and PDF to DXF for CNC foam cutting
slug: pdf-to-dxf-cnc
summary: A vector-PDF pipeline extracts paths and writes cutter-compatible DXF geometry, with hand-drawn sketches treated as a separate recognition problem.
status: in-progress
featured: false
tags: [cad]
stack: [Python, PyMuPDF, ezdxf, DXF]
diagram: false
order: 6
---

## Problem

Cutting software expects clean vector geometry, while source designs often arrive as a vector PDF or an image of a hand sketch. A reliable workflow should preserve scale and path intent instead of asking an operator to redraw every contour.

## Constraints

Vector PDF paths and hand-drawn marks are not the same input problem. The first can often be extracted geometrically; the second needs recognition, cleanup, and explicit scale confirmation. A valid DXF must also be compatible with the target cutter software.

## Approach and Architecture

The current path uses PyMuPDF to inspect vector drawings and ezdxf to write a DXF. A small synthetic rectangle illustrates the output step:

```python
import fitz
import ezdxf

pdf = fitz.open("shape-sheet.pdf")
paths = pdf[0].get_drawings()
doc = ezdxf.new("R2010")
model = doc.modelspace()

for path in paths:
    for item in path["items"]:
        if item[0] == "re":
            rect = item[1]
            model.add_lwpolyline([
                (rect.x0, rect.y0), (rect.x1, rect.y0),
                (rect.x1, rect.y1), (rect.x0, rect.y1),
            ], close=True)

doc.saveas("cut-profile.dxf")
```

## What’s interesting

- The vector path remains the source of truth; the script transforms rather than redraws it.
- Scale and unit interpretation need an explicit check before cutting.
- Sketch recognition is a separate future stage, not implied by the PDF extractor.

## Results / Status

The PDF-vector extraction and DXF-writing path is in progress. Compatibility and dimensional accuracy must be checked against representative source documents and the cutting software before treating the workflow as production-ready.

## Lessons

Keep conversion and interpretation separate. A successful file export proves that a file was written, not that the geometry is correctly scaled or safe to cut.
