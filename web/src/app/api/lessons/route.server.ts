/**
 * Curator lesson API — SERVER MODE only (excluded from the static export by
 * `pageExtensions`). Every method requires the curator session (docs/12 §10.1).
 */
import { requireCurator } from "@/server/auth/session";
import { createLesson, listLessons } from "@/server/db/lessons";
import { parseLessonInput } from "./validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCurator();
    return Response.json({ ok: true, lessons: listLessons() });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireCurator();
    const body = await req.json().catch(() => null);
    const input = parseLessonInput(body);
    if (input instanceof Response) return input;
    const id = createLesson(input, user.id);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
