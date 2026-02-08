import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";

// Initialize tRPC
const t = initTRPC.create();

// Create main router
export const appRouter = t.router({
  // Greeting procedure
  greeting: t.procedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .query(({ input }) => `Hello, ${input.name}!`),

  // WebSocket subscription - sends numbers
  counter: t.procedure
    .input(
      z
        .object({
          maxCount: z.number().min(1).default(5),
        })
        .optional(),
    )
    .subscription(({ input }) => {
      return observable((emit) => {
        const maxCount = input?.maxCount ?? 5;
        let count = 0;

        const interval = setInterval(() => {
          count++;
          emit.next(count);

          if (count >= maxCount) {
            emit.complete();
            clearInterval(interval);
          }
        }, 100);

        return () => clearInterval(interval);
      });
    }),
});

// Export the app router type to be imported on the client side
export type AppRouter = typeof appRouter;
