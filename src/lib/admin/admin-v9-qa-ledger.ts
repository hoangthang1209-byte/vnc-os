import { ADMIN_V9_VIEW_INVENTORY } from "./admin-v9-view-inventory";

export const V9_QA_ROLES = ["Owner", "Sales", "Production", "Delivery", "Anonymous"] as const;
export const V9_QA_VIEWPORTS = ["desktop-1440x900", "mobile-390x844"] as const;

export type V9QaEntry = {
  viewId: string;
  domain: string;
  title: string;
  candidateRoute: string;
  role: typeof V9_QA_ROLES[number];
  viewport: typeof V9_QA_VIEWPORTS[number];
  expectedAccess: "not-defined";
  actualAccess: "not-tested";
  visual: "not-tested";
  functional: "not-tested";
  screenshotEvidence: "";
  testedBy: "";
  note: "";
};

/** An unverified QA workload, not a green readiness attestation or route discovery. */
export function makeV9QaLedger(): V9QaEntry[] {
  return ADMIN_V9_VIEW_INVENTORY.flatMap(view =>
    V9_QA_ROLES.flatMap(role =>
      V9_QA_VIEWPORTS.map(viewport => ({
        viewId: view.id,
        domain: view.domain,
        title: view.title,
        candidateRoute: view.candidateRoute ?? "",
        role, viewport,
        expectedAccess: "not-defined" as const,
        actualAccess: "not-tested" as const,
        visual: "not-tested" as const,
        functional: "not-tested" as const,
        screenshotEvidence: "" as const,
        testedBy: "" as const,
        note: "" as const,
      }))
    )
  );
}
