import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      /** Google `sub` — our player id. */
      id?: string;
    } & DefaultSession["user"];
  }
}
