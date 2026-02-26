import { createServer, IncomingMessage, ServerResponse } from "http";
import { handleRequest } from "./routes";

export { handleRequest } from "./routes";
export { listCapabilities, getCapability, getCapabilityBySlug, addCapability, getStats } from "./store";
export type { CapabilityRecord, UsageEvent, CapabilityStats } from "./schema";

/**
 * Start standalone registry server.
 * Usage: `node dist/index.js` or `npx ts-node src/index.ts`
 */
function startServer(port = 4002) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    let body: any = undefined;
    if (req.method === "POST" || req.method === "PUT") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        body = {};
      }
    }

    const result = handleRequest({
      method: req.method || "GET",
      url: req.url || "/",
      headers: (req.headers as Record<string, string>) || {},
      body,
    });

    res.writeHead(result.status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-402-Payment, X-Payment-Token",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    res.end(JSON.stringify(result.body));
  });

  server.listen(port, () => {
    console.log(`🏪 Agent Bazaar Registry running on http://localhost:${port}`);
    console.log(`   GET  /api/capabilities`);
    console.log(`   GET  /api/capabilities/:id`);
    console.log(`   POST /api/capabilities`);
    console.log(`   GET  /api/capabilities/:id/stats`);
    console.log(`   POST /api/capabilities/:id/call`);
  });
}

// Run if executed directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || "4002", 10);
  startServer(port);
}
