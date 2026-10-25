# Agent OS parallel dispatch acceptance checklist

A lane is actively building only when current AgentRun status is RUNNING and a verified runner link has a fresh heartbeat. CI/review is not builder execution.

- Record issue number, unique builder lease, exact branch and commit SHA.
- Do not run multiple builders against overlapping files.
- Capture workflow CI, exact-head review, test evidence, and any blocker.
- Do not auto-merge, rewrite credentials, migrate production DB, or turn on live inbound channels without owner approval.
- Preserve CRM incident #250 as P0 while independent VNC, ATTD, Gmail and Media coding continues.
- Escalate missing runtime evidence as unknown, not active.
