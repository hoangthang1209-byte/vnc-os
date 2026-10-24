# Cursor-independent Agent OS runtime

Owner requested this transition on 24 October 2026. Work can implement and review code directly. Scheduled AI execution is a separate GitHub Actions runtime; a chat session is not a persistent worker.

## Architecture

GitHub tasks → approved native build → patch artifact → validated PR publication → CI → read-only exact-head review → existing merge gate → exact production SHA verification → next task.

- Cursor API workflow and executable bridge are retired. Historical review markers remain readable.
- Controllers run trusted main code. The AI worker has no GitHub write credential. Publication runs in a fresh job and never executes generated code.
- Builds require the owner's exact BUILD_APPROVED comment and either risk:low + agent:build-approved, or risk:medium + agent:build-approved-medium. Cursor labels do not authorize the new runner.
- High-risk labels and unresolved dependencies block automatic builds. Workflow, policy, database, credentials, auth and payment paths require direct implementation/review in Work.
- Native builds use agent/issue-N and never force-push. An existing unrelated PR blocks native creation and must be reconciled directly.
- An accepted dispatch is a queue reservation. A real workflow run establishes BUILDING; CI alone establishes passing checks.
- Independent reviews are bound to an exact PR head with successful Verify checks. Reviews are COMMENT events, not fabricated human approvals. Existing GitHub APPROVED and branch protection gates remain intact.
- Bot-created pushes explicitly dispatch CI; GitHub token writes do not recursively trigger workflow events.

## One-time setup

1. Disable external Cursor Builder and Reviewer automations before enabling the native runner. Repository workflow deletion cannot disable automation configured on cursor.com.
2. Configure OPENAI_API_KEY directly in GitHub repository secrets. Never paste keys in a chat or source file. API use is billed to that API project.
3. Set repository variable AGENT_CODEX_VERSION to a reviewed exact Codex CLI release (x.y.z).
4. Set AGENT_RUNTIME_ENABLED=true only after the external writers are disabled and a pilot is approved.
5. Confirm repository Actions settings allow PR creation and declared workflow permissions. Do not weaken branch protection.

Manual run: Actions → Native Agent Runtime → Run workflow → build + issue number; or review + PR number + exact head SHA. The workflow revalidates live state at preparation and publication.

## Rollout acceptance

- Final PR CI, native policy tests, shell contracts, automation tests and production build pass.
- Final diff receives review; authorization and existing branch protections are respected.
- Verify the Vercel team/project owns os.vietnamclothing.vn and tracks vnc-os/main.
- Confirm production reports the merged SHA, then smoke the login and automation pages.
- Complete one low-risk native build → PR → CI → exact-head review before enabling unattended tasks.

Until the live pilot and deployment checks succeed, this runtime is not proven in production. Missing credentials remain blockers, never synthetic completion.
