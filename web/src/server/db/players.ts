/**
 * @deprecated Use `@/server/db/users` — kept for phrase-game API compatibility.
 */
import {
  getUser,
  setNick as setUserNick,
  upsertUser,
  type User,
  type UserInput,
} from "./users";

export type Player = User;
export type PlayerInput = UserInput;

export const upsertPlayer = upsertUser;
export const getPlayer = getUser;
export const setNick = setUserNick;
