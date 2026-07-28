import { useEffect, useMemo, useState } from "react";

export default function Sidebar({ items, selectedFolder, onSelectFolder }) {
  const exportItems = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      count: items.length,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jizhe-memory-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const tree = useMemo(() => buildTree(items), [items]);
  const [expanded, setExpanded] = useState({});

  const catList = Object.entries(tree).sort((a, b) => {
    if (a[0] === "未分类") return 1;
    if (b[0] === "未分类") return -1;
    return b[1].count - a[1].count;
  });

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      catList.slice(0, 4).forEach(([cat1, data]) => {
        if (Object.keys(data.subs).length > 0 && next[cat1] === undefined) next[cat1] = true;
      });
      return next;
    });
  }, [catList.length]);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSelected = (cat1, cat2) => {
    return selectedFolder?.cat1 === cat1 && selectedFolder?.cat2 === (cat2 || null);
  };

  return (
    <div className="w-64 h-full flex flex-col bg-[#050a12]/95 border-r border-cyan-200/[0.08] flex-shrink-0 overflow-hidden">
      <div className="px-4 py-4 border-b border-cyan-200/[0.08]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.75)]" />
          <h2 className="text-sm font-semibold text-slate-100">AI 记忆树</h2>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">按 AI 分类浏览，编辑分类请进入记忆详情。</p>
      </div>

      <div className="px-3 py-3 border-b border-white/[0.06]">
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full rounded-lg px-3 py-2 text-left text-[12px] transition-all ${
            !selectedFolder
              ? "border border-cyan-300/[0.18] bg-cyan-300/[0.10] text-cyan-50"
              : "border border-white/[0.07] bg-white/[0.035] text-slate-400 hover:border-cyan-300/[0.18] hover:bg-white/[0.055] hover:text-slate-200"
          }`}
        >
          <span className="flex items-center justify-between gap-3">
            <span>全部记忆</span>
            <span className="font-mono text-[10px] text-slate-500">{items.length}</span>
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {catList.length === 0 ? (
          <div className="px-4 py-6 text-[12px] leading-relaxed text-slate-500">保存内容后，AI 会在这里生成可浏览的分类结构。</div>
        ) : (
          catList.map(([cat1, data]) => {
            const subEntries = Object.entries(data.subs).sort((a, b) => b[1].count - a[1].count);
            const hasSubs = subEntries.length > 0;

            return (
              <div key={cat1} className="px-2">
                <div
                  onClick={() => onSelectFolder({ cat1, cat2: null })}
                  className={`group flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-lg transition-all ${
                    isSelected(cat1, null)
                      ? "bg-cyan-300/[0.11] text-cyan-50 font-medium"
                      : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-200"
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); if (hasSubs) toggleExpand(cat1); }}
                    className={`text-[10px] w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${hasSubs ? "text-slate-500 hover:bg-white/10 hover:text-slate-300" : "text-slate-700"}`}
                    aria-label={expanded[cat1] ? "收起分类" : "展开分类"}
                    disabled={!hasSubs}
                  >
                    {hasSubs ? (expanded[cat1] ? "⌄" : "›") : "•"}
                  </button>
                  <span className="w-6 h-6 rounded-lg bg-white/[0.055] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h3.38c.6 0 1.18.24 1.6.66l1.06 1.06c.42.42 1 .66 1.6.66H18A2.25 2.25 0 0 1 20.25 9v6.75A2.25 2.25 0 0 1 18 18H6a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>
                  </span>
                  <span className="text-[12px] flex-1 truncate">{cat1}</span>
                  <span className="font-mono text-[10px] text-slate-500 flex-shrink-0 rounded-full bg-white/[0.04] px-1.5 py-0.5">{data.count}</span>
                </div>

                {hasSubs && expanded[cat1] && (
                  <div className="tree-open ml-7 mt-1 mb-1 border-l border-cyan-200/[0.08] pl-2">
                    {subEntries.map(([cat2, subData]) => (
                      <div
                        key={cat2}
                        onClick={() => onSelectFolder({ cat1, cat2 })}
                        className={`group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer rounded-lg transition-all ${
                          isSelected(cat1, cat2)
                            ? "bg-cyan-300/[0.10] text-cyan-100 font-medium"
                            : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-300/60 flex-shrink-0" />
                        <span className="text-[11px] flex-1 truncate">{cat2}</span>
                        <span className="font-mono text-[10px] text-slate-500 flex-shrink-0">{subData.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-cyan-200/[0.08]">
        <div className="mb-2 text-[11px] text-slate-500">{items.length} 条记忆 · {catList.length} 个分类</div>
        <button
          onClick={exportItems}
          disabled={items.length === 0}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-left text-[12px] text-slate-400 transition-all hover:border-cyan-300/[0.22] hover:bg-cyan-300/[0.07] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          导出 JSON 备份
        </button>
      </div>
    </div>
  );
}

function buildTree(items) {
  const map = {};
  items.forEach((item) => {
    const c1 = item.category1 || "未分类";
    const c2 = item.category2 || "";
    if (!map[c1]) map[c1] = { count: 0, subs: {} };
    map[c1].count++;
    if (c2) {
      if (!map[c1].subs[c2]) map[c1].subs[c2] = { count: 0 };
      map[c1].subs[c2].count++;
    }
  });
  return map;
}