export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface GenerationTask {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
  timestamp: number;
  config: {
    aspectRatio: AspectRatio;
    referenceImage?: string;
  };
}

export interface BrandSettings {
  url: string;
  name: string;
  description: string;
  isLoraTrained: boolean;
  pdpStyle: string;
}

export interface AppState {
  tasks: GenerationTask[];
  isSidebarOpen: boolean;
  brand: BrandSettings;
  activeTab: 'studio' | 'brand';
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
