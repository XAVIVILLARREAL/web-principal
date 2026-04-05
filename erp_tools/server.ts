import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy for DB (Supabase/PostgREST)
  app.use(
    "/api/db",
    createProxyMiddleware({
      target: "https://api-datos.xtremediagnostics.com",
      changeOrigin: true,
      pathRewrite: {
        "^/api/db": "",
      },
      on: {
        error: (err, req, res) => {
          console.error("Proxy Error (DB):", err);
          if (res && 'writeHead' in res) {
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
            res.end('Proxy Error');
          }
        },
        proxyRes: (proxyRes, req, res) => {
          console.log(`DB Proxy Res: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
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
  app.use(
    "/api/cw",
    createProxyMiddleware({
      target: "https://crm.xtremediagnostics.com",
      changeOrigin: true,
      pathRewrite: {
        "^/api/cw": "",
      },
    })
  );

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
