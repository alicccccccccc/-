const TEXT_MODEL = import.meta.env.VITE_AI_TEXT_MODEL || import.meta.env.VITE_AI_MODEL || "gpt-5.5";
const VISION_MODEL = import.meta.env.VITE_AI_VISION_MODEL || "";

const MEMORY_JSON_SHAPE = '{"title":"简短标题不超过20字","summary":"一句话摘要不超过80字","searchableText":"可搜索全文或图片内容说明","tags":["标签1","标签2","标签3"],"entities":{},"category1":"一级分类","category2":"二级分类","importance":3}';

const TEXT_EXTRACT_PROMPT = "你是一个个人记忆理解与结构化提取助手。分析用户提供的文本，返回严格 JSON：\n" +
  MEMORY_JSON_SHAPE +
  "\n\n规则：只返回 JSON，不要 Markdown。title 不超过20字。summary 不超过80字。searchableText 保留关键原文、数字、日期、地点、人名和可检索线索。tags 最多5个。entities 只提取明确出现的信息，字段名用英文小写。category1 选择常见一级类目，如 技术学习、工作事务、生活记录、健康医疗、财务、证件合同、灵感素材。category2 为具体子类目。importance 1-5，合同/证件/财务/医疗关键资料=5，重要学习笔记=4，普通记录=3，日常信息=2，可丢弃=1。";

const IMAGE_EXTRACT_PROMPT = "你是一个多模态个人记忆识别助手。直接阅读这张图片，完成文字识别、视觉理解和结构化提取，返回严格 JSON：\n" +
  MEMORY_JSON_SHAPE +
  "\n\n规则：只返回 JSON，不要 Markdown。searchableText 必须包含图片中能读到的主要文字，以及对界面、表格、票据、截图、物品或场景的简洁说明。不要因为图片文字少就返回空，如果是 UI 截图或照片，也要描述视觉内容。保留关键数字、日期、金额、姓名、地点、账号尾号、课程名、公司名等可检索线索。entities 只提取明确出现的信息。importance 1-5。";

const QA_SYSTEM = "你是一个私人记忆助手。根据用户保存的内容回答问题。\n" +
  "规则：\n" +
  "1. 只根据提供的记忆回答，不要编造。\n" +
  "2. 优先使用 entities、searchableText、原文中的具体数字、日期、金额和结论。\n" +
  "3. 如果上下文中没有答案，诚实说：你的记忆中没有相关信息。\n" +
  "4. 用1-3句话回答，然后列出引用来源编号，如 [1] [2]。";

export async function generateAIContent(text) {
  if (!text?.trim()) return fallback("");

  try {
    const raw = await chatCompletion({
      _route: "text",
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: TEXT_EXTRACT_PROMPT },
        { role: "user", content: text.slice(0, 6000) },
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });
    return normalizeMemory(parseJson(raw), text);
  } catch (err) {
    console.warn("[AI] Text extraction failed:", err.message, "-> fallback");
    return fallback(text);
  }
}

export async function generateImageMemory(base64) {
  if (!base64) return fallback("");
  if (!VISION_MODEL) throw new Error("图片模型未配置：请填写 AI_VISION_BASE_URL 和 VITE_AI_VISION_MODEL");

  try {
    const raw = await chatCompletion({
      _route: "vision",
      model: VISION_MODEL,
      messages: [
        { role: "system", content: IMAGE_EXTRACT_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "请识别并整理这张图片，生成个人记忆 JSON。" },
            { type: "image_url", image_url: { url: base64 } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
    });
    return normalizeMemory(parseJson(raw), "截图");
  } catch (err) {
    console.warn("[AI] Image extraction failed:", err.message);
    throw err;
  }
}

export async function askMemory(question, items) {
  if (!items || items.length === 0) return null;

  const context = items.map((item, i) => {
    const parts = [];
    if (item.entities && Object.keys(item.entities).length > 0) parts.push("结构化字段: " + JSON.stringify(item.entities));
    parts.push(item.ocrText || "");
    parts.push(item.rawText || "");
    parts.push(item.aiTitle || "");
    parts.push(item.aiSummary || "");
    parts.push((item.aiTags || item.aiKeywords || []).join(" "));
    return `[${i + 1}] ${parts.filter(Boolean).join(" | ").slice(0, 2400)}`;
  }).join("\n\n");

  try {
    return await chatCompletion({
      _route: "text",
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: QA_SYSTEM },
        { role: "user", content: `记忆内容：\n${context}\n\n问题：${question}` },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });
  } catch (err) {
    console.warn("[AI] Q&A failed:", err.message);
    return null;
  }
}

async function chatCompletion(body) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`API ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function parseJson(raw) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON returned");
  return JSON.parse(jsonMatch[0]);
}

function normalizeMemory(parsed, fallbackText) {
  const searchableText = String(parsed.searchableText || parsed.ocrText || parsed.text || fallbackText || "").trim();

  return {
    title: String(parsed.title || searchableText.split("\n")[0] || "截图").slice(0, 20),
    summary: String(parsed.summary || searchableText).replace(/\s+/g, " ").trim().slice(0, 80),
    searchableText,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map((t) => String(t).slice(0, 12)) : [],
    entities: parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {},
    category1: parsed.category1 || "",
    category2: parsed.category2 || "",
    importance: typeof parsed.importance === "number" ? Math.min(5, Math.max(1, parsed.importance)) : 3,
  };
}

function fallback(text) {
  const firstLine = (text || "").split("\n")[0].trim();
  return {
    title: firstLine ? firstLine.slice(0, 20) : "截图",
    summary: firstLine ? firstLine.slice(0, 50) : "",
    searchableText: text || "",
    tags: [],
    entities: {},
    category1: "",
    category2: "",
    importance: 3,
  };
}