import React, { useState } from 'react';
import { Download, Loader2, AlertCircle, Trash2, Layers, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GenerationTask } from '../types';
import { cn } from '../lib/utils';

interface ImageGridProps {
  tasks: GenerationTask[];
  onDelete: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ tasks, onDelete }) => {
  const [selectedTask, setSelectedTask] = useState<GenerationTask | null>(null);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
          <Layers size={32} />
        </div>
        <p className="text-sm font-medium">Your batch generations will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="group relative aspect-[3/4] glass rounded-2xl overflow-hidden flex flex-col"
              style={{ aspectRatio: task.config.aspectRatio.replace(':', '/') }}
            >
              {task.status === 'processing' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <span className="text-xs font-medium opacity-60">Generating...</span>
                  <div className="w-24 h-1 bg-foreground/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent animate-shimmer w-full" />
                  </div>
                </div>
              )}

              {task.status === 'failed' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-sm p-6 text-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <span className="text-xs font-medium text-red-500/80">Generation Failed</span>
                  <p className="text-[10px] text-red-500/60 line-clamp-2">{task.error}</p>
                </div>
              )}

              {task.imageUrl ? (
                <img
                  src={task.imageUrl}
                  alt={task.prompt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                  <ImageIcon className="opacity-5" size={48} />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs text-white/90 line-clamp-2 mb-3 font-medium">{task.prompt}</p>
                <div className="flex items-center gap-2">
                  {task.imageUrl && (
                    <>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-all"
                        title="View Fullscreen"
                      >
                        <Maximize2 size={12} />
                      </button>
                      <button
                        onClick={() => downloadImage(task.imageUrl!, `loom-${task.id}.png`)}
                        className="flex-1 py-2 bg-white text-black rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors"
                      >
                        <Download size={12} /> Download
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-2 bg-white/10 text-white hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-background/95 backdrop-blur-xl"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTask(null)}
                className="absolute -top-12 right-0 p-2 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>

              <div className="relative group shadow-2xl rounded-3xl overflow-hidden border border-border bg-foreground/5">
                <img
                  src={selectedTask.imageUrl}
                  alt={selectedTask.prompt}
                  className="max-w-full max-h-[80vh] object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-lg font-medium max-w-2xl">{selectedTask.prompt}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => downloadImage(selectedTask.imageUrl!, `loom-${selectedTask.id}.png`)}
                  className="px-8 py-3 bg-foreground text-background rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95"
                >
                  <Download size={20} /> Download High-Res
                </button>
                <button
                  onClick={() => {
                    onDelete(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
