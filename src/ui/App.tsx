import "./App.css";
import {
  action,
  createOptimisticStore,
  createSignal,
  For,
  Loading,
  refresh,
} from "solid-js";
import type { inferProcedureInput } from "@trpc/server";
import { api } from "./client.ts";
import { AppRouter } from "../server/api.ts";
import { asyncThrottleSingleInFlight } from "../utils/async.ts";

const getTodosDebounced = asyncThrottleSingleInFlight(api.getTodos.query, 300);

function App() {
  const [count, setCount] = createSignal(0);
  const [filteredByTitle, setFilteredByTitle] = createSignal("");
  const [todos, setOptimisticTodos] = createOptimisticStore(
    () =>
      getTodosDebounced({
        filterByTitle: filteredByTitle(),
      }),
    [],
  );

  const addTodo = action(function* (todo: { title: string }) {
    const newTodo = {
      title: todo.title,
      id: Math.floor(Math.random() * 10000), // temporary ID for optimistic UI
      completed: false,
    } satisfies inferProcedureInput<AppRouter["addTodo"]>;
    setOptimisticTodos((todos) => {
      todos.push(newTodo);
    }); // optimistic UI
    yield api.addTodo.mutate(newTodo); // server write

    refresh(todos);
    //      ^ property '[$REFRESH]' is missing in type 'readonly { id: number; title: string; completed: boolean; }[]' but required in type '{ [$REFRESH]: any;

    // It however works if I do this:
    // refresh(todos as any);
  });

  return (
    <Loading fallback={<div>Loading...</div>}>
      <div class="navbar bg-base-100 shadow-sm">
        <div class="flex-none">
          <button class="btn btn-square btn-ghost" type="button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block h-5 w-5 stroke-current"
            >
              {" "}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>{" "}
            </svg>
          </button>
        </div>
        <div class="flex-1">
          <a class="btn btn-ghost text-xl">daisyUI header as an example!</a>
        </div>
        <div class="flex-none">
          <button class="btn btn-square btn-ghost" type="button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block h-5 w-5 stroke-current"
            >
              {" "}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              ></path>{" "}
            </svg>
          </button>
        </div>
      </div>
      <div class="divider">OR</div>

      <button
        class="btn"
        type="button"
        onClick={() => {
          api.greeting.query({ name: "Solid" }).then((greeting) => {
            alert(greeting);
          });
        }}
      >
        GREETINGS FROM TRPC SERVER!
      </button>
      <button
        class="btn"
        type="button"
        onClick={() => setCount((count) => count + 1)}
      >
        count is {count()}
      </button>

      <div class="divider">OR</div>

      <h2 class="text-2xl font-bold">Todo List</h2>
      <input
        type="text"
        placeholder="Filter by title..."
        class="input input-bordered w-full max-w-xs mb-4"
        value={filteredByTitle()}
        onInput={(e) => setFilteredByTitle(e.currentTarget.value)}
      />
      <ul>
        <For each={todos}>
          {(todo) => (
            <li>
              {todo.title} {todo.completed ? "✔️" : "❌"}
            </li>
          )}
        </For>
      </ul>
      <input
        type="text"
        id="new-todo"
        class="input input-bordered w-full max-w-xs"
      />
      <button
        class="btn"
        type="button"
        onClick={() => {
          const input = document.getElementById("new-todo") as HTMLInputElement;
          if (input.value.trim() === "") return;
          addTodo({ title: input.value });
          input.value = "";
        }}
      >
        Add Todo
      </button>
    </Loading>
  );
}

export default App;
