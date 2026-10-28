#!/usr/bin/env bash
set -euo pipefail

# False-positive handling: add a narrow, documented exception with context; never remove a pattern.
PATTERNS=(
  'JEF-[A-Z0-9-]+'
  'TLW-'
  'Jeffco'
  'saashr\.com'
  '\b[0-9]{9}\b'
  '\b[0-9]{13,14}\b'
  'GhostBed|Puffy|Brookstone|Evaya'
  'Webster|Woodstock|Worcester|Millbury'
)

FAIL=0
for pattern in "${PATTERNS[@]}"; do
  if grep -RInE --exclude='redaction-check.sh' --exclude='package-lock.json' "$pattern" src public data index.html css js blog 2>/dev/null; then
    printf 'Redaction check failed on pattern: %s\n' "$pattern"
    FAIL=1
  fi
done
exit "$FAIL"
