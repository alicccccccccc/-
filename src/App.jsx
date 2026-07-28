import { useState, useEffect, useCallback } from "react";
import SearchBar from "./components/SearchBar";
import ContentList from "./components/ContentList";
import AddPanel from "./components/AddPanel";
import DetailView from "./components/DetailView";
import AnswerPanel from "./components/AnswerPanel";
import Sidebar from "./components/Sidebar";
import { getAllItems, searchItems, deleteItem } from "./store";
import { askMemory } from "./ai";

const QUESTION_PATTERN = /[?？吗呢么多少什么怎么哪谁为何是不是可否]/;

export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiSources, setAiSources] = useState(null);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    getAllItems()
      .then((all) => setItems(all.sort((a, b) => b.createdAt - a.createdAt)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(display-mode: standalone)");
    setIsInstalled(Boolean(media?.matches || window.navigator.standalone));

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const refreshItems = async () => {
    const all = await getAllItems();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  const clearAiAnswer = () => {
    setAiAnswer(null);
    setAiSources(null);
    setAnswerLoading(false);
  };

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    setAiAnswer(null);
    setAiSources(null);
    if (q.trim()) {
      const results = await searchItems(q);
      setSearchResults(results);
      if (QUESTION_PATTERN.test(q) && results.length > 0) {
        setAnswerLoading(true);
        const top = results.slice(0, 6);
        const answer = await askMemory(q, top);
        setAiAnswer(answer);
        setAiSources(top);
        setAnswerLoading(false);
      }
    } else {
      setSearchResults(null);
      await refreshItems();
    }
  }, []);

  const handleAdded = useCallback(async () => {
    await refreshItems();
    if (query.trim()) {
      const results = await searchItems(query);
      setSearchResults(results);
    }
  }, [query]);

  const handleDelete = useCallback(async (id) => {
    await deleteItem(id);
    await refreshItems();
    if (query.trim()) {
      const results = await searchItems(query);
      setSearchResults(results);
    }
    if (selectedItem?.id === id) setSelectedItem(null);
  }, [query, selectedItem]);

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
    setQuery("");
    setSearchResults(null);
    clearAiAnswer();
  };

  const filteredItems = (searchResults || items).filter((item) => {
    if (!selectedFolder) return true;
    const match1 = (item.category1 || "未分类") === selectedFolder.cat1;
    const match2 = !selectedFolder.cat2 || item.category2 === selectedFolder.cat2;
    return match1 && match2;
  });

  const displayedItems = filteredItems;
  const categories = new Set(items.map((item) => item.category1).filter(Boolean));
  const categorizedItems = items.filter((item) => item.category1).length;
  const recentItems = items.slice(0, 5);
  const recommendedTopic = recentItems.find((item) => item.category1)?.category1 || "未分类";
  const activeScope = selectedFolder
    ? `${selectedFolder.cat1}${selectedFolder.cat2 ? " / " + selectedFolder.cat2 : ""}`
    : "全部记忆";

  return (
    <div className="app-shell min-h-[100dvh] h-[100dvh] flex overflow-hidden bg-[#070b12] text-slate-100">
      <Sidebar items={items} selectedFolder={selectedFolder} onSelectFolder={handleSelectFolder} />

      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 border-b border-cyan-200/[0.08] bg-[#08101a]/85 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-50 tracking-normal select-none">记着</h1>
              <span className="hidden rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100 sm:inline-flex">Local Memory OS</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">当前范围：{activeScope}</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFolder && (
              <button onClick={() => handleSelectFolder(null)} className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-slate-300 transition-all hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white sm:inline-flex">查看全部</button>
            )}
            {!isInstalled && installPrompt && (
              <button onClick={handleInstall} className="hidden rounded-lg border border-cyan-300/[0.22] bg-cyan-300/[0.08] px-3 py-1.5 text-[12px] text-cyan-100 transition-all hover:bg-cyan-300/[0.14] md:inline-flex">安装应用</button>
            )}
            {!isInstalled && !installPrompt && (
              <span className="hidden text-[11px] text-slate-600 lg:inline">手机可用浏览器菜单添加到主屏幕</span>
            )}
            <button onClick={() => setShowAdd(true)} className="primary-action hidden sm:inline-flex rounded-lg px-3.5 py-1.5 text-[12px] font-medium text-white transition-all">保存记忆</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,55fr)_minmax(320px,25fr)] gap-0 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            {loading ? (
              <div className="max-w-[1120px] mx-auto px-6 py-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass rounded-2xl h-28 ai-processing" />
                ))}
              </div>
            ) : (
              <div className="max-w-[1120px] mx-auto px-6 py-6 pb-24">
                <WorkspaceHome
                  items={items}
                  recentItems={recentItems}
                  categoriesCount={categories.size}
                  categorizedItems={categorizedItems}
                  recommendedTopic={recommendedTopic}
                  onAdd={() => setShowAdd(true)}
                  onAsk={() => document.querySelector("[data-ai-search]")?.focus()}
                  onSelect={setSelectedItem}
                />
                <SearchBar onSearch={handleSearch} autoFocus recentItems={items.slice(0, 5)} compact={items.length > 0} />
                {(aiAnswer || answerLoading) && (
                  <div className="xl:hidden pb-5">
                    <AnswerPanel answer={aiAnswer} sources={aiSources} onSourceClick={setSelectedItem} loading={answerLoading} items={items} onAsk={handleSearch} onAdd={() => setShowAdd(true)} />
                  </div>
                )}
                <ContentList items={displayedItems} query={query} onSelect={setSelectedItem} onDelete={handleDelete} onAddFirst={() => setShowAdd(true)} />
              </div>
            )}
          </main>
          <aside className="hidden xl:block border-l border-cyan-200/[0.08] bg-[#070d16]/90 backdrop-blur-xl overflow-y-auto">
            <AnswerPanel answer={aiAnswer} sources={aiSources} onSourceClick={setSelectedItem} loading={answerLoading} items={items} onAsk={handleSearch} onAdd={() => setShowAdd(true)} />
          </aside>
        </div>
      </div>

      <button onClick={() => setShowAdd(true)} className="primary-action fixed bottom-6 right-6 z-30 rounded-lg px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 xl:hidden">保存记忆</button>

      {showAdd && <AddPanel onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
      {selectedItem && <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} onDelete={handleDelete} />}
    </div>
  );
}

function WorkspaceHome({ items, recentItems, categoriesCount, categorizedItems, recommendedTopic, onAdd, onAsk, onSelect }) {
  const categorizedPercent = items.length ? Math.round((categorizedItems / items.length) * 100) : 0;

  return (
    <section className="mb-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="memory-console min-w-0 flex-1 rounded-2xl border border-cyan-200/[0.10] bg-[#0a1220]/90 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-slate-50">个人记忆中枢</h2>
              <p className="mt-1 text-sm text-slate-400">保存、检索、追问你的本地资料，AI 只在有内容时提供判断。</p>
            </div>
            <div className="hidden rounded-lg border border-emerald-300/[0.18] bg-emerald-400/[0.08] px-3 py-1 text-[11px] text-emerald-100 sm:block">索引可用</div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Metric label="记忆" value={items.length} />
            <Metric label="分类" value={categoriesCount} />
            <Metric label="已分类" value={`${categorizedPercent}%`} />
          </div>

          <div className="mt-5 rounded-xl border border-cyan-300/[0.14] bg-cyan-300/[0.06] p-3">
            <p className="text-xs font-medium text-cyan-100">当前脉冲</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {items.length > 0
                ? `最近内容集中在「${recommendedTopic}」。可以直接搜索或提问，让 AI 从已保存资料里引用回答。`
                : "先保存一条文字或图片记忆，系统会生成摘要、标签和可搜索内容。"}
            </p>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0a101a]/90 p-4 lg:max-w-[320px]">
          <p className="text-xs font-medium text-slate-300">快捷操作</p>
          <div className="mt-3 grid gap-2">
            <button onClick={onAdd} className="primary-action rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white">保存记忆</button>
            <button onClick={onAsk} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-left text-sm text-slate-300 transition-all hover:border-cyan-300/[0.24] hover:bg-cyan-300/[0.08] hover:text-white">询问记忆库</button>
          </div>
        </div>
      </div>

      {recentItems.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#090f18]/90 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-200">最近记忆</p>
            <p className="text-[11px] text-slate-500">本地索引</p>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {recentItems.slice(0, 3).map((item) => (
              <button key={item.id} onClick={() => onSelect(item)} className="group min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition-all hover:border-cyan-300/[0.22] hover:bg-cyan-300/[0.06]">
                <p className="truncate text-sm font-medium text-slate-200">{item.aiTitle || (item.type === "image" ? "截图记忆" : "文字记忆")}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.aiSummary || item.category1 || "等待 AI 补充摘要"}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#07101b]/[0.84] px-3 py-3">
      <p className="font-mono text-lg font-semibold text-slate-50">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}