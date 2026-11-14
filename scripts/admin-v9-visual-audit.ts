/**
 * V9 visual smoke audit. READ ONLY. Requires a pre-authorized Playwright storage
 * state file provided by the operator. Never puts credentials or captures in CI.
 *
 * V9_BASE_URL=https://<preview-host> V9_STORAGE_STATE_FILE=/private/session.json
 * V9_OUTPUT_DIR=/private/v9-audit npx tsx scripts/admin-v9-visual-audit.ts
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { ADMIN_V9_VIEW_INVENTORY } from "../src/lib/admin/admin-v9-view-inventory";

async function main() {
const baseUrl = process.env.V9_BASE_URL;
const authFile = process.env.V9_STORAGE_STATE_FILE;
const outputDir = process.env.V9_OUTPUT_DIR;

if (!baseUrl || !authFile || !outputDir) {
  throw new Error("V9_BASE_URL, V9_STORAGE_STATE_FILE and V9_OUTPUT_DIR are required; no anonymous or implicit production captures");
}
const parsedUrl = new URL(baseUrl);
const trustedHost = parsedUrl.hostname === "os.vietnamclothing.vn" ||
  (parsedUrl.hostname.startsWith("attd-") &&
   parsedUrl.hostname.endsWith("-hoangthang1209-3040s-projects.vercel.app"));
if (parsedUrl.protocol !== "https:" || !trustedHost) {
  throw new Error("V9_BASE_URL must be the exact VNC OS production host or a VNC project preview hostname");
}
if (!existsSync(authFile)) throw new Error("Authorized Playwright session state not found");
if (resolve(outputDir) === resolve(process.cwd()) || resolve(outputDir).startsWith(resolve(process.cwd()) + "/")) {
  throw new Error("Capture directory must be outside the repo to avoid committing private client data");
}
const views = ADMIN_V9_VIEW_INVENTORY.filter(v => v.candidateRoute);
const viewports = [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }];
const output: Array<{ id: string; route: string; viewport: string; status: number | null; result: string }> = [];
await mkdir(outputDir, { recursive: true, mode: 0o700 });
const browser = await chromium.launch({ headless: true });
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      storageState: authFile,
      serviceWorkers: "block",
    });
    await context.route("**/*", route => {
      const request = route.request();
      if (request.isNavigationRequest() && new URL(request.url()).hostname !== parsedUrl.hostname) {
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    for (const view of views) {
      const url = new URL(view.candidateRoute!, parsedUrl);
      try {
        const response = await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 25000 });
        const status = response?.status() ?? null;
        const redirected = !page.url().startsWith(url.toString());
        const result = status && status < 400 && !redirected ? "captured-not-yet-accepted" : "needs-manual-review";
        if (result === "captured-not-yet-accepted") {
          await page.screenshot({ path: join(outputDir, `${view.id}-${vp.name}.png`), fullPage: true });
        }
        output.push({ id: view.id, route: view.candidateRoute!, viewport: vp.name, status, result });
      } catch (error) {
        output.push({ id: view.id, route: view.candidateRoute!, viewport: vp.name, status: null, result: `error: ${error instanceof Error ? error.message : String(error)}` });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(join(outputDir, "report.json"), JSON.stringify({
  note: "Route snapshots only. Does NOT certify auth, role matrix, functional parity or 44/44 V9 acceptance.",
  attemptedViews: views.length, outOfScopeWithoutConcreteRoute: ADMIN_V9_VIEW_INVENTORY.length - views.length,
  results: output,
}, null, 2), { mode: 0o600 });
if (output.some(x => x.result !== "captured-not-yet-accepted")) process.exitCode = 1;

}

void main().catch(error => { console.error(error); process.exitCode = 1; });
