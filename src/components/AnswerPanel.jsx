import { useEffect, useState } from "react";

export default function AnswerPanel({ answer, sources, onSourceClick, loading, items = [], onAsk, onAdd }) {
  const [prompt, setPrompt] = useState("");
  const todayCount = countToday(items);
  const latestCategory = items.find((item) => item.category1)?.category1;
  const related = findRelated(items);
  const indexedCount = items.filter((item) => item.aiSummary || item.aiTitle || (item.aiTags || []).length > 0).length;
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((res) => res.ok ? res.json() : null)
      .then(setAiStatus)
      .catch(() => setAiStatus(null));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onAsk?.(prompt.trim());
  };

  return (
    <div className="flex min-h-full flex-col p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="ai-orb flex-shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">记忆助手</h2>
            <p className="text-[11px] text-slate-500">检索、引用、补全上下文</p>
          </div>
        </div>
        <span className="rounded-lg border border-emerald-300/[0.18] bg-emerald-400/[0.08] px-2 py-1 text-[10px] text-emerald-100">可提问</span>
      </div>

      <div className="rounded-2xl border border-cyan-200/[0.10] bg-[#0a1220]/90 p-4">
        <p className="text-sm leading-relaxed text-slate-200">今天新增 {todayCount} 条记忆，当前共有 {indexedCount} 条内容带有摘要或标签。</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatusPill label="来源" value={items.length} />
          <StatusPill label="可引用" value={indexedCount} />
        </div>
      </div>

      {aiStatus && <ModelStatus status={aiStatus} />}

      <div className="mt-4 space-y-3">
        {related && (
          <CopilotCard
            title="细分分类"
            body={`${related.primary} / ${related.secondary}`}
            label="打开这条记忆"
            onClick={() => onSourceClick?.(related.item)}
          />
        )}
        {latestCategory && (
          <CopilotCard
            title="继续追问"
            body={`围绕「${latestCategory}」从已保存资料里生成一份问题清单。`}
            label="生成问题清单"
            onClick={() => onAsk?.(`基于 ${latestCategory} 生成 5 个可以继续追问的问题`)}
          />
        )}
        <CopilotCard
          title="补充资料"
          body="保存文字或截图后，系统会生成摘要、标签和可搜索内容。"
          label="保存记忆"
          onClick={onAdd}
        />
      </div>

      {loading && (
        <div className="mt-4 rounded-2xl border border-cyan-300/[0.18] bg-cyan-300/[0.08] p-4 ai-processing">
          <p className="text-sm font-medium text-slate-100">正在分析你的问题</p>
          <p className="mt-1 text-xs text-slate-500">检索相关记忆、抽取证据、生成回答。</p>
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0d1422]/[0.86] overflow-hidden">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-xs font-medium text-slate-300">根据你的记忆库</p>
          </div>
          <div className="px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{answer}</p>
          </div>
          {sources && sources.length > 0 && (
            <div className="space-y-2 px-4 pb-4">
              <p className="text-[11px] font-medium text-slate-500">引用来源</p>
              {sources.slice(0, 3).map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => onSourceClick(item)}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition-all hover:border-cyan-300/[0.24] hover:bg-cyan-300/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-300/[0.1] text-[10px] font-medium text-cyan-100">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-medium text-slate-200">{item.aiTitle || "截图记忆"}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{item.aiSummary?.slice(0, 42) || item.category1 || "相关来源"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-auto pt-5">
        <div className="rounded-2xl border border-white/[0.09] bg-[#0b111d]/[0.9] p-2 transition-colors focus-within:border-cyan-300/[0.35]">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="询问你的记忆库..."
            className="h-10 w-full bg-transparent px-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <div className="flex items-center justify-between border-t border-white/[0.06] px-2 pt-2">
            <span className="text-[10px] text-slate-500">回答会尽量引用你的记忆来源</span>
            <button type="submit" className="rounded-lg bg-white/[0.08] px-3 py-1 text-[11px] text-slate-300 transition-all hover:bg-cyan-300/[0.16] hover:text-white">发送</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ModelStatus({ status }) {
  const visionReady = status.vision?.configured;
  const visionLabel = visionReady ? "图片接口已指定" : "图片接口未指定";

  return (
    <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-300">AI 配置</p>
        <span className={`rounded-lg px-2 py-0.5 text-[10px] ${visionReady ? "bg-emerald-400/[0.08] text-emerald-100" : "bg-amber-400/[0.08] text-amber-200"}`}>{visionLabel}</span>
      </div>
      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
        <p>文本：{status.text?.model || "未配置"}</p>
        <p>图片：{status.vision?.model || "等待填写 AI_VISION_BASE_URL / VITE_AI_VISION_MODEL"}</p>
      </div>
    </div>
  );
}

function StatusPill({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.035] px-3 py-2">
      <p className="font-mono text-sm font-semibold text-slate-100">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function CopilotCard({ title, body, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/[0.2] hover:bg-cyan-300/[0.055]">
      <p className="text-xs font-medium text-cyan-100">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{body}</p>
      <p className="mt-3 text-[11px] text-slate-500">{label}</p>
    </button>
  );
}

function countToday(items) {
  const now = new Date();
  return items.filter((item) => {
    const date = new Date(item.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }).length;
}

function findRelated(items) {
  const item = items.find((entry) => entry.category1 && entry.category2);
  if (!item) return null;
  return { item, primary: item.category1, secondary: item.category2 };
}