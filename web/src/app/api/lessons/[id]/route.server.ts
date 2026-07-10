/**
 * Curator lesson API (single lesson) — SERVER MODE only. GET/PUT/DELETE by id;
 * deleting a lesson never removes words from lexicon_global (docs/12 §6).
 */
import { requireCurator } from "@/server/auth/session";
import { deleteLesson, getLesson, updateLesson } from "@/server/db/lessons";
import { parseLessonInput } from "../validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function lessonId(ctx: Ctx): Promise<number | Response> {
  const raw = (await ctx.params).id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return id;
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireCurator();
    const id = await lessonId(ctx);
    if (id instanceof Response) return id;
    const lesson = getLesson(id);
    if (!lesson) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true, lesson });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireCurator();
    const id = await lessonId(ctx);
    if (id instanceof Response) return id;
    const body = await req.json().catch(() => null);
    const input = parseLessonInput(body);
    if (input instanceof Response) return input;
    if (!updateLesson(id, input)) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json({ ok: true, id });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireCurator();
    const id = await lessonId(ctx);
    if (id instanceof Response) return id;
    if (!deleteLesson(id)) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
