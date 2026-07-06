import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase-admin";

/** Verify a `Authorization: Bearer <Firebase ID token>` header. Returns the
 *  decoded token, or null if missing/invalid. */
export async function verifyBearer(
  req: Request,
): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) return null;
  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
