# Production deployment ledger
**Checked 2026-10-26 using Vercel API** — historical snapshots, not real-time truth.

**Project:** `attd-vn` (`prj_NhN15pU2mOhktAqMaC3jnTcH1MP0`); shared Production aliases include `www.attd.vn`, `attd.vn`, `os.vietnamclothing.vn`.

| At verification | Deployment | SHA / branch | Status | Caveat |
|---|---|---|---|---|
| 2026-10-26 | `dpl_6FfY8ckguwrHMzUpABucxXuka4Qb` | `db748294cbd04c0ac7fb0c57563ad6bebfaeeadb` / `main` | READY | Agent OS #242 merge; authenticated UI and real dispatch **not smoke tested** |
| 2026-10-26 | `dpl_25wWUo8VFYs2U2kQWNFhuEWbp6hR` | `e14b03b47662d4de788191080f553d608313d555` / ATTD V9 branch | READY (previous production) | Verify that the main deploy did not regress ATTD V9 |

**Release warning:** do not infer current alias traffic from deployment list alone; inspect exact domain resolution, headers/runtime and rollback readiness.
VNC catalog project: `vnc-merchandise-preview` staging, `prj_TJrHBZDRFxkzvBcT3vfmeaOrT4ME`. Do not conflate with live legacy VietnamClothing domain.

For each new release record: release owner, UTC, project, deployment ID, SHA, target, domains, CI, browser smoke, CRM smoke and rollback ID.
