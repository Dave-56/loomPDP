import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageGrid } from './components/ImageGrid';
import { BrandWorkspace } from './components/BrandWorkspace';
import { GenerationTask, AspectRatio, BrandSettings } from './types';
import { generateFashionImage } from './services/gemini';
import { Sun, Moon, Sparkles, LayoutGrid, Key } from 'lucide-react';
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';

const DEFAULT_BRAND: BrandSettings = {
  url: '',
  name: '',
  description: '',
  isLoraTrained: false,
  pdpStyle: 'Clean minimalist studio background, professional high-key lighting, sharp focus on fabric texture.'
};

export default function App() {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'brand'>('studio');
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('loom_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // Fallback for environments without aistudio global
          setHasApiKey(true);
        }
      } catch (error) {
        console.error("Error checking API key:", error);
        setHasApiKey(true); // Fallback to allow app to load
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true); // Assume success as per guidelines
      }
    } catch (error) {
      console.error("Error opening key selector:", error);
    }
  };

  // Global error logger
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('loom_theme', theme);
  }, [theme]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('loom_tasks');
    const savedBrand = localStorage.getItem('loom_brand');
    if (savedTasks) {
      try { setTasks(JSON.parse(savedTasks)); } catch (e) {}
    }
    if (savedBrand) {
      try { setBrand(JSON.parse(savedBrand)); } catch (e) {}
    }
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      // Limit the number of tasks saved to localStorage to prevent QuotaExceededError
      // Base64 images are large, so we only keep the most recent 10 tasks in persistent storage
      const tasksToSave = tasks.slice(0, 10);
      localStorage.setItem('loom_tasks', JSON.stringify(tasksToSave));
      localStorage.setItem('loom_brand', JSON.stringify(brand));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, only saving most recent tasks.');
        // If it still fails, try saving even fewer tasks
        try {
          localStorage.setItem('loom_tasks', JSON.stringify(tasks.slice(0, 5)));
        } catch (innerE) {
          console.error('Failed to save tasks even with reduced count:', innerE);
        }
      }
    }
  }, [tasks, brand]);

  const handleGenerateBatch = async (prompts: string[], config: { aspectRatio: AspectRatio; referenceImage?: string }) => {
    setIsGenerating(true);
    setActiveTab('studio');

    const newTasks: GenerationTask[] = prompts.map(prompt => ({
      id: Math.random().toString(36).substring(7),
      prompt,
      status: 'pending',
      timestamp: Date.now(),
      config
    }));

    setTasks(prev => [...newTasks, ...prev]);

    for (const task of newTasks) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing' } : t));
      
      try {
        const imageUrl = await generateFashionImage(task.prompt, {
          ...config,
          brandStyle: brand.pdpStyle
        });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', imageUrl } : t));
      } catch (error: any) {
        console.error(`Generation failed for task ${task.id}:`, error);
        setTasks(prev => prev.map(t => t.id === task.id ? { 
          ...t, 
          status: 'failed', 
          error: error.message || 'Unknown error occurred' 
        } : t));
      }
    }

    setIsGenerating(false);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: theme === 'dark' ? ['#3b82f6', '#ffffff', '#000000'] : ['#3b82f6', '#000000', '#ffffff']
      });
    } catch (e) {
      console.error("Confetti failed:", e);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (hasApiKey === false) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-8 text-center space-y-8 krea-gradient">
        <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center">
          <Sparkles className="text-accent" size={40} />
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">Loom PDP</h1>
          <p className="text-foreground/60 leading-relaxed">
            To use the high-fidelity <span className="text-foreground font-semibold">Gemini 3.1 Flash</span> model for your brand assets, you need to select an API key from a paid Google Cloud project.
          </p>
          <div className="pt-4">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline text-sm font-medium"
            >
              Learn more about billing
            </a>
          </div>
        </div>
        <button
          onClick={handleOpenKeySelector}
          className="px-12 py-4 bg-foreground text-background rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-accent/10"
        >
          Select API Key to Start
        </button>
      </div>
    );
  }

  if (hasApiKey === null) return null;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden krea-gradient transition-colors duration-300">
      <Sidebar onGenerate={handleGenerateBatch} isGenerating={isGenerating} />
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 glass z-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('studio')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'studio' ? "bg-background shadow-sm" : "opacity-50 hover:opacity-100"
                )}
              >
                <LayoutGrid size={14} /> Studio
              </button>
              <button
                onClick={() => setActiveTab('brand')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'brand' ? "bg-background shadow-sm" : "opacity-50 hover:opacity-100"
                )}
              >
                <Sparkles size={14} /> Brand Workspace
              </button>
            </div>
            <div className="h-4 w-[1px] bg-border" />
            <span className="text-xs font-medium opacity-60">
              {brand.name || 'Untitled Brand'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={handleOpenKeySelector}
              className="p-2 rounded-full hover:bg-foreground/5 transition-colors"
              title="Change API Key"
            >
              <Key size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-foreground/5 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {tasks.length > 0 && activeTab === 'studio' && (
              <button 
                onClick={() => setTasks([])}
                className="text-[10px] font-bold uppercase tracking-wider opacity-40 hover:opacity-100 transition-opacity"
              >
                Clear All
              </button>
            )}
          </div>
        </header>
        
        {activeTab === 'studio' ? (
          <ImageGrid tasks={tasks} onDelete={handleDeleteTask} />
        ) : (
          <BrandWorkspace brand={brand} onUpdate={setBrand} />
        )}
      </main>
    </div>
  );
}
