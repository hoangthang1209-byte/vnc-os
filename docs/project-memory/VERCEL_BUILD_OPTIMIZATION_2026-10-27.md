# Vercel build queue optimization — 2026-10-27

## Verified symptom
The Vercel `attd-vn` project had 20/20 recent deployments `QUEUED` when inspected, across admin, supplier, Content Studio and Project Memory branches. This is a point-in-time snapshot, not an ongoing queue assertion.

## Applied configuration (via connected Vercel project API)
### attd-vn / prj_NhN15pU2mOhktAqMaC3jnTcH1MP0
Set `commandForIgnoringBuildStep`:

```sh
if [ "$VERCEL_ENV" = production ]; then exit 1; fi
d=$(git diff --name-only HEAD^ HEAD 2>/dev/null) || exit 1
[ -n "$d" ] || exit 1
echo "$d" | grep -Eqv "^(docs/project-memory/|docs/content-studio/|README[.]md$)" && exit 1
exit 0
```

Exit 0 = skip build, exit 1 = build. Production always builds. Missing parent SHA, empty diff, code/Prisma/API/UI/assets or unknown paths always build. The command skips a Preview only if the last commit touches solely these explicitly allowlisted docs paths. This is intentionally conservative, does **not** eliminate all redundant previews and may not reduce queue duration for code-heavy branches. Other .md files are not automatically skipped.

Local test using a scratch git repo verified: docs-only Preview exit 0; docs-only Production exit 1; code Preview exit 1. **No live Vercel ignored-build result has been observed yet.**

### vnc-merchandise-preview / prj_TJrHBZDRFxkzvBcT3vfmeaOrT4ME
Enabled `enableAffectedProjectsDeployments: true` via Vercel API, for its isolated static root `sites/vietnamclothing`. Intended to skip unrelated monorepo commits; empirical confirmation awaits next deployment.

## Monitoring and rollback
- Compare queue size and skipped/ready counts after subsequent pushes; inspect per-deployment ignored-build logs.
- Verify code-changing preview still builds and production deploys do not skip.
- If any release is mistakenly skipped, clear `commandForIgnoringBuildStep` on `attd-vn` (set to `null`) or disable `enableAffectedProjectsDeployments` on the VNC staging project.
- This change does NOT alter GitHub CI, Production aliases, database schemas, or DNS.
- Vercel's ignored-build command may still consume some queue/concurrency allocation; prefer fewer commits and a PR-based preview workflow for larger gains.
