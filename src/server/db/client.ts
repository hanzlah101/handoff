import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

// Idle connections close on their own, so pools left behind by dev reloads
// don't pile up.
const IDLE_TIMEOUT_SECONDS = 20;

export const db = drizzle(
  postgres(env.DATABASE_URL, { idle_timeout: IDLE_TIMEOUT_SECONDS })
);

export type Database = typeof db;
