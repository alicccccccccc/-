import { useState, useRef, useEffect } from "react";
import { addTextItem, addImageItem } from "../store";
import { generateAIContent, generateImageMemory } from "../ai";
import UploadZone from "./UploadZone";

export default function AddPanel({ onClose, onAdded }) {
  const [mode, setMode] = useState(null);
  const [text, setText] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [userKeywords, setUserKeywords] = useState("");
  const [savedBase64, setSavedBase64] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef(null);
  const keywordRef = useRef(null);

  useEffect(() => {
    if (mode === "text" && textareaRef.current) textareaRef.current.focus();
  }, [mode]);

  useEffect(() => {
    if (aiStatus === "error" && keywordRef.current) keywordRef.current.focus();
  }, [aiStatus]);

  const handleFileSelected = (base64) => {
    setImageSrc(base64);
    setMode("image");
    setSavedBase64(base64);
    analyzeImage(base64);
  };

  const analyzeImage = async (base64) => {
    setOcrProgress({ status: "loading", progress: 35, text: "" });
    setAiStatus("generating");
    setUserKeywords("");
    setErrorMessage("");
    setSavedBase64(base64);

    try {
      const ai = await generateImageMemory(base64);
      const searchableText = ai.searchableText || ai.summary || ai.title || "";
      setOcrProgress({ status: "done", progress: 100, text: searchableText });
      setAiStatus("done");
      const item = await addImageItem(base64, searchableText, ai.title, ai.tags, ai.summary, ai.entities, ai.category1, ai.category2, ai.importance);
      onAdded(item);
    } catch (err) {
      console.error("Image AI failed:", err);
      setErrorMessage(cleanError(err));
      setOcrProgress({ status: "error", progress: 0, text: "" });
      setAiStatus("error");
    }
  };

  const handleSaveWithKeywords = async () => {
    const keywords = userKeywords.split(/[,，\s]+/).map(k => k.trim()).filter(Boolean);
    const searchableText = keywords.join(" ");
    const item = await addImageItem(savedBase64 || imageSrc, searchableText, "截图", keywords, searchableText, {}, "", "", 3);
    onAdded(item);
    onClose();
  };

  const handleRetry = () => { if (savedBase64) analyzeImage(savedBase64); };

  const handleSaveText = async () => {
    if (!text.trim()) return;
    setAiStatus("generating");
    const ai = await generateAIContent(text.trim());
    setAiStatus("done");
    const item = await addTextItem(text.trim(), ai.title, ai.tags, ai.summary, ai.entities, ai.category1, ai.category2, ai.importance);
    onAdded(item);
    onClose();
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveText(); };

  const accentBtn = "primary-action flex-1 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all";
  const ghostBtn = "flex-1 py-2.5 text-sm text-slate-400 hover:text-white rounded-lg border border-white/10 hover:bg-white/[0.08] transition-colors";

  if (mode === null) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center pb-8" onClick={onClose}>
        <div className="absolute inset-0 bg-black/[0.55] backdrop-blur-sm" />
        <div className="relative glass-strong rounded-2xl w-full max-w-md mx-4 p-6 z-50" onClick={e => e.stopPropagation()}>
          <h3 className="text-base font-medium text-slate-200 mb-4">添加内容</h3>
          <div className="space-y-2">
            <button onClick={() => setMode("text")} className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/5 hover:border-cyan-300/20 hover:bg-cyan-300/5 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></div>
              <div><p className="text-sm font-medium text-slate-200">输入文字</p><p className="text-xs text-slate-500">AI 自动生成标题、摘要和标签</p></div>
            </button>
            <button onClick={() => setMode("image")} className="w-full text-left">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/10 hover:border-cyan-300/20 hover:bg-cyan-300/5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Zm16.5-7.5h.008v.008h-.008v-.008Z" /></svg></div>
                <div><p className="text-sm font-medium text-slate-200">上传图片</p><p className="text-xs text-slate-500">多模态 AI 直接识别文字和画面</p></div>
              </div>
            </button>
          </div>
          <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">取消</button>
        </div>
      </div>
    );
  }

  if (mode === "text") {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center pb-8" onClick={onClose}>
        <div className="absolute inset-0 bg-black/[0.55] backdrop-blur-sm" />
        <div className="relative glass-strong rounded-2xl w-full max-w-md mx-4 p-6 z-50" onClick={e => e.stopPropagation()}>
          <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder="输入或粘贴文字内容..." rows={5} className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.055] text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-cyan-300" />
          <p className="text-xs text-slate-500 mt-1">Ctrl+Enter 保存，AI 自动生成摘要</p>
          {aiStatus === "generating" && (<div className="mt-2 flex items-center gap-2 rounded-xl border border-cyan-300/[0.15] bg-cyan-300/[0.08] px-3 py-2 ai-processing"><span className="ai-orb !w-5 !h-5" /><p className="text-xs text-cyan-100">AI 正在理解内容...</p></div>)}
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setMode(null); setText(""); setAiStatus(null); }} className={ghostBtn}>返回</button>
            <button onClick={handleSaveText} disabled={!text.trim()} className={accentBtn}>保存</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center pb-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/[0.55] backdrop-blur-sm" />
      <div className="relative glass-strong rounded-2xl w-full max-w-md mx-4 p-6 z-50" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-medium text-slate-200 mb-3">上传图片</h3>
        {!imageSrc ? (
          <UploadZone onFileSelected={handleFileSelected} />
        ) : (
          <>
            <img src={imageSrc} alt="预览" className="w-full rounded-xl border border-white/10" />
            {ocrProgress && ocrProgress.status === "loading" && (
              <div className="mt-3 rounded-xl border border-cyan-300/[0.15] bg-cyan-300/[0.08] p-3 ai-processing"><div className="flex items-center gap-2 text-sm text-slate-300"><span className="ai-orb !w-5 !h-5" />多模态 AI 正在识别图片...</div><div className="mt-2 w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full transition-all duration-300" style={{ width: `${ocrProgress.progress}%` }} /></div></div>
            )}
            {ocrProgress && ocrProgress.status === "done" && (
              <div className="mt-3 space-y-2">
                <div className="p-3 rounded-lg bg-white/[0.035] border border-white/[0.07]"><p className="text-xs text-slate-500 mb-1">可搜索内容</p><p className="text-sm text-slate-300 whitespace-pre-wrap">{ocrProgress.text || "(未提取到内容)"}</p></div>
                {aiStatus === "done" && (<div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg><p className="text-xs text-emerald-400">AI 理解完成</p></div>)}
              </div>
            )}
            {aiStatus === "error" && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-3">
                <div className="flex items-center gap-2"><svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg><p className="text-sm text-amber-400 font-medium">AI 识别失败</p></div>
                <p className="text-xs text-amber-500">可以重试，或手动添加关键词保存为可检索记忆。</p>
                {errorMessage && <p className="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1.5 text-[11px] leading-relaxed text-amber-200">{errorMessage}</p>}
                <div><input ref={keywordRef} type="text" value={userKeywords} onChange={e => setUserKeywords(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSaveWithKeywords(); }} placeholder="输入关键词，用逗号或空格分隔..." className="w-full p-2.5 rounded-lg border border-amber-300/20 text-sm text-slate-200 placeholder:text-slate-500 bg-white/[0.055] focus:outline-none focus:border-amber-300/50" /><p className="text-[11px] text-amber-500 mt-1">例如：合同 押金 房东 2025年</p></div>
                <div className="flex gap-2"><button onClick={handleRetry} className="flex-1 py-2 text-xs text-slate-400 hover:text-white rounded-lg border border-white/10 hover:bg-white/[0.08] transition-colors">重新识别</button><button onClick={handleSaveWithKeywords} disabled={!userKeywords.trim()} className="primary-action flex-1 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">保存</button></div>
              </div>
            )}
          </>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={() => { setMode(null); setImageSrc(null); setOcrProgress(null); setAiStatus(null); setUserKeywords(""); setErrorMessage(""); }} className={ghostBtn}>{imageSrc ? "放弃" : "返回"}</button>
          {imageSrc && ocrProgress?.status === "done" && aiStatus !== "error" && (<button onClick={onClose} className={accentBtn}>完成</button>)}
        </div>
      </div>
    </div>
  );
}
function cleanError(error) {
  const raw = String(error?.message || error || "识别请求失败");
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed?.error?.message || raw.slice(0, 220);
    }
  } catch (_) {
    // Keep the original text below.
  }
  return raw.slice(0, 220);
}