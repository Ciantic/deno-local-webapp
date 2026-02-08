import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import solid from "vite-plugin-solid";
import { viteSingleFile } from "vite-plugin-singlefile";
import { PluginOption } from "vite";
import { appRouter } from "./src/api.ts";
import tailwindcss from "@tailwindcss/vite";
import {
  nodeHTTPRequestHandler,
  type NodeHTTPHandlerOptions,
  type NodeHTTPRequest,
  type NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import type { AnyRouter } from "@trpc/server";

type TrpcPluginOptions<
  TRouter extends AnyRouter,
  TRequest extends NodeHTTPRequest,
  TResponse extends NodeHTTPResponse,
> = {
  /**
   * Path where the trpc router will be mounted.
   * @default '/trpc'
   */
  basePath: string;
} & NodeHTTPHandlerOptions<TRouter, TRequest, TResponse>;

function trpc<
  TRouter extends AnyRouter,
  TRequest extends NodeHTTPRequest,
  TResponse extends NodeHTTPResponse,
>(options: TrpcPluginOptions<TRouter, TRequest, TResponse>): PluginOption {
  return {
    name: "trpc",
    configureServer(server) {
      server.middlewares.use(options?.basePath || "/trpc", (req, res) => {
        const url = new URL(req.url || "/", "http://localhost");
        const path = url.pathname.replace(/^\//, "");

        return nodeHTTPRequestHandler({
          req: req as TRequest,
          res: res as TResponse,
          path,
          router: options.router,
          createContext: options.createContext,
          batching: options.batching,
          responseMeta: options.responseMeta,
          maxBodySize: options.maxBodySize,
          onError: options.onError,
        } as any);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    deno(),
    solid(),
    trpc({
      basePath: "/trpc",
      router: appRouter,
      createContext: () => ({}),
    }),
    viteSingleFile(),
  ],
});
