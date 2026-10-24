#!/usr/bin/env bash
# Provider-independent Actions workflow dispatch. No API key is used by the controller.
dispatch_native_agent_task() {
  local mode="$1" number="$2" head_sha="${3:-}" enabled
  enabled="$(gh variable get AGENT_RUNTIME_ENABLED --repo "$GITHUB_REPOSITORY" 2>/dev/null || true)"
  [ "$enabled" = "true" ] || { echo "Native runtime disabled or not configured; task remains queued."; return 1; }
  local active
  active="$(gh run list --repo "$GITHUB_REPOSITORY" --workflow native-agent-runtime.yml --limit 100 \
    --json status,displayTitle | jq -r --arg title "Native $mode $number sha-${head_sha:-none}" \
    '[.[] | select(.displayTitle == $title and (.status == "queued" or .status == "in_progress" or .status == "waiting" or .status == "requested" or .status == "pending"))] | length')" || return 1
  [ "$active" -eq 0 ] || { echo "Native request already active for #$number."; return 0; }
  # The workflow revalidates owner approval, risk, branch ownership and current SHA.
  gh workflow run native-agent-runtime.yml --repo "$GITHUB_REPOSITORY" --ref main \
    -f mode="$mode" -f number="$number" -f expected_sha="$head_sha" || return 1
  # Dispatch acceptance is not execution evidence. Only a real run can establish BUILDING.
  echo "Native $mode request accepted for #$number; awaiting runner preflight."
}
