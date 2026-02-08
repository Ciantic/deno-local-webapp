import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/api.ts";
import html from "../dist/index.html" with { type: "text" };

// Handle requests directly with Deno
Deno.serve((req) => {
  // TODO: Handle WebSocket upgrades
  /*
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onopen = (e) => {
    };
    
    socket.onmessage = async (e) => {
     
    };
    
    socket.onclose = (e) => {
    };
    
    socket.onerror = (e) => {
    };
    
    return response;
  }
  */

  console.log(req.url);

  // Parse the url to path
  const url = new URL(req.url);

  // Server index.html from root
  if (url.pathname === "/") {
    return new Response(html, { headers: { "content-type": "text/html" } });
  }

  // Other from TRPC endpoint
  return fetchRequestHandler({
    endpoint: "/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
});
