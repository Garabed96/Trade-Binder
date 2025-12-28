// Root router (merges all others)
import { router } from '@/src/server/trpc';
import { userRouter } from './user';
import { cardRouter } from './card';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  // card: cardRouter, <-- add more here later
});

export type AppRouter = typeof appRouter;
