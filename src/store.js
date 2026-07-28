// store.js — local storage with structured entities support

const STORAGE_KEY = "ps_items";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return items.map((item) => {
      if (item.aiKeywords && !item.aiTags) {
        item.aiTags = item.aiKeywords;
        delete item.aiKeywords;
      }
      if (!item.entities) item.entities = {}; if (!item.category1) item.category1 = ""; if (!item.category2) item.category2 = ""; if (!item.importance) item.importance = 3; if (item.userEditedOcr === undefined) item.userEditedOcr = false; if (!item.editHistory) item.editHistory = [];
      return item;
    });
  } catch (e) {
    console.error("Failed to read:", e);
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (e) {
    console.error("Failed to write:", e);
    return false;
  }
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function tokenize(query) {
  const tokens = [];
  const parts = query.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    tokens.push(part);
    if (/[\u4e00-\u9fff]/.test(part) && part.length > 1) {
      for (const ch of part) tokens.push(ch);
      if (part.length >= 4)
        for (let i = 0; i <= part.length - 2; i++) tokens.push(part.slice(i, i + 2));
    }
  }
  return [...new Set(tokens)];
}

export async function addTextItem(text, aiTitle, aiTags, aiSummary, entities, category1, category2, importance) {
  const items = readAll();
  const item = {
    id: crypto.randomUUID(), type: "text", content: text, rawText: text,
    imageBase64: null, ocrText: null,
    aiTitle: aiTitle || null, aiTags: aiTags || [], aiSummary: aiSummary || null,
    entities: entities || {}, category1: category1 || "", category2: category2 || "", importance: importance || 3,
    createdAt: Date.now(),
  };
  items.push(item);
  if (!writeAll(items)) throw new Error("存储空间不足");
  return item;
}

export async function addImageItem(base64, ocrText, aiTitle, aiTags, aiSummary, entities, category1, category2, importance) {
  const items = readAll();
  const item = {
    id: crypto.randomUUID(), type: "image", content: ocrText || "",
    rawText: null, imageBase64: base64, ocrText: ocrText || "",
    aiTitle: aiTitle || null, aiTags: aiTags || [], aiSummary: aiSummary || null,
    entities: entities || {}, category1: category1 || "", category2: category2 || "", importance: importance || 3,
    createdAt: Date.now(),
  };
  items.push(item);
  if (!writeAll(items)) throw new Error("图片过大");
  return item;
}

export async function getAllItems() { return readAll(); }

export async function getItemById(id) { return readAll().find((i) => i.id === id) || null; }

export async function searchItems(query) {
  const all = readAll();
  if (!query || !query.trim()) return all.sort((a, b) => b.createdAt - a.createdAt);

  const normalizedQuery = query.toLowerCase().trim();
  const tokens = tokenize(normalizedQuery);
  const scored = all.map((item) => ({ item, score: scoreItem(item, tokens, normalizedQuery) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.item.createdAt - a.item.createdAt)
    .map((s) => s.item);

  return scored;
}

function scoreItem(item, tokens, normalizedQuery) {
  const fields = [
    { text: item.aiTitle, weight: 18 },
    { text: (item.aiTags || item.aiKeywords || []).join(" "), weight: 14 },
    { text: `${item.category1 || ""} ${item.category2 || ""}`, weight: 12 },
    { text: item.aiSummary, weight: 10 },
    { text: Object.values(item.entities || {}).join(" "), weight: 10 },
    { text: item.rawText, weight: 6 },
    { text: item.ocrText, weight: 6 },
    { text: item.content, weight: 4 },
  ];

  let score = 0;
  for (const field of fields) {
    const text = String(field.text || "").toLowerCase();
    if (!text) continue;
    if (text.includes(normalizedQuery)) score += field.weight * 3;
    for (const token of tokens) {
      const regex = new RegExp(escapeRegex(token), "g");
      const matches = text.match(regex);
      if (matches) score += field.weight + matches.length;
    }
  }

  if ((item.importance || 3) >= 4 && score > 0) score += 4;
  return score;
}

export async function getCategories() { const all = readAll(); const map = {}; all.forEach(item => { const key = item.category1 || '未分类'; const sub = item.category2 || ''; if (!map[key]) map[key] = { count: 0, subs: {}, latest: 0 }; map[key].count++; if (sub) { if (!map[key].subs[sub]) map[key].subs[sub] = 0; map[key].subs[sub]++; } if (item.createdAt > map[key].latest) map[key].latest = item.createdAt; }); return map; }

export async function updateItemCategory(id, category1, category2, importance) { const items = readAll(); const idx = items.findIndex(i => i.id === id); if (idx === -1) return null; items[idx].category1 = category1; items[idx].category2 = category2; items[idx].importance = importance; writeAll(items); return items[idx]; }

export async function updateItem(id, updates) {
  const items = readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  
  // Track edit history
  if (!items[idx].editHistory) items[idx].editHistory = [];
  const changes = {};
  for (const key of Object.keys(updates)) {
    if (items[idx][key] !== updates[key]) {
      changes[key] = { from: items[idx][key], to: updates[key] };
    }
  }
  if (Object.keys(changes).length > 0) {
    items[idx].editHistory.push({ time: Date.now(), changes });
  }
  
  Object.assign(items[idx], updates);
  writeAll(items);
  return items[idx];
}

export async function updateOcrText(id, newOcrText) {
  return updateItem(id, { ocrText: newOcrText, content: newOcrText, userEditedOcr: true });
}

export async function getEditHistory(id) {
  const item = await getItemById(id);
  return item?.editHistory || [];
}

export async function deleteItem(id) {
  let items = readAll();
  items = items.filter((i) => i.id !== id);
  writeAll(items);
}
