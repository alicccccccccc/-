import { useState } from "react";
import { updateItemCategory, updateOcrText, updateItem } from "../store";

export default function DetailView({ item, onClose, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editCat1, setEditCat1] = useState("");
  const [editCat2, setEditCat2] = useState("");
  const [editImportance, setEditImportance] = useState(3);
  const [editOcr, setEditOcr] = useState(false);
  const [editOcrText, setEditOcrText] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  if (!item) return null;

  const time = new Date(item.createdAt);
  const timeStr = time.toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const tags = item.aiTags || item.aiKeywords || [];
  const isImage = item.type === "image";
  const editHistory = item.editHistory || [];

  const startEdit = () => {
    setEditCat1(item.category1 || "");
    setEditCat2(item.category2 || "");
    setEditImportance(item.importance || 3);
    setEditing(true);
  };
  const saveEdit = async () => {
    await updateItemCategory(item.id, editCat1, editCat2, editImportance);
    item.category1 = editCat1;
    item.category2 = editCat2;
    item.importance = editImportance;
    setEditing(false);
  };

  const startEditOcr = () => { setEditOcrText(item.ocrText || ""); setEditOcr(true); };
  const saveEditOcr = async () => {
    await updateOcrText(item.id, editOcrText);
    item.ocrText = editOcrText;
    item.content = editOcrText;
    item.userEditedOcr = true;
    setEditOcr(false);
  };

  const reRunAI = async () => {
    const text = editOcrText || item.ocrText || item.rawText || "";
    if (!text.trim()) return;
    setRegenLoading(true);
    try {
      const { generateAIContent } = await import("../ai");
      const ai = await generateAIContent(text);
      await updateItem(item.id, {
        aiTitle: ai.title, aiSummary: ai.summary, aiTags: ai.tags,
        entities: ai.entities, category1: ai.category1, category2: ai.category2, importance: ai.importance,
      });
      Object.assign(item, {
        aiTitle: ai.title, aiSummary: ai.summary, aiTags: ai.tags,
        entities: ai.entities, category1: ai.category1, category2: ai.category2, importance: ai.importance,
      });
    } catch (err) { console.error("Re-AI failed:", err); }
    setRegenLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/[0.55] backdrop-blur-sm" />
      <div className="relative glass-strong rounded-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">{isImage ? "截图" : "文字"}</span>
            <span className="text-xs text-slate-500">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { onDelete(item.id); onClose(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="删除">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Body: Left-Right Split */}
        <div className="flex-1 overflow-y-auto">
          {isImage ? (
            <div className="flex flex-col md:flex-row">
              {/* Left: Image */}
              <div className="md:w-1/2 p-5 flex-shrink-0 bg-white/[0.02] flex items-start justify-center">
                {item.imageBase64 && <img src={item.imageBase64} alt="原始截图" className="w-full rounded-xl border border-white/10" />}
              </div>
              {/* Right: Info */}
              <div className="md:w-1/2 p-5 space-y-4">
                <RightPanel item={item} tags={tags} isImage={isImage} editing={editing} startEdit={startEdit} saveEdit={saveEdit} setEditing={setEditing} editCat1={editCat1} setEditCat1={setEditCat1} editCat2={editCat2} setEditCat2={setEditCat2} editImportance={editImportance} setEditImportance={setEditImportance} editOcr={editOcr} editOcrText={editOcrText} setEditOcrText={setEditOcrText} startEditOcr={startEditOcr} saveEditOcr={saveEditOcr} setEditOcr={setEditOcr} reRunAI={reRunAI} regenLoading={regenLoading} editHistory={editHistory} />
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4 max-w-2xl mx-auto">
              <RightPanel item={item} tags={tags} isImage={isImage} editing={editing} startEdit={startEdit} saveEdit={saveEdit} setEditing={setEditing} editCat1={editCat1} setEditCat1={setEditCat1} editCat2={editCat2} setEditCat2={setEditCat2} editImportance={editImportance} setEditImportance={setEditImportance} editOcr={editOcr} editOcrText={editOcrText} setEditOcrText={setEditOcrText} startEditOcr={startEditOcr} saveEditOcr={saveEditOcr} setEditOcr={setEditOcr} reRunAI={reRunAI} regenLoading={regenLoading} editHistory={editHistory} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Right panel content shared between image and text modes
function RightPanel({ item, tags, editing, startEdit, saveEdit, setEditing, editCat1, setEditCat1, editCat2, setEditCat2, editImportance, setEditImportance, editOcr, editOcrText, setEditOcrText, startEditOcr, saveEditOcr, setEditOcr, reRunAI, regenLoading, editHistory }) {
  return (
    <>
      {/* Category & Importance */}
      <div className="flex items-center gap-2 flex-wrap">
        {(item.category1 || item.importance) && (
          <>
            {item.category1 && <span className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.055] text-slate-300 border border-white/[0.07]">{item.category1}{item.category2 ? " / " + item.category2 : ""}</span>}
            {item.importance && <span className="text-xs text-amber-300">{"★".repeat(Math.min(5, item.importance || 3))}</span>}
            <button onClick={startEdit} className="text-[10px] text-slate-500 hover:text-cyan-200 ml-1">编辑分类</button>
          </>
        )}
      </div>
      {editing && (
        <div className="p-3 rounded-xl bg-white/[0.035] border border-white/[0.07] space-y-2">
          <input value={editCat1} onChange={(e) => setEditCat1(e.target.value)} placeholder="一级分类" className="w-full p-2 text-xs border border-white/10 bg-white/[0.055] text-slate-200 rounded-lg" />
          <input value={editCat2} onChange={(e) => setEditCat2(e.target.value)} placeholder="二级分类" className="w-full p-2 text-xs border border-white/10 bg-white/[0.055] text-slate-200 rounded-lg" />
          <div className="flex items-center gap-2"><span className="text-xs text-slate-500">重要度：</span>{[1,2,3,4,5].map((n) => (<button key={n} onClick={() => setEditImportance(n)} className={`w-7 h-7 rounded-lg text-xs font-medium ${editImportance === n ? "bg-cyan-600 text-white" : "bg-white/[0.06] text-slate-500"}`}>{n}</button>))}</div>
          <div className="flex gap-2"><button onClick={saveEdit} className="text-xs px-4 py-1.5 rounded-lg bg-cyan-600 text-white">保存</button><button onClick={() => setEditing(false)} className="text-xs px-4 py-1.5 rounded-lg border border-white/10 text-slate-400">取消</button></div>
        </div>
      )}

      {/* AI Title & Tags */}
      {item.aiTitle && (
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{item.aiTitle}</h2>
          {tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{tags.map((t, i) => (<span key={i} className="px-2 py-0.5 text-xs rounded-lg bg-cyan-300/10 text-cyan-100 border border-cyan-300/10">{t}</span>))}</div>}
        </div>
      )}

      {/* AI Summary */}
      {item.aiSummary && (
        <div className="p-4 rounded-xl bg-cyan-300/5 border border-cyan-300/10">
          <p className="text-xs text-cyan-200 mb-1 font-medium">AI 摘要</p>
          <p className="text-sm text-slate-300 leading-relaxed">{item.aiSummary}</p>
        </div>
      )}

      {/* Searchable content with inline editing */}
      {item.ocrText && (
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500 font-medium">可搜索内容</p>
            <div className="flex items-center gap-2">
              {!editOcr ? (
                <button onClick={startEditOcr} className="text-[11px] text-slate-500 hover:text-cyan-200 transition-colors">编辑</button>
              ) : (
                <>
                  <button onClick={saveEditOcr} className="text-[11px] text-cyan-200 font-medium">保存修改</button>
                  <button onClick={() => setEditOcr(false)} className="text-[11px] text-stone-400">取消</button>
                </>
              )}
            </div>
          </div>
          {editOcr ? (
            <textarea value={editOcrText} onChange={(e) => setEditOcrText(e.target.value)} rows={6} className="w-full p-3 text-sm border border-white/10 rounded-lg focus:outline-none focus:border-cyan-300 bg-white/[0.055] text-slate-200 resize-y font-mono leading-relaxed" placeholder="可搜索文本或图片内容说明..." />
          ) : (
            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-white/[0.02] p-3 rounded-lg">{item.ocrText}</div>
          )}
          {item.userEditedOcr && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[10px] text-amber-600">已手动修正</p>
              <button onClick={reRunAI} disabled={regenLoading} className="text-[11px] text-cyan-200 hover:text-cyan-100 font-medium disabled:opacity-40">
                {regenLoading ? "生成中..." : "重新生成摘要"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Original text for non-image items */}
      {item.type === "text" && item.rawText && (
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-xs text-slate-500 mb-1 font-medium">原文</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{item.rawText}</p>
        </div>
      )}

      {/* Edit History */}
      {editHistory.length > 0 && (
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-xs text-stone-400 mb-2 font-medium">修改记录</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {editHistory.slice(-5).reverse().map((entry, i) => {
              const t = new Date(entry.time);
              const ts = t.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
              return (
                <div key={i} className="text-[10px] text-stone-500 border-l-2 border-stone-200 pl-2">
                  <span className="text-stone-400">{ts}</span>
                  {Object.entries(entry.changes).map(([key, val]) => (
                    <span key={key} className="ml-2">
                      <span className="text-stone-300">{key}: </span>
                      <span className="text-red-400 line-through">{String(val.from).slice(0, 30)}</span>
                      <span className="mx-1">→</span>
                      <span className="text-green-600">{String(val.to).slice(0, 30)}</span>
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
