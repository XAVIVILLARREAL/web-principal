import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy for DB (Supabase/PostgREST)
  // Using the confirmed production URL for the self-hosted instance
  const dbTargetRaw = process.env.VITE_SUPABASE_URL || "https://api-datos.xtremediagnostics.com";
  const dbTarget = dbTargetRaw.replace(/\/$/, "");
  
  // For self-hosted PostgREST, we usually DON'T need /rest/v1 prefix
  // unless it's explicitly configured in the proxy.
  const needsRestV1 = false; 
  
  console.log("DB Proxy Target:", dbTarget, "Needs /rest/v1:", needsRestV1);
  
  app.get("/api/debug", (req, res) => {
    res.json({
      dbTargetRaw,
      dbTarget,
      needsRestV1,
      envSupabaseUrl: process.env.VITE_SUPABASE_URL,
      envChatwootUrl: process.env.VITE_CHATWOOT_URL
    });
  });
  
  app.use(
    "/api/db",
    createProxyMiddleware({
      target: dbTarget,
      changeOrigin: true,
      pathRewrite: (path) => {
        // http-proxy-middleware passes the original path (e.g. /api/db/cotizaciones)
        // We need to strip /api/db and optionally add /rest/v1
        const prefix = needsRestV1 ? "/rest/v1" : "";
        const newPath = path.replace(/^\/api\/db/, prefix);
        return newPath;
      },
      on: {
        error: (err, req, res) => {
          console.error("Proxy Error (DB):", err);
          if (res && 'writeHead' in res) {
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
            res.end('Proxy Error: ' + err.message);
          }
        },
        proxyReq: (proxyReq, req, res) => {
          console.log(`DB Proxy Req: ${req.method} ${req.url} -> ${dbTarget}${proxyReq.path}`);
        },
        proxyRes: (proxyRes, req, res) => {
          console.log(`DB Proxy Res: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
          if (proxyRes.headers['content-type']?.includes('text/html')) {
            console.warn(`WARNING: DB Proxy returned HTML! Status: ${proxyRes.statusCode}`);
          }
        }
      }
    })
  );

  // Custom route for Google Apps Script to handle redirects correctly
  app.post("/api/gas/:scriptId", express.json({ type: '*/*' }), express.text({ type: '*/*' }), async (req, res) => {
    console.log("GAS Route hit. Script ID:", req.params.scriptId);
    try {
      const targetUrl = `https://script.google.com/macros/s/${req.params.scriptId}/exec`;
      
      // We need to forward the body. If it was parsed as an object, stringify it.
      let bodyData = req.body;
      if (typeof bodyData === 'object') {
        bodyData = JSON.stringify(bodyData);
      }

      console.log("Sending to GAS:", bodyData);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: bodyData,
        redirect: 'follow' // fetch automatically changes POST to GET on 302/303
      });

      const text = await response.text();
      console.log("GAS Response status:", response.status);
      console.log("GAS Response text preview:", text.substring(0, 100));
      
      // Copy status
      res.status(response.status);
      
      // Copy headers (excluding some that might cause issues)
      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      res.send(text);
    } catch (error) {
      console.error("GAS Route Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Proxy for Chatwoot
  const cwTarget = (process.env.VITE_CHATWOOT_URL || "https://crm.xtremediagnostics.com").replace(/\/$/, "");
  console.log("CW Proxy Target:", cwTarget);
  app.use(
    "/api/cw",
    createProxyMiddleware({
      target: cwTarget,
      changeOrigin: true,
      pathRewrite: {
        "^/api/cw": "",
      },
    })
  );

  // 3. Fallback for any /api route that wasn't caught by proxy or health check
  // This prevents the SPA fallback from sending index.html for API calls
  app.use("/api/*", (req, res) => {
    console.warn(`[API 404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "API Route not found", 
      message: "The request reached the server but no proxy or route was matched.",
      path: req.originalUrl 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
