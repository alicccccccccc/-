import { useRef, useState } from "react";

export default function UploadZone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onFileSelected(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    readFile(file);
  };

  const handleChange = (e) => {
    const file = e.target?.files?.[0];
    readFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`rounded-2xl p-10 text-center cursor-pointer transition-all
        ${dragOver ? "ai-border bg-cyan-300/10" : "border border-dashed border-white/[0.14] hover:border-cyan-300/[0.35] hover:bg-cyan-300/[0.08]"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <svg className="w-10 h-10 text-cyan-100" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-slate-200">保存一份记忆</p>
          <p className="text-xs text-slate-500 mt-1">拖拽文件到这里，或点击选择</p>
        </div>
        <p className="text-[11px] text-slate-600 mt-1">支持 JPG、PNG、GIF 等图片格式</p>
      </div>
    </div>
  );
}
