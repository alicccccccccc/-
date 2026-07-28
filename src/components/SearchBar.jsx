import { useState, useRef, useEffect } from "react";
import { generateSuggestions } from "../suggestions";

export default function SearchBar({ onSearch, autoFocus, recentItems, compact = false }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const suggestions = generateSuggestions(recentItems || []);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleChange = (e) => {
    setValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
    inputRef.current?.focus();
  };

  const handleSuggestion = (q) => {
    setValue(q);
    onSearch(q);
    inputRef.current?.focus();
  };

  return (
    <section className={`w-full ${compact ? "mb-4" : "max-w-[940px] mx-auto px-5 pt-10 pb-7"}`}>
      <div className={`relative rounded-2xl ${focused ? "ai-border" : ""}`}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <span className="h-7 w-7 rounded-full bg-cyan-300/[0.10] flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-100" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
            </svg>
          </span>
        </div>

        <input
          ref={inputRef}
          data-ai-search
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="搜索你的个人记忆库..."
          className="w-full h-14 rounded-2xl border border-cyan-200/[0.10] bg-[#07101b]/[0.90] pl-14 pr-16 text-[15px] text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-200 outline-none focus:border-cyan-300/[0.35] focus:bg-[#0d1422]"
        />

        {value ? (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="清空搜索"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 bg-white/[0.045] border border-white/[0.08] px-2 py-1 rounded-lg font-mono tracking-tight">
            Ctrl K
          </span>
        )}
      </div>

      {!compact && !value && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4 justify-center">
          <span className="text-xs text-slate-500">最近记忆</span>
          {suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(q)}
              className="text-xs text-slate-300 hover:text-white bg-white/[0.045] hover:bg-cyan-300/[0.10] border border-white/[0.07] hover:border-cyan-300/20 px-3 py-1.5 rounded-full transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
