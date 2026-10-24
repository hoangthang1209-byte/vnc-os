#!/usr/bin/env bash
set -euo pipefail
export GITHUB_REPOSITORY=hoangthang1209-byte/vnc-os
source "$(dirname "$0")/continuous-orchestrator-common.sh"
ENABLED=false
ACTIVE=0
DISPATCHES=0
FAIL=0
gh() {
  case "$1 $2" in
    'variable get') echo "$ENABLED" ;;
    'run list') if [ "$ACTIVE" = 1 ]; then echo '[{"status":"in_progress","displayTitle":"Native build 123 sha-none"}]'; else echo '[]'; fi ;;
    'workflow run') DISPATCHES=$((DISPATCHES+1)); [ "$FAIL" = 0 ] ;;
    *) return 1 ;;
  esac
}
if dispatch_approved_native_issue 123; then echo 'FAIL disabled runtime accepted'; exit 1; fi
[ "$DISPATCHES" = 0 ]
ENABLED=true
dispatch_approved_native_issue 123
[ "$DISPATCHES" = 1 ]
ACTIVE=1
dispatch_approved_native_issue 123
[ "$DISPATCHES" = 1 ]
ACTIVE=0
FAIL=1
if dispatch_approved_native_issue 123; then echo 'FAIL rejected workflow accepted'; exit 1; fi
echo 'PASS: native dispatch disabled, accepted, duplicate and failure contracts'
