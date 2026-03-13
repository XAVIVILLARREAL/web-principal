import express from "express";
import { createServer as createViteServer } from "vite";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Hello from Express!' });
  });

  // Proxy for DB requests
  app.use('/api/db', (req, res, next) => {
    console.log('Received request for /api/db:', req.method, req.url);
    next();
  }, createProxyMiddleware({
    target: 'https://api-datos.xtremediagnostics.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/db': '', // remove base path
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log('DB Proxy Request:', req.method, req.url);
        proxyReq.setHeader('ngrok-skip-browser-warning', '69420');
        proxyReq.setHeader('Bypass-Tunnel-Reminder', 'true');
        proxyReq.setHeader('User-Agent', 'curl/7.68.0'); // Some tunnels bypass warning for curl
      }
    }
  }));

  // Proxy for CW requests
  app.use('/api/cw', createProxyMiddleware({
    target: 'https://crm.xtremediagnostics.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/cw': '', // remove base path
    },
  }));

  // Middleware to parse JSON
  app.use(express.json({ limit: '50mb' }));

  // Multer for handling file uploads in memory
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

  // API route for S3 upload
  app.post("/api/upload", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const { endpoint, bucket, accessKey, secretKey } = req.body;

      if (!endpoint || !bucket || !accessKey || !secretKey) {
        return res.status(400).json({ error: "Missing S3 credentials in request body" });
      }

      const s3Client = new S3Client({
        endpoint: endpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey
        },
        forcePathStyle: true
      });

      s3Client.middlewareStack.add(
        (next) => async (args: any) => {
          if (args.request && args.request.headers) {
            args.request.headers['ngrok-skip-browser-warning'] = '69420';
            args.request.headers['Bypass-Tunnel-Reminder'] = 'true';
            args.request.headers['User-Agent'] = 'curl/7.68.0';
          }
          return next(args);
        },
        {
          step: 'build',
        }
      );

      const uploadPromises = files.map(async (file, index) => {
        const key = req.body[`key_${index}`];
        if (!key) throw new Error(`Missing key for file ${index}`);

        await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        }));
        return key;
      });

      const uploadedKeys = await Promise.all(uploadPromises);
      res.json({ success: true, keys: uploadedKeys });

    } catch (error: any) {
      console.error("Upload error:", error);
      
      let errorMessage = error.message || "Failed to upload to S3";
      
      // Handle Cloudflare tunnel errors and invalid XML responses from MinIO
      if (error.$response && error.$response.statusCode === 530) {
        errorMessage = "MinIO server is unreachable (Cloudflare Error 530/1033). The origin service is down.";
      } else if (errorMessage.includes("char 'e' is not expected") || errorMessage.includes("char '<' is not expected")) {
        errorMessage = "Invalid response from MinIO server. The server might be down or misconfigured (Cloudflare tunnel error).";
      }

      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
