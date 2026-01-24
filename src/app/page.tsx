'use client';

import { useState, useEffect } from 'react';
import {
  FiDownload,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiKey,
  FiX,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiFileText,
  FiCpu
} from 'react-icons/fi';

interface Slide {
  title: string;
  bullets: string[];
  speakerNotes?: string;
}

export default function Home() {
  const [content, setContent] = useState('');
  const [presentationTitle, setPresentationTitle] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const generateSlides = async () => {
    if (!content.trim()) {
      setError('Please paste some textbook content first.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please add your Gemini API key in settings.');
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    setError('');
    setSlides([]);

    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, apiKey }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate slides');

      setSlides(data.slides);
      setCurrentPreviewIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPptx = async () => {
    if (slides.length === 0) return;

    setIsDownloading(true);
    setError('');

    try {
      const response = await fetch('/api/download-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          presentationTitle: presentationTitle || 'Generated Presentation',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate PowerPoint');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(presentationTitle || 'presentation').replace(/[^a-z0-9]/gi, '_')}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen relative pb-20">
      {/* Background Decorative Blobs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -z-10 animate-float" />
      <div className="fixed bottom-20 right-20 w-[30rem] h-[30rem] bg-pink-600/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '-3s' }} />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">SlideMaker</span>
          </div>

          <div className="flex items-center gap-4">
            {apiKey ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                <FiCheck size={12} />
                <span>API Connected</span>
              </div>
            ) : (
              <button
                onClick={() => setShowSettings(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                title="API Key Needed"
              >
                <FiKey size={12} />
                <span>Add API Key</span>
              </button>
            )}

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <FiSettings className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiSettings /> Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Gemini API Key</label>
                <div className="relative group">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-zinc-600"
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Don't have a key? Get one for free at{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 hover:underline">
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="pt-4">
                <button onClick={() => setShowSettings(false)} className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-20">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            AI Presentation Generator
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 pb-2">
            Transform Textbooks <br className="hidden md:block" />
            into <span className="text-white">Perfect Slides</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Paste any chapter, article, or notes. Our AI distills the complexity into
            clean, professional presentation slides in seconds.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="glass-panel p-1 rounded-3xl mb-12 max-w-4xl mx-auto">
          <div className="bg-black/40 rounded-[1.3rem] p-6 md:p-8">
            <div className="grid md:grid-cols-[1fr,auto] gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Presentation Title</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-600"
                  placeholder="e.g. Introduction to Neuroscience"
                  value={presentationTitle}
                  onChange={(e) => setPresentationTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-sm font-medium text-zinc-400 ml-1 flex items-center justify-between">
                <span>Content Source</span>
                <span className="text-xs text-zinc-500">{content.length} characters</span>
              </label>
              <div className="relative">
                <textarea
                  className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-5 text-zinc-200 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-600 resize-none leading-relaxed"
                  placeholder="Paste your content here...&#10;&#10;The AI will analyze the text, extract key concepts, and organize them into structured slides with bullet points and speaker notes."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="absolute bottom-4 right-4 pointer-events-none text-zinc-700">
                  <FiFileText size={24} />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-red-500/20"><FiX size={12} /></div>
                {error}
              </div>
            )}

            <button
              className="group relative w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              onClick={generateSlides}
              disabled={isGenerating || !content.trim()}
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>Analyzing & Designing...</span>
                  </>
                ) : (
                  <>
                    <FiZap className="group-hover:scale-110 transition-transform" />
                    <span>Generate Presentation</span>
                  </>
                )}
              </div>

              {/* Button Shimmer */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0" />
            </button>
          </div>
        </div>

        {/* Results Section */}
        {slides.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-mono border border-white/10">
                    {slides.length}
                  </span>
                  Generated Slides
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid View
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'single' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('single')}
                  >
                    Focus Mode
                  </button>
                </div>

                <button
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-lg shadow-violet-600/20"
                  onClick={downloadPptx}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiDownload />
                  )}
                  <span>Export PPTX</span>
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {slides.map((slide, index) => (
                  <div key={index} className="group relative bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-violet-500/50 transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.1)] hover:-translate-y-1">
                    {/* Header Bar */}
                    <div className="h-2 bg-gradient-to-r from-violet-600 to-indigo-600" />

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Slide {index + 1}</span>
                      </div>

                      <h3 className="font-bold text-lg text-white mb-4 line-clamp-2 min-h-[3.5rem]">{slide.title}</h3>

                      <ul className="space-y-2 mb-6 min-h-[6rem]">
                        {slide.bullets.slice(0, 3).map((bullet, bIndex) => (
                          <li key={bIndex} className="text-sm text-zinc-400 pl-4 relative">
                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-violet-500/50 transition-colors" />
                            <span className="line-clamp-2">{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      {slide.speakerNotes && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 border-t border-white/5 pt-4">
                          <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center"><FiCpu size={10} /></div>
                          <span className="truncate max-w-[200px]">{slide.speakerNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single View */}
            {viewMode === 'single' && (
              <div className="max-w-4xl mx-auto">
                <div className="glass-panel rounded-2xl p-1 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />

                  <div className="bg-black/80 rounded-xl p-8 md:p-12 min-h-[400px] flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-mono text-violet-400/80 mb-6 border border-violet-500/20 px-3 py-1 rounded-full">{currentPreviewIndex + 1} / {slides.length}</span>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 max-w-2xl">{slides[currentPreviewIndex].title}</h2>

                    <div className="w-full max-w-2xl text-left space-y-4 mb-12">
                      {slides[currentPreviewIndex].bullets.map((bullet, bIndex) => (
                        <div key={bIndex} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] shrink-0" />
                          <p className="text-lg text-zinc-300 group-hover:text-white transition-colors">{bullet}</p>
                        </div>
                      ))}
                    </div>

                    {slides[currentPreviewIndex].speakerNotes && (
                      <div className="w-full max-w-2xl bg-white/5 rounded-xl p-6 border border-white/5 text-left">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <FiCpu /> Speaker Notes
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{slides[currentPreviewIndex].speakerNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    className="p-4 rounded-full glass-button hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                    onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentPreviewIndex === 0}
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    className="p-4 rounded-full glass-button hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                    onClick={() => setCurrentPreviewIndex(prev => Math.min(slides.length - 1, prev + 1))}
                    disabled={currentPreviewIndex === slides.length - 1}
                  >
                    <FiChevronRight size={24} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
