import { initTRPC } from '@trpc/server';

// We'll add auth/session context here eventually
const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
