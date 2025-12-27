
import React from 'react';
import { HistoryItem } from '../types';

interface HistorySectionProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ items, onSelectItem, onClearHistory }) => {
  if (items.length === 0) return null;

  const exportHistory = () => {
    const headers = ['Word', 'IPA (US)', 'IPA (UK)', 'Definition', 'Example'];
    const rows = items.map(item => [
      item.word,
      item.ipa_us,
      item.ipa_uk,
      item.definition.replace(/,/g, ';'),
      item.example.replace(/,/g, ';')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "ipa_history_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-2xl mt-16 animate-in fade-in duration-700 delay-300">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-widest">
          <i className="fas fa-history text-blue-500"></i>
          Recent Activity
        </h3>
        <div className="flex gap-4">
          <button 
            onClick={exportHistory}
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <i className="fas fa-file-export"></i> Extract Data
          </button>
          <button 
            onClick={onClearHistory}
            className="text-slate-700 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-widest"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="flex items-center justify-between p-5 bg-slate-900/40 backdrop-blur-sm rounded-2xl hover:bg-blue-600/10 transition-all border border-white/5 group text-left shadow-lg hover:border-blue-500/30"
          >
            <div>
              <p className="text-white font-black group-hover:text-blue-400 transition-colors text-lg italic">{item.word}</p>
              <p className="text-xs text-blue-600 font-mono mt-1 opacity-60">{item.ipa_us}</p>
            </div>
            <div className="text-slate-800 group-hover:text-blue-500 transition-colors">
              <i className="fas fa-arrow-right text-xs"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
