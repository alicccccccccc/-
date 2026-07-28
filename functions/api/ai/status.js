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
  const textBaseUrl = env.AI_TEXT_BASE_URL || env.AI_BASE_URL || "";
  const visionBaseUrl = env.AI_VISION_BASE_URL || env.AI_BASE_URL || "";
  const textModel = env.VITE_AI_TEXT_MODEL || env.VITE_AI_MODEL || "gpt-5.5";
  const visionModel = env.VITE_AI_VISION_MODEL || env.VITE_AI_MODEL || textModel;

  return new Response(JSON.stringify({
    text: {
      configured: Boolean(textBaseUrl && (env.AI_TEXT_API_KEY || env.AI_API_KEY) && textModel),
      model: textModel,
    },
    vision: {
      configured: Boolean(visionBaseUrl && (env.AI_VISION_API_KEY || env.AI_API_KEY) && visionModel),
      model: visionModel,
      separateEndpoint: Boolean(env.AI_VISION_BASE_URL),
      needsVisionEndpoint: false,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
