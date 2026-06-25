import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { transformer } from "./transformer.ts";

// Initialize tRPC
const t = initTRPC.create({
  transformer,
});

const todos = [
  { id: 1, title: "Learn tRPC", completed: false },
  { id: 2, title: "Build a Solid.js app", completed: true },
  { id: 3, title: "Set up Deno environment", completed: true },
  { id: 4, title: "Configure Vite for Deno", completed: false },
  { id: 5, title: "Implement WebSocket subscriptions", completed: false },
  { id: 6, title: "Add authentication", completed: false },
  { id: 7, title: "Write unit tests", completed: false },
  { id: 8, title: "Deploy to production", completed: false },
  { id: 9, title: "Create API documentation", completed: false },
  { id: 10, title: "Optimize bundle size", completed: false },
];

// Create main router
export const appRouter = t.router({
  // Greeting procedure
  greeting: t.procedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .query(({ input }) => `Hello, ${input.name}!!!!`),

  getTodos: t.procedure
    .input(
      z.object({
        filterByTitle: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate async operation
      const filterByTitle = input?.filterByTitle?.toLowerCase();
      if (filterByTitle) {
        return todos.filter((todo) =>
          todo.title.toLowerCase().includes(filterByTitle),
        );
      }
      return todos;
    }),

  addTodo: t.procedure
    .input(
      z.object({
        title: z.string(),
        id: z.number().optional(),
        completed: z.boolean().optional(),
      }),
    )
    .mutation(({ input }) => {
      const newTodo = {
        id: todos.length + 1,
        title: input.title,
        completed: false,
      };
      todos.push(newTodo);
      return newTodo;
    }),

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
