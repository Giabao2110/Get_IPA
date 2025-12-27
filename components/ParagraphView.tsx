
import React, { useState } from 'react';

interface ParagraphViewProps {
  onSubmit: (text: string) => void;
  loading: boolean;
}

export const ParagraphView: React.FC<ParagraphViewProps> = ({ onSubmit, loading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) onSubmit(text);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter sentences or a full paragraph to see the IPA flow..."
        rows={6}
        className="w-full bg-slate-900/20 border-2 border-slate-800 focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 outline-none rounded-3xl py-6 px-8 text-xl text-white placeholder:text-slate-800 transition-all backdrop-blur-md resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4 shadow-xl shadow-blue-600/30 uppercase text-xs tracking-widest"
        >
          {loading ? (
            <i className="fas fa-circle-notch animate-spin"></i>
          ) : (
            <i className="fas fa-bolt"></i>
          )}
          <span>Generate Full IPA Transcript</span>
        </button>
      </div>
    </form>
  );
};
