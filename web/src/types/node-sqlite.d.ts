/**
 * Minimal ambient types for Node's built-in `node:sqlite` (Node ≥ 22.5).
 * The project pins @types/node ^20, which predates these definitions.
 */
declare module "node:sqlite" {
  type SqlValue = string | number | bigint | boolean | null | Uint8Array;

  interface StatementSync {
    run(...params: SqlValue[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: SqlValue[]): unknown;
    all(...params: SqlValue[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
