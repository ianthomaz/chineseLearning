/**
 * Who is calling: the iOS app (Bearer app-session token) or the site (Auth.js
 * cookie). Route handlers that both clients use call this instead of `auth()`.
 */
import { auth } from "@/server/auth";
import { getIdentityUser, userIdForAppToken } from "@/server/db/identity";

export type RequestUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  via: "app" | "web";
};

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function getRequestUser(req: Request): Promise<RequestUser | null> {
  const token = bearerToken(req);
  if (token) {
    // A bearer that does not resolve is a signed-out app — never fall back to cookies.
    const userId = userIdForAppToken(token);
    const user = userId ? getIdentityUser(userId) : null;
    return user
      ? { id: user.id, email: user.email, name: user.name, image: user.image, via: "app" }
      : null;
  }
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
    image: session.user?.image ?? null,
    via: "web",
  };
}
