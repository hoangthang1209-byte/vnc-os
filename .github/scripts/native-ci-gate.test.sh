#!/usr/bin/env bash
set -euo pipefail
export GITHUB_REPOSITORY=hoangthang1209-byte/vnc-os
source "$(dirname "$0")/review-orchestrator-common.sh"
CHECKS='{"check_runs":[]}'
STATUSES='{"statuses":[]}'
FAIL=0
gh() {
 [ "$FAIL" = 0 ] || return 1
 if [[ "$2" == *'/check-runs?'* ]]; then echo "$CHECKS"; else echo "$STATUSES"; fi
}
if commit_ci_is_green deadbeef; then echo 'FAIL absent Verify passed'; exit 1; fi
CHECKS='{"check_runs":[{"id":1,"name":"Verify","app":{"slug":"github-actions"},"status":"completed","conclusion":"success"}]}'
commit_ci_is_green deadbeef
STATUSES='{"statuses":[{"state":"failure"}]}'
if commit_ci_is_green deadbeef; then echo 'FAIL failed status passed'; exit 1; fi
STATUSES='{"statuses":[]}'
CHECKS='{"check_runs":[{"id":1,"name":"Verify","app":{"slug":"github-actions"},"status":"completed","conclusion":"success"},{"id":2,"name":"Verify","app":{"slug":"github-actions"},"status":"completed","conclusion":"failure"}]}'
if commit_ci_is_green deadbeef; then echo 'FAIL stale green passed'; exit 1; fi
FAIL=1
if commit_ci_is_green deadbeef; then echo 'FAIL API error passed'; exit 1; fi
body=$'AGENT_RUNTIME_ID: github-codex\nIndependent ATTD PR Review\n- P0: 0\n- P1: 2\n- P2: 0\n- P3: 0\nFinding quotes: No P0/P1 findings'
[ "$(parse_review_severity_counts "$body")" = '0 2 0 0' ]
echo 'PASS native CI gates: absent, green, failed, stale, API error and quoted review text'
# Live smoke must prove exact production identity, not merely a 200 or login redirect.
source "$(dirname "$0")/continuous-orchestrator-common.sh"
SMOKE='{"status":"ok","service":"vnc-os","commitSha":"expected","environment":"production"}'
curl() { printf '%s' "$SMOKE"; }
run_production_smoke_check https://os.vietnamclothing.vn expected
if run_production_smoke_check https://os.vietnamclothing.vn wrong; then echo 'FAIL stale production SHA passed'; exit 1; fi
SMOKE='<html>Login</html>'
if run_production_smoke_check https://os.vietnamclothing.vn expected 2>/dev/null; then echo 'FAIL login page passed'; exit 1; fi
echo 'PASS exact production smoke identity'
