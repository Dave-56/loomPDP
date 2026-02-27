import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Wand2, Layers, Maximize2, Type, Building2 } from 'lucide-react';
import { useDropzone, Accept } from 'react-dropzone';
import { AspectRatio } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  onGenerate: (prompts: string[], config: { aspectRatio: AspectRatio; referenceImage?: string }) => void;
  isGenerating: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onGenerate, isGenerating }) => {
  const [batchInput, setBatchInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const accept: Accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  } as any);

  const handleGenerate = () => {
    let prompts = batchInput
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // If no prompts but we have a reference, use a default high-end prompt
    if (prompts.length === 0 && referenceImage) {
      prompts = ["Professional model wearing this clothing item, high-end fashion photography, studio setting"];
    }
    
    if (prompts.length === 0) return;
    
    onGenerate(prompts, { 
      aspectRatio, 
      referenceImage: referenceImage || undefined 
    });
    setBatchInput('');
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeSKU = async () => {
    if (!referenceImage) return;
    setIsAnalyzing(true);
    try {
      const { analyzeSKU } = await import('../services/gemini');
      let description = await analyzeSKU(referenceImage);
      // Clean up the description (remove quotes, extra whitespace)
      description = description.replace(/["']/g, '').trim();
      setBatchInput(prev => prev ? `${prev}\n${description}` : description);
    } catch (error) {
      console.error("Failed to analyze SKU:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-80 h-screen glass border-r flex flex-col p-6 gap-8 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Building2 className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Loom PDP</h1>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider opacity-50 flex items-center gap-2">
            <Type size={14} /> SKU Batch List
          </label>
          {referenceImage && (
            <button 
              onClick={handleAnalyzeSKU}
              disabled={isAnalyzing}
              className="text-[10px] font-bold text-accent flex items-center gap-1 hover:underline disabled:opacity-50"
            >
              <Wand2 size={10} className={isAnalyzing ? "animate-spin" : ""} />
              {isAnalyzing ? "Analyzing..." : "Auto-Describe SKU"}
            </button>
          )}
        </div>
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="Enter SKU descriptions or upload a photo to auto-generate..."
          className="w-full h-48 bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent/50 transition-colors resize-none"
        />
        <p className="text-[10px] opacity-30">
          Tip: Upload a reference to unlock "Auto-Describe".
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider opacity-50 flex items-center gap-2">
          <ImageIcon size={14} /> SKU Reference
        </label>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[120px]",
            isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20",
            referenceImage && "border-none p-0 overflow-hidden"
          )}
        >
          <input {...getInputProps()} />
          {referenceImage ? (
            <div className="relative group w-full h-full">
              <img src={referenceImage} alt="Reference" className="w-full h-32 object-cover rounded-xl" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReferenceImage(null);
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={20} className="opacity-30" />
              <span className="text-xs opacity-40">Drop clothing photo</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider opacity-50 flex items-center gap-2">
          <Maximize2 size={14} /> Output Format
        </label>
        <div className="grid grid-cols-1 gap-2">
          {([
            { ratio: '1:1', label: 'Shopify / Square' },
            { ratio: '3:4', label: 'E-com Portrait' },
            { ratio: '9:16', label: 'Instagram / TikTok' },
            { ratio: '16:9', label: 'Hero Banner' },
          ] as { ratio: AspectRatio; label: string }[]).map(({ ratio, label }) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={cn(
                "px-4 py-3 text-[10px] rounded-xl border transition-all flex items-center justify-between",
                aspectRatio === ratio
                  ? "bg-accent border-accent text-white"
                  : "border-border hover:border-foreground/20 opacity-60"
              )}
            >
              <span className="font-bold">{label}</span>
              <span className="opacity-60">{ratio}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!batchInput.trim() && !referenceImage)}
          className={cn(
            "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
            isGenerating || (!batchInput.trim() && !referenceImage)
              ? "bg-foreground/5 opacity-20 cursor-not-allowed"
              : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
          )}
        >
          <Wand2 size={18} />
          {isGenerating ? 'Processing...' : 'Generate Batch'}
        </button>
      </div>
    </div>
  );
};
