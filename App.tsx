
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getIPAForWord, getWordSuggestions, getParagraphIPA, generatePronunciation, decodeAudioData, decodeBase64 } from './services/geminiService';
import { WordDetails, HistoryItem, AppStatus } from './types';
import { WordCard } from './components/WordCard';
import { HistorySection } from './components/HistorySection';
import { ParagraphView } from './components/ParagraphView';

const cache: Record<string, WordDetails> = {};

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isParagraphMode, setIsParagraphMode] = useState(false);
  const [paragraphResult, setParagraphResult] = useState<{original: string, ipa: string}[] | null>(null);
  const [fullParagraphText, setFullParagraphText] = useState('');
  
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentWord, setCurrentWord] = useState<WordDetails | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isParagraphPlaying, setIsParagraphPlaying] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ipa_history');
    if (saved) {
      try {
        const parsed: HistoryItem[] = JSON.parse(saved);
        setHistory(parsed);
        parsed.forEach(item => { cache[item.word.toLowerCase()] = item; });
      } catch (e) { console.error(e); }
    }
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    if (searchTerm.trim().length > 1 && !isParagraphMode) {
      debounceTimer.current = window.setTimeout(async () => {
        const sugs = await getWordSuggestions(searchTerm);
        setSuggestions(sugs);
        setShowSuggestions(true);
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, isParagraphMode]);

  const updateHistory = useCallback((newItem: WordDetails) => {
    const key = newItem.word.toLowerCase();
    cache[key] = newItem;
    setHistory(prev => {
      const filtered = prev.filter(h => h.word.toLowerCase() !== key);
      const updated = [{ ...newItem, id: crypto.randomUUID(), timestamp: Date.now() }, ...filtered].slice(0, 50);
      localStorage.setItem('ipa_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const prefetchAudio = (word: string) => {
    // Proactively fetch audio in the background
    generatePronunciation(word, 'US').catch(() => {});
    generatePronunciation(word, 'UK').catch(() => {});
  };

  const handleSearch = async (e?: React.FormEvent, manualWord?: string) => {
    if (e) e.preventDefault();
    const word = (manualWord || searchTerm).trim();
    if (!word) return;

    setShowSuggestions(false);
    const lowerWord = word.toLowerCase();

    if (cache[lowerWord]) {
      const details = cache[lowerWord];
      setCurrentWord(details);
      setParagraphResult(null);
      setStatus(AppStatus.SUCCESS);
      setSearchTerm('');
      updateHistory(details);
      prefetchAudio(details.word); // Pre-fetch even if in cache in case audioCache was cleared
      return;
    }

    setStatus(AppStatus.LOADING);
    setErrorMsg('');
    try {
      const details = await getIPAForWord(word);
      setCurrentWord(details);
      setParagraphResult(null);
      updateHistory(details);
      prefetchAudio(details.word); // Proactive pre-fetching for instant playback
      setStatus(AppStatus.SUCCESS);
      setSearchTerm('');
    } catch (error: any) {
      setStatus(AppStatus.ERROR);
      setErrorMsg(error.message || 'Error fetching word.');
    }
  };

  const handleParagraphSubmit = async (text: string) => {
    setFullParagraphText(text);
    setStatus(AppStatus.LOADING);
    setErrorMsg('');
    try {
      const result = await getParagraphIPA(text);
      setParagraphResult(result);
      setCurrentWord(null);
      setStatus(AppStatus.SUCCESS);
      // Background generate full paragraph audio
      generatePronunciation(text, 'US').catch(() => {});
    } catch (error: any) {
      setStatus(AppStatus.ERROR);
      setErrorMsg('Failed to process paragraph.');
    }
  };

  const playParagraphAudio = async () => {
    if (!fullParagraphText || isParagraphPlaying) return;
    try {
      setIsParagraphPlaying(true);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64Data = await generatePronunciation(fullParagraphText, 'US');
      const audioData = decodeBase64(base64Data);
      const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsParagraphPlaying(false);
      source.start();
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsParagraphPlaying(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentWord(item);
    setParagraphResult(null);
    setStatus(AppStatus.SUCCESS);
    prefetchAudio(item.word);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 selection:bg-blue-600/30 overflow-x-hidden pb-20">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        <header className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-600/40 mb-6 rotate-6 hover:rotate-0 transition-all cursor-pointer">
            <i className="fas fa-language text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase italic">
            get ipa <span className="text-blue-500">of the word</span>
          </h1>
          <p className="text-blue-400/60 text-sm md:text-base font-bold tracking-[0.2em] uppercase">
            Modern English Learning Companion
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="flex bg-slate-900/30 p-1.5 rounded-2xl border border-blue-500/10 mb-10 backdrop-blur-xl">
          <button 
            onClick={() => { setIsParagraphMode(false); setStatus(AppStatus.IDLE); }}
            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isParagraphMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Word
          </button>
          <button 
            onClick={() => { setIsParagraphMode(true); setStatus(AppStatus.IDLE); }}
            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isParagraphMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Paragraph
          </button>
        </div>

        {/* Dynamic Search/Input Section */}
        <div className="w-full max-w-2xl mb-12 relative">
          {!isParagraphMode ? (
            <form onSubmit={handleSearch} className="relative group">
              <input 
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                placeholder="Search word for IPA & Audio..."
                className="w-full bg-slate-900/20 border-2 border-slate-800 focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 outline-none rounded-3xl py-5 px-8 pr-32 text-xl text-white placeholder:text-slate-800 transition-all backdrop-blur-md"
              />
              <button 
                type="submit"
                disabled={status === AppStatus.LOADING}
                className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-blue-600/20 uppercase text-xs tracking-widest"
              >
                {status === AppStatus.LOADING ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fas fa-search text-[10px]"></i><span>Search</span></>}
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/90 border border-blue-500/20 rounded-3xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSearchTerm(sug); handleSearch(undefined, sug); }}
                      className="w-full text-left px-8 py-4 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 transition-colors border-b border-white/5 last:border-0 font-bold"
                    >
                      <i className="fas fa-arrow-right text-[10px] mr-4 text-blue-500"></i>
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <ParagraphView onSubmit={handleParagraphSubmit} loading={status === AppStatus.LOADING} />
          )}

          {status === AppStatus.ERROR && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold text-center flex items-center justify-center gap-3">
              <i className="fas fa-exclamation-triangle"></i> {errorMsg}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="w-full flex flex-col items-center gap-10">
          {status === AppStatus.LOADING && (
            <div className="flex flex-col items-center py-20 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Linguistics Engine Active</p>
            </div>
          )}

          {status === AppStatus.SUCCESS && currentWord && <WordCard details={currentWord} />}
          
          {status === AppStatus.SUCCESS && paragraphResult && (
            <div className="w-full max-w-4xl glass-panel rounded-3xl p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500 border border-blue-500/10">
              <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <h3 className="text-sm uppercase font-black text-blue-400 tracking-[0.2em]">Paragraph IPA Transcript</h3>
                <button 
                  onClick={playParagraphAudio}
                  disabled={isParagraphPlaying}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95"
                >
                  {isParagraphPlaying ? (
                    <i className="fas fa-spinner animate-spin"></i>
                  ) : (
                    <i className="fas fa-volume-up"></i>
                  )}
                  {isParagraphPlaying ? 'Speaking...' : 'Listen All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-10 items-end justify-start">
                {paragraphResult.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center group relative">
                    <span className="text-blue-400 font-mono text-sm mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-8 bg-blue-600/10 px-2 py-1 rounded-lg border border-blue-600/20 whitespace-nowrap z-20 pointer-events-none">{item.ipa}</span>
                    <span className="text-2xl text-white font-medium group-hover:text-blue-400 transition-colors">{item.original}</span>
                    <span className="text-blue-600/50 font-mono text-xs mt-2 uppercase tracking-tighter">{item.ipa}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === AppStatus.IDLE && (
            <div className="py-24 text-center opacity-10 flex flex-col items-center">
               <div className="w-32 h-32 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-8">
                 <i className={`fas ${isParagraphMode ? 'fa-align-left' : 'fa-keyboard'} text-5xl`}></i>
               </div>
               <p className="text-sm font-black uppercase tracking-[0.4em]">Awaiting Input</p>
            </div>
          )}

          <HistorySection items={history} onSelectItem={handleSelectHistory} onClearHistory={() => { setHistory([]); localStorage.removeItem('ipa_history'); }} />
        </div>

        <footer className="mt-32 pt-10 border-t border-white/5 w-full text-center text-slate-800 text-[10px] uppercase font-black tracking-[0.5em]">
          <p>© 2024 get ipa of the word • design by GB</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
