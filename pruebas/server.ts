import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for DB
  app.use(
    "/api-datos",
    createProxyMiddleware({
      target: "https://api-datos.xtremediagnostics.com",
      changeOrigin: true,
      pathRewrite: {
        "^/api-datos": "",
      },
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader("ngrok-skip-browser-warning", "true");
          proxyReq.setHeader("Bypass-Tunnel-Reminder", "true");
        },
      },
    })
  );

  // Proxy for CRM
  app.use(
    "/crm-proxy",
    createProxyMiddleware({
      target: "https://crm.xtremediagnostics.com",
      changeOrigin: true,
      pathRewrite: {
        "^/crm-proxy": "",
      },
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader("ngrok-skip-browser-warning", "true");
          proxyReq.setHeader("Bypass-Tunnel-Reminder", "true");
        },
      },
    })
  );

  // Proxy for S3
  app.use(
    "/s3-proxy",
    createProxyMiddleware({
      target: "https://s3.xtremediagnostics.com",
      changeOrigin: true,
      pathRewrite: {
        "^/s3-proxy": "",
      },
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader("ngrok-skip-browser-warning", "true");
          proxyReq.setHeader("Bypass-Tunnel-Reminder", "true");
        },
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
