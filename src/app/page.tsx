'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiZap, FiChevronLeft, FiChevronRight, FiSettings, FiKey, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

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
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-lg">SlideMaker</span>
          </div>

          <div className="flex items-center gap-3">
            {apiKey ? (
              <span className="badge badge-success">
                <FiKey className="text-xs" />
                API Ready
              </span>
            ) : (
              <button onClick={() => setShowSettings(true)} className="badge badge-warning cursor-pointer hover:opacity-80">
                <FiKey className="text-xs" />
                Add API Key
              </button>
            )}
            <button onClick={() => setShowSettings(true)} className="btn-ghost">
              <FiSettings className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="card p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="btn-ghost">
                <FiX />
              </button>
            </div>

            <div>
              <label className="label">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              <p className="helper-text">
                Get your key at{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                  Google AI Studio
                </a>
              </p>
            </div>

            <button onClick={() => setShowSettings(false)} className="btn-primary w-full mt-5">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Turn textbooks into presentations
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Paste any textbook content and get clear, digestible slides instantly. Perfect for studying or teaching.
          </p>
        </div>

        {/* Input Section */}
        <section className="card p-5 md:p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Presentation Title</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Cell Biology Chapter 3"
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Textbook Content</label>
            <textarea
              className="input-textarea"
              placeholder="Paste your textbook content here...&#10;&#10;The AI will create as many slides as needed to cover everything thoroughly."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {error && <div className="error-message mb-4">{error}</div>}

          <button
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            onClick={generateSlides}
            disabled={isGenerating || !content.trim()}
          >
            {isGenerating ? (
              <>
                <div className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <FiZap size={16} />
                Generate Slides
              </>
            )}
          </button>
        </section>

        {/* Slides Preview */}
        {slides.length > 0 && (
          <section className="fade-in">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-semibold text-lg">
                {slides.length} Slides Generated
              </h2>

              <div className="flex items-center gap-3">
                <div className="tab-group">
                  <button
                    className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </button>
                  <button
                    className={`tab-btn ${viewMode === 'single' ? 'active' : ''}`}
                    onClick={() => setViewMode('single')}
                  >
                    Single
                  </button>
                </div>

                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={downloadPptx}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <div className="spinner" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FiDownload size={14} />
                      Download .pptx
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {slides.map((slide, index) => (
                  <div key={index} className="slide-card">
                    <div className="text-xs text-zinc-500 mb-2">Slide {index + 1}</div>
                    <h3>{slide.title}</h3>
                    <ul>
                      {slide.bullets.slice(0, 4).map((bullet, bIndex) => (
                        <li key={bIndex}>{bullet}</li>
                      ))}
                      {slide.bullets.length > 4 && (
                        <li className="text-zinc-500">+{slide.bullets.length - 4} more</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Single View */}
            {viewMode === 'single' && (
              <div>
                <div className="card p-6 min-h-[280px]">
                  <div className="text-sm text-zinc-500 mb-3">
                    Slide {currentPreviewIndex + 1} of {slides.length}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{slides[currentPreviewIndex].title}</h3>
                  <ul className="space-y-2 mb-4">
                    {slides[currentPreviewIndex].bullets.map((bullet, bIndex) => (
                      <li key={bIndex} className="text-zinc-300 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-violet-500 before:rounded-full">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  {slides[currentPreviewIndex].speakerNotes && (
                    <div className="border-t border-zinc-800 pt-4 mt-4">
                      <p className="text-sm text-zinc-500">
                        <span className="font-medium">Notes:</span> {slides[currentPreviewIndex].speakerNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    className="btn-secondary flex items-center gap-1"
                    onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentPreviewIndex === 0}
                  >
                    <FiChevronLeft size={16} />
                    Previous
                  </button>
                  <span className="text-sm text-zinc-500 px-4">
                    {currentPreviewIndex + 1} / {slides.length}
                  </span>
                  <button
                    className="btn-secondary flex items-center gap-1"
                    onClick={() => setCurrentPreviewIndex(prev => Math.min(slides.length - 1, prev + 1))}
                    disabled={currentPreviewIndex === slides.length - 1}
                  >
                    Next
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          Powered by Gemini AI
        </div>
      </footer>
    </main>
  );
}
