import { verifyBearer } from "@/lib/auth";
import { getUsage } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const decoded = await verifyBearer(req);
  if (!decoded) {
    return new Response("Unauthorized", { status: 401 });
  }
  const usage = await getUsage(decoded.uid);
  return Response.json(usage);
}
