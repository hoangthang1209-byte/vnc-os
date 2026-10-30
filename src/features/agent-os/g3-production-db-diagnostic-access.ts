import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { isOwnerLikeSession } from "@/features/auth/admin-permissions";

/** Fail closed. Authentication and owner authorization precede environment checks. */
export function diagnosticAccessStatus(
  session: AdminSessionUser,
  environment: string | undefined,
): 401 | 403 | 404 | null {
  if (!session.authenticated) return 401;
  if (!isOwnerLikeSession(session)) return 403;
  if (environment !== "production") return 404;
  return null;
}
