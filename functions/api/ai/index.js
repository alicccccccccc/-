const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const upstream = buildAiRequest(body, context.env);
    const response = await fetch(upstream.url, {
      method: "POST",
      headers: upstream.headers,
      body: JSON.stringify(upstream.body),
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return json({ error: error.message || "AI proxy failed" }, 500);
  }
}

function buildAiRequest(body, env) {
  const route = body._route === "vision" ? "VISION" : "TEXT";
  const upstreamBody = { ...body };
  delete upstreamBody._route;

  const baseUrl = firstEnv(env, [`AI_${route}_BASE_URL`, "AI_BASE_URL"]);
  const apiKey = firstEnv(env, [`AI_${route}_API_KEY`, "AI_API_KEY"]);

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

function firstEnv(env, names) {
  for (const name of names) {
    const value = cleanEnvValue(env[name], name);
    if (value) return value;
  }
  return "";
}

function cleanEnvValue(value, name) {
  let next = String(value || "").trim();
  if (!next) return "";

  next = next.replace(/^['"]|['"]$/g, "").trim();
  const ownPrefix = `${name}=`;
  if (next.startsWith(ownPrefix)) next = next.slice(ownPrefix.length).trim();

  const genericPrefix = next.match(/^[A-Z0-9_]+=(.+)$/);
  if (genericPrefix) next = genericPrefix[1].trim();

  return next.replace(/\/+$/, "");
}

function chatCompletionsUrl(baseUrl) {
  if (baseUrl.endsWith("/chat/completions")) return baseUrl;
  if (baseUrl.endsWith("/v1")) return `${baseUrl}/chat/completions`;
  return `${baseUrl}/v1/chat/completions`;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
