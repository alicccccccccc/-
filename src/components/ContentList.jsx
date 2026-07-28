import { useState } from "react";

function extractSummary(item) {
  if (item.aiSummary) return item.aiSummary.slice(0, 88);
  if (item.type === "image" && item.ocrText) {
    const first = item.ocrText.split("\n")[0].trim();
    return first.slice(0, 88) + (first.length > 88 ? "..." : "");
  }
  if (item.type === "text" && item.rawText) return item.rawText.replace(/\s+/g, " ").trim().slice(0, 88);
  return "等待补充摘要。";
}

export default function ContentList({ items, query, onSelect, onDelete, onAddFirst }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#090f18]/90 px-6 py-12 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/[0.16] bg-cyan-300/[0.08]">
          <svg className="h-7 w-7 text-cyan-100" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-100">你的第二大脑还没有内容</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">保存截图、笔记、资料和灵感后，AI 会生成摘要、标签和可搜索内容。</p>
        <button onClick={onAddFirst} className="primary-action mt-5 rounded-full px-5 py-2.5 text-sm font-medium text-white">保存第一份记忆</button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#090f18]/90 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{query ? "搜索结果" : "记忆流"}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">{query ? `找到 ${items.length} 条相关记忆` : "按更新时间展示，AI 摘要优先"}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-500">{items.length} 条</span>
      </div>
      <div className="divide-y divide-white/[0.055]">
        {items.map((item) => (
          <KnowledgeRow
            key={item.id}
            item={item}
            onSelect={onSelect}
            onDeleteRequest={(id) => setConfirmDelete(id)}
            confirmDelete={confirmDelete}
            onConfirmDelete={(id) => { onDelete(id); setConfirmDelete(null); }}
            onCancelDelete={() => setConfirmDelete(null)}
          />
        ))}
      </div>
    </section>
  );
}

function KnowledgeRow({ item, onSelect, onDeleteRequest, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const title = item.aiTitle || (item.type === "text" ? ((item.rawText || "").slice(0, 34) + ((item.rawText || "").length > 34 ? "..." : "")) : "截图记忆");
  const summary = extractSummary(item);
  const tags = item.aiTags || item.aiKeywords || [];
  const time = new Date(item.createdAt);
  const timeStr = formatRelativeTime(time);
  const isConfirming = confirmDelete === item.id;
  const category = item.category1 ? `${item.category1}${item.category2 ? " / " + item.category2 : ""}` : "未分类";

  return (
    <div
      onClick={() => !isConfirming && onSelect(item)}
      className="group cursor-pointer px-4 py-3.5 transition-all hover:bg-white/[0.045]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d1422] text-slate-400 group-hover:border-cyan-300/[0.22] group-hover:text-cyan-100 transition-all">
          {item.type === "image" ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.16-5.16a2.25 2.25 0 0 1 3.18 0l5.16 5.16m-1.5-1.5 1.41-1.41a2.25 2.25 0 0 1 3.18 0l2.91 2.91M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H5.625A1.125 1.125 0 0 0 4.5 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-medium text-slate-100">{title}</h4>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">摘要：{summary}</p>
            </div>
            <span className="hidden flex-shrink-0 text-[11px] text-slate-600 sm:block">{timeStr}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-0.5 text-[11px] text-slate-400">{category}</span>
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="rounded-full bg-cyan-300/[0.08] px-2 py-0.5 text-[11px] text-cyan-100">{tag}</span>
            ))}
            {item.importance >= 4 && <span className="rounded-full bg-amber-400/[0.09] px-2 py-0.5 text-[11px] text-amber-200">高价值</span>}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isConfirming ? (
            <>
              <button onClick={onCancelDelete} className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-white/[0.08] hover:text-slate-300">取消</button>
              <button onClick={() => onConfirmDelete(item.id)} className="rounded-lg bg-red-500/[0.12] px-2 py-1 text-[11px] text-red-300 hover:bg-red-500 hover:text-white">删除</button>
            </>
          ) : (
            <button onClick={() => onDeleteRequest(item.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 opacity-0 transition-all hover:bg-red-500/[0.12] hover:text-red-300 group-hover:opacity-100" title="删除">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date) {
  const now = new Date(); const diff = now - date;
  const mins = Math.floor(diff / 60000); const hours = Math.floor(diff / 3600000); const days = Math.floor(diff / 86400000);
  if (mins < 1) return "刚刚"; if (mins < 60) return `${mins} 分钟前`; if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
