import { assertEquals } from "@std/assert";

// Test calling the tRPC router via fetch
Deno.test("tRPC greeting query", async () => {
  const response = await fetch(
    "http://localhost:8000/trpc/greeting?input=" +
      encodeURIComponent(JSON.stringify({ name: "Alice" })),
  );

  const data = await response.json();
  assertEquals(data.result.data, "Hello, Alice!");
});

// Test tRPC WebSocket subscription
Deno.test("tRPC counter subscription via WebSocket", async () => {
  const ws = new WebSocket("ws://localhost:8000/ws");
  const receivedValues: number[] = [];

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket test timeout"));
    }, 5000);

    ws.onopen = () => {
      // Send subscription message
      const subscribeMsg = {
        id: 1,
        method: "subscription",
        params: {
          path: "counter",
          input: { maxCount: 3 },
        },
      };
      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      // Check if we got a data message
      if (data.result?.data !== undefined) {
        receivedValues.push(data.result.data);
        console.log("Counter value:", data.result.data);
      }

      // Close connection after receiving completion message (null result)
      if (data.result === null && data.id === 1) {
        clearTimeout(timeout);
        ws.close();
        assertEquals(receivedValues, [1, 2, 3]);
        resolve();
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      ws.close();
      reject(new Error(`WebSocket error: ${error}`));
    };
  });
});
