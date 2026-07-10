import { auth } from "@/server/auth";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

/** Returns the signed-in user id and profile, or null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    email: session.user?.email,
    name: session.user?.name,
    image: session.user?.image,
  };
}

/** Returns the signed-in user or throws a 401 Response (for Route Handlers). */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return user;
}
