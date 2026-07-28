const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const env = context.env;
  const textBaseUrl = firstEnv(env, ["AI_TEXT_BASE_URL", "AI_BASE_URL"]);
  const visionBaseUrl = firstEnv(env, ["AI_VISION_BASE_URL", "AI_BASE_URL"]);
  const textModel = firstEnv(env, ["VITE_AI_TEXT_MODEL", "VITE_AI_MODEL"]) || "gpt-5.5";
  const visionModel = firstEnv(env, ["VITE_AI_VISION_MODEL", "VITE_AI_MODEL"]) || textModel;

  return new Response(JSON.stringify({
    text: {
      configured: Boolean(textBaseUrl && firstEnv(env, ["AI_TEXT_API_KEY", "AI_API_KEY"]) && textModel),
      model: textModel,
    },
    vision: {
      configured: Boolean(visionBaseUrl && firstEnv(env, ["AI_VISION_API_KEY", "AI_API_KEY"]) && visionModel),
      model: visionModel,
      separateEndpoint: Boolean(firstEnv(env, ["AI_VISION_BASE_URL"])),
      needsVisionEndpoint: false,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
