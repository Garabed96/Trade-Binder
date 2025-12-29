import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';

export const createContext = async () => {
  const session = await getServerSession(authOptions);
  return {
    session,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
