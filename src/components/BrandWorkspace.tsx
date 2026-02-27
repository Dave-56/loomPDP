import React, { useState } from 'react';
import { Globe, Cpu, CheckCircle2, AlertCircle, Sparkles, Building2, Layout } from 'lucide-react';
import { BrandSettings } from '../types';
import { cn } from '../lib/utils';

interface BrandWorkspaceProps {
  brand: BrandSettings;
  onUpdate: (brand: BrandSettings) => void;
}

export const BrandWorkspace: React.FC<BrandWorkspaceProps> = ({ brand, onUpdate }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTrain = () => {
    setIsTraining(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsTraining(false);
        onUpdate({ ...brand, isLoraTrained: true });
      }
    }, 100);
  };

  return (
    <div className="flex-1 p-12 overflow-y-auto max-w-5xl mx-auto w-full space-y-12">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="text-accent" /> Brand Identity
        </h2>
        <p className="text-foreground/60">Configure your brand's visual DNA for consistent PDP assets.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe size={20} className="text-accent" /> Brand Source
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">Store URL</label>
              <input
                type="text"
                value={brand.url}
                onChange={(e) => onUpdate({ ...brand, url: e.target.value })}
                placeholder="https://yourbrand.com"
                className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">Brand Name</label>
              <input
                type="text"
                value={brand.name}
                onChange={(e) => onUpdate({ ...brand, name: e.target.value })}
                placeholder="Acme Fashion"
                className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layout size={20} className="text-accent" /> PDP Style
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">Visual Style Prompt</label>
              <textarea
                value={brand.pdpStyle}
                onChange={(e) => onUpdate({ ...brand, pdpStyle: e.target.value })}
                placeholder="e.g. Minimalist white studio, soft natural lighting, high-end editorial feel..."
                className="w-full h-32 bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Cpu size={20} className="text-accent" /> Brand Model (LoRA)
            </h3>
            <p className="text-sm opacity-60">Train a custom model on your brand's specific aesthetic and models.</p>
          </div>
          {brand.isLoraTrained ? (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-full">
              <CheckCircle2 size={16} /> Trained & Active
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-500 font-bold text-sm bg-amber-500/10 px-4 py-2 rounded-full">
              <AlertCircle size={16} /> Not Trained
            </div>
          )}
        </div>

        <div className="bg-foreground/5 rounded-2xl p-8 border border-border flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <Sparkles className="text-accent" size={32} />
          </div>
          <div className="space-y-2 max-w-md">
            <h4 className="font-bold">Automated Aesthetic Training</h4>
            <p className="text-sm opacity-60">
              Our system will crawl your store URL and analyze your existing PDP assets to create a custom visual profile.
            </p>
          </div>

          {isTraining ? (
            <div className="w-full max-w-sm space-y-4">
              <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-40 animate-pulse">
                Analyzing Brand DNA... {progress}%
              </p>
            </div>
          ) : (
            <button
              onClick={handleTrain}
              className="px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-all active:scale-95"
            >
              {brand.isLoraTrained ? 'Retrain Model' : 'Start Brand Training'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
