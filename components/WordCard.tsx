
import React, { useState } from 'react';
import { WordDetails } from '../types';
import { speakLocal } from '../services/geminiService';

interface WordCardProps {
  details: WordDetails;
}

export const WordCard: React.FC<WordCardProps> = ({ details }) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const handlePlay = async (accent: 'US' | 'UK') => {
    if (isPlaying) return;
    setIsPlaying(accent);
    
    // Sử dụng Speak Local để có tốc độ phản hồi 0ms
    await speakLocal(details.word, accent);
    
    setIsPlaying(null);
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-blue-500/20 shadow-[0_35px_60px_-15px_rgba(30,58,138,0.3)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-600/20 transition-all"></div>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 relative z-10">
          <div className="flex-1">
            <h2 className="text-6xl font-black text-white mb-4 tracking-tighter italic">{details.word}</h2>
            <div className="flex flex-wrap gap-2">
              {details.partsOfSpeech.map((pos) => (
                <span key={pos} className="px-4 py-1.5 bg-blue-600/10 text-blue-400 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] border border-blue-500/10">
                  {pos}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
             <button 
              onClick={() => handlePlay('US')}
              className={`flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-blue-600/40 min-w-[100px] justify-center ${isPlaying === 'US' ? 'ring-4 ring-white/20' : ''}`}
            >
              <i className={`fas ${isPlaying === 'US' ? 'fa-circle-notch animate-spin' : 'fa-volume-up'} text-sm`}></i>
              <span className="font-black text-xs uppercase tracking-widest">US</span>
            </button>
            <button 
              onClick={() => handlePlay('UK')}
              className={`flex items-center gap-3 bg-slate-950 hover:bg-slate-800 text-blue-500 px-6 py-4 rounded-2xl border border-blue-600/20 transition-all active:scale-95 shadow-xl min-w-[100px] justify-center ${isPlaying === 'UK' ? 'ring-4 ring-blue-500/20' : ''}`}
            >
              <i className={`fas ${isPlaying === 'UK' ? 'fa-circle-notch animate-spin' : 'fa-volume-up'} text-sm`}></i>
              <span className="font-black text-xs uppercase tracking-widest text-white">UK</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 group/ipa hover:border-blue-500/40 transition-all">
            <p className="text-blue-600 text-[10px] font-black mb-2 uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> US IPA
            </p>
            <p className="text-3xl font-mono text-white/90 group-hover/ipa:text-blue-400 transition-colors">{details.ipa_us}</p>
          </div>
          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 group/ipa hover:border-blue-500/40 transition-all">
            <p className="text-blue-600 text-[10px] font-black mb-2 uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> UK IPA
            </p>
            <p className="text-3xl font-mono text-white/90 group-hover/ipa:text-blue-400 transition-colors">{details.ipa_uk}</p>
          </div>
        </div>

        <div className="mt-12 space-y-6 relative z-10">
          <div>
            <h4 className="text-[10px] uppercase font-black text-slate-700 tracking-[0.4em] mb-3">Definition</h4>
            <p className="text-xl text-slate-300 leading-relaxed font-medium">{details.definition}</p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-black text-slate-700 tracking-[0.4em] mb-3">Usage Example</h4>
            <div className="relative p-6 bg-blue-600/5 rounded-3xl border-l-4 border-blue-600">
              <p className="text-lg text-blue-100 italic font-light">
                "{details.example}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
