#!/bin/sh
# Re-run the playtest for every element, a few at a time, then refresh the median.
# Usage: sh playtest/all.sh [parallel jobs]   (run `python pack.py` first)
J=${1:-6}
node -e "const s=require('fs').readFileSync('js/elements.js','utf8');console.log([...s.matchAll(/^(\w+): \{$/gm)].map(m=>m[1]).filter(e=>e!=='god').join('\n'))" \
  | xargs -P "$J" -I{} sh -c 'node playtest/run.js {} > playtest/out/{}.log 2>&1 && echo "done {}" || echo "FAILED {}"'
node playtest/run.js --median
