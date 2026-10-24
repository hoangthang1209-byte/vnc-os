/** Public deployment identity only; deliberately does not query production data. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "vnc-os",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? "development",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
