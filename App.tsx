
import React, { useState, useEffect } from 'react';
import { GeminiService } from './services/geminiService';
import { AppState, GenerationResult } from './types';
import { 
  Settings, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Youtube, 
  Share2, 
  Upload,
  Calendar,
  Sparkles,
  RefreshCw,
  Key,
  ExternalLink,
  Clipboard,
  ShieldAlert,
  Search
} from 'lucide-react';

const THEME_OPTIONS = [
  "Quick Tips", "Micro-Stories", "Product Hacks", "60-Second Explainers", 
  "Daily Motivation", "Micro-Reviews", "Trending Reactions"
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    theme: "",
    voiceProfile: "natural-tts",
    uploadTime: "09:00",
    status: "idle",
    progress: 0,
    result: null,
    error: null,
  });

  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true); 
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const runGeneration = async () => {
    const service = new GeminiService();
    const activeTheme = state.theme || THEME_OPTIONS[Math.floor(Math.random() * THEME_OPTIONS.length)];
    
    setState(prev => ({ ...prev, status: 'scripting', progress: 5, error: null }));

    try {
      // 1. Script, SEO & Confidence
      const scriptData = await service.generateScriptAndMetadata(activeTheme);
      setState(prev => ({ ...prev, progress: 25, status: 'media' }));

      // 2. Assets (Concurrent)
      const [thumbnails, videoUrl, voiceoverUrl] = await Promise.all([
        service.generateThumbnails(scriptData.title),
        service.generateVideo(scriptData.script),
        service.generateVoiceover(scriptData.script)
      ]);

      setState(prev => ({ ...prev, progress: 85, status: 'assembling' }));

      const result: GenerationResult = {
        videoUrl,
        audioUrl: voiceoverUrl,
        thumbnails,
        metadata: {
          title: scriptData.title,
          description: scriptData.description,
          tags: scriptData.tags,
          hashtags: scriptData.hashtags,
          pinnedComment: scriptData.pinnedComment,
          seoKeywords: scriptData.seoKeywords,
          endScreenConfig: scriptData.endScreenConfig
        },
        report: {
          videoId: `SH-AI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          uploadTime: state.uploadTime,
          confidence: scriptData.confidence,
          summary: `Generated high-quality human-first short for "${activeTheme}". Script analysis complete with ${scriptData.seoKeywords.length} keywords found via Search.`,
          groundingSources: scriptData.groundingSources
        }
      };

      // Confidence Check
      if (scriptData.confidence < 0.8) {
        setState(prev => ({ ...prev, result, status: 'review', progress: 100 }));
      } else {
        setState(prev => ({ ...prev, result, status: 'completed', progress: 100 }));
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_EXPIRED_OR_INVALID") {
        setHasApiKey(false);
        setState(prev => ({ ...prev, status: 'error', error: "Requested entity was not found. Please re-select your API key." }));
      } else {
        setState(prev => ({ 
          ...prev, 
          status: 'error', 
          error: err.message || "Failed to generate video. Please verify your billing and API limits." 
        }));
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans">
      {/* Dynamic Header */}
      <nav className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/20">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ShortsStudio</h1>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Enterprise AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <a href="#" className="hover:text-white transition-colors">History</a>
              <a href="#" className="hover:text-white transition-colors">Analytics</a>
              <a href="#" className="hover:text-white transition-colors">SEO Console</a>
            </div>
            {!hasApiKey && (
              <button 
                onClick={handleSelectApiKey}
                className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                <Key className="w-4 h-4" />
                Select Paid Key
              </button>
            )}
            <div className="p-2 rounded-full hover:bg-white/5 cursor-pointer">
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl w-full mx-auto px-6 py-12 flex-1">
        {state.status === 'idle' && (
          <div className="space-y-12">
            <section className="text-center space-y-4">
              <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                Today's Daily Short
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                One viral, human-first video created and ready for upload every 24 hours.
              </p>
            </section>

            <section className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Search className="w-3 h-3" /> Topic Focus
                    </label>
                    <select 
                      value={state.theme}
                      onChange={(e) => setState(prev => ({ ...prev, theme: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                    >
                      <option value="">Auto-Select Trending (Recommended)</option>
                      {THEME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Scheduled Time
                    </label>
                    <input 
                      type="time"
                      value={state.uploadTime}
                      onChange={(e) => setState(prev => ({ ...prev, uploadTime: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Voice Generation Profile</label>
                  <div className="flex gap-4">
                    {['natural-tts', 'user-voice'].map((v) => (
                      <button 
                        key={v}
                        onClick={() => setState(prev => ({ ...prev, voiceProfile: v as any }))}
                        className={`flex-1 py-4 px-6 rounded-2xl text-sm font-bold border transition-all ${state.voiceProfile === v ? 'bg-white text-black border-white shadow-xl' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'}`}
                      >
                        {v === 'natural-tts' ? 'Natural Human TTS' : 'Clone User Voice'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 rounded-[40px] flex flex-col justify-between text-white shadow-2xl shadow-red-600/10">
                <div className="space-y-4">
                  <Sparkles className="w-10 h-10" />
                  <h3 className="text-2xl font-bold">Start Automating</h3>
                  <p className="text-red-100 text-sm leading-relaxed">
                    Our AI will analyze trends using Google Search, write a conversational script, generate a vertical Veo video, and prepare SEO metadata.
                  </p>
                </div>
                <button 
                  onClick={runGeneration}
                  disabled={!hasApiKey}
                  className="w-full bg-white text-red-600 font-extrabold py-4 rounded-2xl hover:bg-slate-100 disabled:bg-white/20 disabled:text-white/50 transition-all flex items-center justify-center gap-2 mt-8"
                >
                  <Video className="w-5 h-5" />
                  Generate Production
                </button>
                {!hasApiKey && (
                  <p className="text-[10px] text-red-200 mt-2 text-center uppercase tracking-tighter">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">Billing Required</a> for Veo Models
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error' && state.status !== 'review' && (
          <section className="min-h-[500px] flex flex-col items-center justify-center gap-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-red-500/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-red-500/20 animate-ping" />
              </div>
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-3xl font-bold tracking-tight">
                {state.status === 'scripting' ? 'Analyzing Trends...' : 
                 state.status === 'media' ? 'Synthesizing Media...' : 
                 'Polishing Final Short...'}
              </h2>
              <p className="text-slate-400">This usually takes 1-3 minutes. We are ensuring human-like pacing and high visual fidelity.</p>
              
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{state.progress}% - System Optimized</p>
            </div>
          </section>
        )}

        {state.status === 'error' && (
          <div className="max-w-xl mx-auto bg-red-500/5 border border-red-500/20 p-10 rounded-[40px] text-center space-y-6">
            <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-red-500">Hiccup in the Cloud</h3>
              <p className="text-slate-400">{state.error}</p>
            </div>
            <button 
              onClick={() => setState(prev => ({ ...prev, status: 'idle' }))}
              className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Back to Studio
            </button>
          </div>
        )}

        {(state.status === 'completed' || state.status === 'review') && state.result && (
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Review Banner if confidence low */}
            {state.status === 'review' && (
              <div className="lg:col-span-12 bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                  <div>
                    <h3 className="text-amber-500 font-bold">Manual Review Flagged</h3>
                    <p className="text-slate-400 text-sm">Confidence score is {Math.round(state.result.report.confidence * 100)}%. Please review script and visual coherence before publishing.</p>
                  </div>
                </div>
                <button className="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold">Mark as Approved</button>
              </div>
            )}

            {/* Main Video View */}
            <div className="lg:col-span-4 space-y-6">
              <div className="aspect-[9/16] bg-black rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative shadow-black/50">
                <video 
                  src={state.result.videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {state.result.thumbnails.map((t, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 group relative">
                      <img src={t} alt="Thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(t)} className="p-2 bg-white text-black rounded-lg">
                          <Clipboard className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase text-center">Variant {String.fromCharCode(65+i)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata and Analytics Panel */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                     <h3 className="text-xl font-bold">Production Summary</h3>
                   </div>
                   <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl">
                     <span className="text-xs font-mono text-slate-400">ID: {state.result.report.videoId}</span>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Optimized Title</label>
                      <button onClick={() => copyToClipboard(state.result?.metadata.title || "")} className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1">
                        Copy <Clipboard className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl font-bold text-lg border border-white/5">
                      {state.result.metadata.title}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description & Tags</label>
                    <div className="bg-white/5 p-6 rounded-2xl text-sm text-slate-300 whitespace-pre-wrap leading-relaxed border border-white/5 max-h-[200px] overflow-y-auto">
                      {state.result.metadata.description}
                      {"\n\n"}
                      {state.result.metadata.hashtags.join(" ")}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pinned Comment Hook</label>
                      <div className="bg-white/5 p-4 rounded-2xl text-sm border border-white/5 italic">
                        "{state.result.metadata.pinnedComment}"
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Screen Config</label>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Overlay Subscribe</span>
                          <span className="text-emerald-500 font-bold">{state.result.metadata.endScreenConfig.subscribe ? 'YES' : 'NO'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Related Clips</span>
                          <span className="text-emerald-500 font-bold">{state.result.metadata.endScreenConfig.recommendedVideos} Videos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {state.result.report.groundingSources && (
                  <div className="pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">SEO Grounding Sources</h4>
                    <div className="flex flex-wrap gap-3">
                      {state.result.report.groundingSources.map((source: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={source.web?.uri || source.maps?.uri || "#"} 
                          target="_blank"
                          className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors border border-white/5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {source.web?.title || source.maps?.title || "Reference"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-[25px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/20">
                  <Upload className="w-6 h-6" />
                  Schedule Upload
                </button>
                <button 
                  onClick={() => setState(prev => ({ ...prev, status: 'idle', result: null }))}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 px-8 rounded-[25px] transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-slate-900/20 p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          <span>&copy; 2024 ShortsStudio AI Enterprise</span>
          <div className="flex gap-8">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-slate-400 underline underline-offset-4">Cloud Billing Docs</a>
            <a href="#" className="hover:text-slate-400">Terms of Production</a>
            <a href="#" className="hover:text-slate-400">Privacy Safe-Mode</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
