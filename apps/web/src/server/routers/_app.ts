// Root router (merges all others)
import { router } from '@/src/server/trpc';
import { userRouter } from './user';
import { cardRouter } from './card';
import { inventoryRouter } from './inventory';
import { binderRouter } from './binder';
import { marketplaceRouter } from './marketplace';
import { profileRouter } from './profile';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  inventory: inventoryRouter,
  binder: binderRouter,
  marketplace: marketplaceRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
