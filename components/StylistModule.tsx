
import React, { useState, useEffect, useRef } from 'react';
import { generateOutfits, analyzeWardrobeGaps, searchForGapItems, createStylingChat, getActiveStylistProfile } from '../services/stylistService';
import { WardrobeItem, OutfitRecommendation, WardrobeGap, StylePersona, ChatMessage, AgentMode } from '../types';
import { trackEvent } from '../services/analyticsService';
import { buildPreferenceMemory, getStyleBriefSuggestion, rerankOutfitsWithPreferences } from '../services/personalizationService';
import { useCloset } from '../contexts/ClosetContext';

interface StylistModuleProps {
  items: WardrobeItem[];
  savedOutfits: OutfitRecommendation[];
  onSavedOutfitsChange: React.Dispatch<React.SetStateAction<OutfitRecommendation[]>>;
}

const PERSONAS: StylePersona[] = ['Minimalist', 'Streetwear', 'Classic Professional', 'Bohemian', 'Quiet Luxury', 'Bold & Eclectic'];
const AGENT_MODES: Array<{ mode: AgentMode; title: string; desc: string }> = [
  { mode: 'Precision', title: 'Precision Agent', desc: 'Optimizes for practicality, compatibility, and low-risk outfit confidence.' },
  { mode: 'Balanced', title: 'Balanced Agent', desc: 'Blends polish, versatility, and tasteful creativity for everyday performance.' },
  { mode: 'Editorial', title: 'Editorial Agent', desc: 'Pushes stronger contrasts, bolder layering, and more fashion-forward looks.' },
];

// Props interface for OutfitCard component.
interface OutfitCardProps {
  outfit: OutfitRecommendation;
  isSavedView?: boolean;
  isAlreadySaved: boolean;
  getItemById: (id: string) => WardrobeItem | undefined;
  onToggleSave: (outfit: OutfitRecommendation) => void;
  onUpdateUsage?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onSetFeedback?: (id: string, feedback: 'love' | 'skip', source: 'curator' | 'lookbook') => void;
}

// Defining OutfitCard outside of StylistModule resolves the TS "Property 'key' does not exist" error 
// and follows React best practices for stable component identities.
const OutfitCard: React.FC<OutfitCardProps> = ({ 
  outfit, 
  isSavedView = false, 
  isAlreadySaved, 
  getItemById, 
  onToggleSave, 
  onUpdateUsage, 
  onUpdateNotes,
  onSetFeedback 
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(outfit.userNotes || '');

  return (
    <div className={`bg-white rounded-[2rem] p-7 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col group transition-all hover:-translate-y-1 ${isSavedView ? 'hover:shadow-indigo-100' : ''}`}>
      <div className="mb-4 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{outfit.styleVibe}</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{outfit.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {outfit.generationSource && (
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${outfit.generationSource === 'fallback' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {outfit.generationSource === 'fallback' ? 'Fallback plan' : 'AI generated'}
              </span>
            )}
            {outfit.generationVersion && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {outfit.generationVersion}
              </span>
            )}
          </div>
          {isSavedView && outfit.dateSaved && (
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Saved {new Date(outfit.dateSaved).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isSavedView && onUpdateUsage && (
            <button 
              onClick={() => onUpdateUsage(outfit.id)}
              className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              title="Mark as worn today"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          )}
          <button 
            onClick={() => onToggleSave(outfit)} 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSavedView ? 'text-slate-300 hover:text-red-500' : 'text-indigo-600'}`}
          >
            {isSavedView ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-6 h-6" fill={isAlreadySaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 space-y-4">
        <p className="text-sm text-slate-500 leading-relaxed">"{outfit.description}"</p>
        
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Concierge Tip</p>
          <p className="text-xs text-slate-600 italic leading-relaxed">{outfit.stylistTip}</p>
        </div>

        {outfit.recommendedBecause && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Why this is ranked highly</p>
            <p className="text-xs text-emerald-800 leading-relaxed">{outfit.recommendedBecause}</p>
          </div>
        )}

        <div className="space-y-2">
          {outfit.itemIds.map(id => {
            const item = getItemById(id);
            if (!item) return null;
            return (
              <div key={id} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-50 shadow-sm group/item">
                <div className="w-10 h-10 rounded-lg flex-shrink-0 border border-slate-100" style={{ backgroundColor: item.dominantColorHex }}></div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 capitalize truncate">{item.subcategory}</span>
                  <span className="text-[10px] text-slate-400 truncate">{item.colorName} • {item.brand}</span>
                </div>
              </div>
            );
          })}
        </div>

        {isSavedView && onUpdateNotes && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stylist Notes</span>
              <button 
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                className="text-[10px] font-bold text-indigo-500 hover:underline"
              >
                {isEditingNotes ? 'Finish' : (outfit.userNotes ? 'Edit' : 'Add Note')}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  onUpdateNotes(outfit.id, notes);
                  setIsEditingNotes(false);
                }}
                autoFocus
                className="w-full p-3 bg-slate-50 border border-indigo-100 rounded-xl text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none h-20"
                placeholder="Notes on why you love this look..."
              />
            ) : (
              <p className="text-xs text-slate-500 italic">
                {outfit.userNotes || 'No notes added yet.'}
              </p>
            )}
          </div>
        )}
      </div>


      {onSetFeedback && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onSetFeedback(outfit.id, 'love', isSavedView ? 'lookbook' : 'curator')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${outfit.outfitFeedback === 'love' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'}`}
          >
            👍 Love this
          </button>
          <button
            onClick={() => onSetFeedback(outfit.id, 'skip', isSavedView ? 'lookbook' : 'curator')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${outfit.outfitFeedback === 'skip' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200'}`}
          >
            👎 Skip
          </button>
        </div>
      )}

      {!isSavedView && (
        <button 
          onClick={() => onToggleSave(outfit)}
          className={`w-full mt-6 py-3 rounded-2xl text-xs font-bold transition-all ${
            isAlreadySaved
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
          }`}
        >
          {isAlreadySaved ? 'Saved to Lookbook' : 'Add to Lookbook'}
        </button>
      )}
    </div>
  );
};

export const StylistModule: React.FC = () => {
  const { items, savedOutfits, setSavedOutfits } = useCloset();
  const onSavedOutfitsChange = setSavedOutfits;
  const [occasion, setOccasion] = useState('Casual Weekend');
  const [persona, setPersona] = useState<StylePersona>('Minimalist');
  const [agentMode, setAgentMode] = useState<AgentMode>('Balanced');
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [gaps, setGaps] = useState<WardrobeGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [weather, setWeather] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{ text: string, sources: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setLoadingHint(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLoadingHint('Still curating looks — Gemini is taking longer than usual. You can keep waiting or retry.');
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [loading]);


  useEffect(() => {
    if (isChatOpen && !chatSessionRef.current) {
      chatSessionRef.current = createStylingChat(items, persona, agentMode);
    }
  }, [isChatOpen, items, persona, agentMode]);

  useEffect(() => {
    chatSessionRef.current = null;
  }, [persona, agentMode, items]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;
    if (!chatSessionRef.current) {
      trackEvent('chat_failed', { reason: 'session_unavailable', persona });
      setChatError('The style consultant is not ready yet. Close and reopen chat to retry.');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', text: userInput };
    trackEvent('stylist_chat_message_sent', { persona, message_length: userInput.trim().length });
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsSending(true);
    setChatError(null);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userInput });
      const modelMsg: ChatMessage = { role: 'model', text: result.text };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      trackEvent('chat_failed', { reason: 'send_error', persona });
      setChatError('Message failed to send. Please retry in a moment.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerate = async () => {
    if (items.length < 2) {
      trackEvent('outfits_generation_failed', { reason: 'insufficient_inventory', persona, occasion });
      setGenerationError('Add at least one top and one bottom before generating outfits.');
      return;
    }

    setLoading(true);
    setGenerationError(null);
    trackEvent('outfits_requested', {
      occasion,
      persona,
      weather_present: Boolean(weather),
      inventory_size: items.length,
    });
    try {
      const result = await Promise.race([
        generateOutfits(items, occasion, persona, weather || undefined, agentMode),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), activeProfile.timeoutMs);
        }),
      ]);

      if (!result.length) {
        trackEvent('outfits_generation_failed', { reason: 'empty_result', persona, occasion });
        setGenerationError('We could not build a complete look from the current inventory. Try a new occasion or add more staples.');
        return;
      }

      const ranked = rerankOutfitsWithPreferences(result, savedOutfits, items, { persona, occasion, weather });
      setOutfits(ranked);
      trackEvent('outfits_generated', { count: result.length });
      setGenerationError(null);
    } catch (error) {
      const reason = error instanceof Error && error.message === 'timeout' ? 'timeout' : 'service_error';
      trackEvent('outfits_generation_failed', { reason, persona, occasion });
      setGenerationError(
        reason === 'timeout'
          ? 'Outfit generation timed out. Retry now or simplify the request.'
          : 'We could not generate outfits right now. Please retry.'
      );
      showToast("Style engine is warming up.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveOutfit = (outfit: OutfitRecommendation) => {
    const isAlreadySaved = savedOutfits.some(o => o.id === outfit.id);
    if (isAlreadySaved) {
      onSavedOutfitsChange(prev => prev.filter(o => o.id !== outfit.id));
      trackEvent('outfit_unsaved', { outfit_id: outfit.id });
      showToast("Removed from Lookbook");
    } else {
      const newOutfit = { ...outfit, isSaved: true, dateSaved: Date.now() };
      onSavedOutfitsChange(prev => [newOutfit, ...prev]);
      trackEvent('outfit_saved', { outfit_id: outfit.id });
      showToast("Added to Lookbook ✨");
    }
  };

  const updateOutfitUsage = (id: string) => {
    onSavedOutfitsChange(prev => prev.map(o =>
      o.id === id ? { ...o, lastWorn: Date.now() } : o
    ));
    showToast("Outfit marked as worn today!");
  };

  const updateOutfitNotes = (id: string, notes: string) => {
    onSavedOutfitsChange(prev => prev.map(o =>
      o.id === id ? { ...o, userNotes: notes } : o
    ));
  };


  const setOutfitFeedback = (id: string, feedback: 'love' | 'skip', source: 'curator' | 'lookbook') => {
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, outfitFeedback: feedback } : o));
    onSavedOutfitsChange(prev => prev.map(o => o.id === id ? { ...o, outfitFeedback: feedback } : o));
    trackEvent('outfit_feedback_given', { outfit_id: id, feedback, source });
    showToast(feedback === 'love' ? 'Preference saved: Love this look' : 'Preference saved: Skip this look');
  };

  const getItemById = (id: string) => items.find(i => i.id === id);
  const activeProfile = getActiveStylistProfile(agentMode);
  const preferenceMemory = buildPreferenceMemory(savedOutfits, items);
  const learnedBrief = getStyleBriefSuggestion(preferenceMemory);

  return (
    <div className="py-12 max-w-6xl mx-auto space-y-12 px-4 animate-in fade-in duration-700 relative">
      <section className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-10 shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">
              Style Concierge Experience
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Editorial-grade outfit curation with live AI assistance.</h1>
              <p className="mt-3 max-w-2xl text-slate-300 leading-relaxed">
                Build looks with weather context, save high-performing combinations, and refine your aesthetic with a premium recommendation workspace inspired by modern luxury retail tooling.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Inventory ready', value: items.length },
              { label: 'Saved looks', value: savedOutfits.length },
              { label: 'Persona', value: persona },
              { label: 'Agent mode', value: agentMode },
              { label: 'Prompt version', value: activeProfile.promptVersion },
              { label: 'Top signal', value: preferenceMemory.topColorFamilies[0] || 'Learning' },
              { label: 'Fallback path', value: activeProfile.fallbackStrategy },
              { label: 'Loved looks', value: preferenceMemory.lovedOutfitCount },
              { label: 'Occasion', value: occasion },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                <p className="mt-2 text-lg font-black text-white">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      {/* Shopping Search Overlay */}
      {searchResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setSearchResult(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Shopping Recommendations</h3>
            <div className="prose prose-sm text-slate-600 mb-8 max-h-60 overflow-y-auto pr-4">
              <p className="whitespace-pre-wrap">{searchResult.text}</p>
            </div>
            <div className="space-y-2">
              {searchResult.sources.map((src: any, i: number) => (
                <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50 transition-colors">
                  <span className="text-sm font-bold text-slate-700 truncate">{src.title}</span>
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Consultation Sidebar/Drawer */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-[110] border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Style Consultant</h4>
              <p className="text-[10px] text-indigo-500 font-bold uppercase">Persona: {persona}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">{activeProfile.chatPromptVersion} · {activeProfile.chatModel}</p>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-50 rounded-full">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <p className="text-sm text-slate-500">Ask me anything about your items, color matching, or style trends.</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isSending && <div className="text-xs text-slate-400 animate-pulse">Consultant is thinking...</div>}
            {chatError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {chatError}
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your style question..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" disabled={isSending} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Style Concierge</h2>
          <div className="flex items-center gap-4">
             <p className="text-slate-500 text-lg">Intelligent wardrobe coordination.</p>
             <button
               onClick={() => {
                 trackEvent('stylist_chat_opened', { persona });
                 setIsChatOpen(true);
               }}
               className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:border-indigo-600 transition-all shadow-sm"
             >
               <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
               Consult Gemini
             </button>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setShowSaved(false)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!showSaved ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Curator</button>
          <button onClick={() => setShowSaved(true)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${showSaved ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Lookbook ({savedOutfits.length})</button>
        </div>
      </div>

      {!showSaved ? (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Style Persona</label>
                <div className="flex flex-wrap gap-2">
                  {PERSONAS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        persona === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Styling Agent</label>
                <div className="grid grid-cols-1 gap-3">
                  {AGENT_MODES.map((agent) => (
                    <button
                      key={agent.mode}
                      onClick={() => setAgentMode(agent.mode)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        agentMode === agent.mode
                          ? 'border-fuchsia-300 bg-fuchsia-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-fuchsia-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-sm font-bold ${agentMode === agent.mode ? 'text-fuchsia-900' : 'text-slate-900'}`}>{agent.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{agent.desc}</p>
                        </div>
                        {agentMode === agent.mode && (
                          <span className="h-3 w-3 rounded-full bg-fuchsia-500 shadow-[0_0_16px_rgba(217,70,239,0.45)]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Occasion</label>
                <div className="grid grid-cols-1 gap-2">
                  {["Casual Weekend", "Business Meeting", "Date Night", "Travel Ready"].map(o => (
                    <button
                      key={o}
                      onClick={() => setOccasion(o)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                        occasion === o ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-600'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Weather Context</label>
                <input
                  value={weather || ''}
                  onChange={(e) => setWeather(e.target.value || null)}
                  placeholder="Optional: cool rain, warm sun, breezy evening..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Agent brief</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{agentMode} mode • {persona}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {AGENT_MODES.find((agent) => agent.mode === agentMode)?.desc}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Preference memory</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{preferenceMemory.topColorFamilies.length ? preferenceMemory.topColorFamilies.join(' • ') : 'Building your profile...'}</p>
                  </div>
                  {learnedBrief.persona && (
                    <button
                      onClick={() => {
                        if (learnedBrief.persona) setPersona(learnedBrief.persona);
                        if (learnedBrief.occasion) setOccasion(learnedBrief.occasion);
                        if (learnedBrief.weather) setWeather(learnedBrief.weather);
                        showToast('Applied learned style brief');
                      }}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-emerald-700"
                    >
                      Use learned brief
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Favorite persona: <span className="font-semibold">{preferenceMemory.favoritePersona || 'Learning'}</span> · Favorite occasion: <span className="font-semibold">{preferenceMemory.favoriteOccasion || 'Learning'}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Signals: {preferenceMemory.lovedOutfitCount} loved · {preferenceMemory.skippedOutfitCount} skipped · Top category {preferenceMemory.topCategories[0]?.category || 'pending'}
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || items.length < 2}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Curating...' : 'Generate Outfits'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>

              {generationError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs text-rose-700 font-semibold">{generationError}</p>
                  <button
                    onClick={handleGenerate}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                  >
                    Retry generation
                  </button>
                </div>
              )}

              {loadingHint && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700 font-semibold">{loadingHint}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100">
               <h4 className="text-xl font-bold mb-2">Wardrobe Gaps</h4>
               <p className="text-indigo-200 text-sm mb-6 leading-relaxed">Let Gemini analyze your collection to find the missing links that maximize your outfits.</p>
               <button 
                  onClick={async () => {
                    setGapLoading(true);
                    const res = await analyzeWardrobeGaps(items);
                    setGaps(res);
                    setGapLoading(false);
                  }}
                  disabled={gapLoading}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all"
               >
                 {gapLoading ? 'Analyzing...' : 'Identify Missing Pieces'}
               </button>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {gaps.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4">
                {gaps.map((gap, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 p-5 rounded-[2rem] flex flex-col">
                    <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full w-fit uppercase mb-2">{gap.priority}</span>
                    <p className="text-sm font-bold text-slate-900">{gap.suggestedColor} {gap.itemType}</p>
                    <p className="text-[11px] text-slate-500 mt-2 flex-1">{gap.reasoning}</p>
                    <button 
                      onClick={async () => {
                        setIsSearching(true);
                        const res = await searchForGapItems(gap);
                        setSearchResult(res);
                        setIsSearching(false);
                      }}
                      className="mt-4 text-[10px] font-black text-indigo-600 uppercase hover:underline"
                    >
                      {isSearching ? 'Searching...' : 'Find Matches'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid md:grid-cols-2 gap-8 opacity-50 animate-pulse">
                <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
                <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
              </div>
            ) : outfits.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {outfits.map(o => (
                  <OutfitCard 
                    key={o.id} 
                    outfit={o} 
                    isAlreadySaved={savedOutfits.some(so => so.id === o.id)}
                    getItemById={getItemById}
                    onToggleSave={toggleSaveOutfit}
                    onSetFeedback={setOutfitFeedback}
                  />
                ))}
              </div>
            ) : (
              <div className="h-96 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8">
                 <p className="text-slate-400 max-w-xs">Select your persona, occasion, and optional weather context to receive tailored styling advice.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {savedOutfits.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border border-slate-100 border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </div>
              <p className="text-slate-400 font-medium">Your lookbook is currently empty.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedOutfits.map(o => (
                <OutfitCard 
                  key={o.id} 
                  outfit={o} 
                  isSavedView 
                  isAlreadySaved={true}
                  getItemById={getItemById}
                  onToggleSave={toggleSaveOutfit}
                  onUpdateUsage={updateOutfitUsage}
                  onUpdateNotes={updateOutfitNotes}
                  onSetFeedback={setOutfitFeedback}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
