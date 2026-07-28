import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), aiProxyPlugin(env)],
    base: "./",
  };
});

function aiProxyPlugin(env) {
  return {
    name: "local-ai-proxy",
    configureServer(server) {
      server.middlewares.use("/api/ai/status", async (_req, res) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(buildAiStatus(env)));
      });

      server.middlewares.use("/api/ai", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        try {
          const body = await readJson(req);
          const upstream = buildAiRequest(body, env);
          const response = await fetch(upstream.url, {
            method: "POST",
            headers: upstream.headers,
            body: JSON.stringify(upstream.body),
          });
          const text = await response.text();

          res.statusCode = response.status;
          res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
          res.end(text);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message || "AI proxy failed" }));
        }
      });
    },
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function buildAiRequest(body, env) {
  const route = body._route === "vision" ? "VISION" : "TEXT";
  const upstreamBody = { ...body };
  delete upstreamBody._route;

  const baseUrl = (
    env[`AI_${route}_BASE_URL`] ||
    env.AI_BASE_URL ||
    ""
  ).replace(/\/$/, "");
  const apiKey = env[`AI_${route}_API_KEY`] || env.AI_API_KEY;

  if (!baseUrl) throw new Error(`Missing AI_${route}_BASE_URL or AI_BASE_URL`);
  if (!apiKey) throw new Error(`Missing AI_${route}_API_KEY or AI_API_KEY`);

  return {
    url: chatCompletionsUrl(baseUrl),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstreamBody,
  };
}
function buildAiStatus(env) {
  const textBaseUrl = env.AI_TEXT_BASE_URL || env.AI_BASE_URL || "";
  const visionBaseUrl = env.AI_VISION_BASE_URL || "";
  const textModel = env.VITE_AI_TEXT_MODEL || env.VITE_AI_MODEL || "";
  const visionModel = env.VITE_AI_VISION_MODEL || "";

  return {
    text: {
      configured: Boolean(textBaseUrl && (env.AI_TEXT_API_KEY || env.AI_API_KEY) && textModel),
      model: textModel,
    },
    vision: {
      configured: Boolean(visionBaseUrl && (env.AI_VISION_API_KEY || env.AI_API_KEY) && visionModel),
      model: visionModel,
      separateEndpoint: Boolean(env.AI_VISION_BASE_URL),
      needsVisionEndpoint: !env.AI_VISION_BASE_URL,
    },
  };
}
function chatCompletionsUrl(baseUrl) {
  if (baseUrl.endsWith("/chat/completions")) return baseUrl;
  if (baseUrl.endsWith("/v1")) return `${baseUrl}/chat/completions`;
  return `${baseUrl}/v1/chat/completions`;
}