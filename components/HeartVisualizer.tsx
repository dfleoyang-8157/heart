import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { EmotionType } from '../types';
import { EMOTION_COLORS } from '../constants';

interface HeartVisualizerProps {
  progress: number;
  status: string;
  color: string; // Default persona color
  currentEmotion?: EmotionType;
}

export const HeartVisualizer: React.FC<HeartVisualizerProps> = ({ progress, status, color, currentEmotion = 'neutral' }) => {
  const [visualColor, setVisualColor] = useState('#a855f7');

  useEffect(() => {
    // Transition smoothly to the new emotion color
    const targetColor = EMOTION_COLORS[currentEmotion] || '#a855f7';
    setVisualColor(targetColor);
  }, [currentEmotion]);

  const scale = 1 + (progress / 200);
  // If emotion is neutral, we might want to fallback to persona theme, but for "Spectrum" feel, neutral purple/slate is good.
  // Using visualColor which is derived from EMOTION_COLORS
  
  const glow = progress > 20 ? `drop-shadow(0 0 ${progress / 4}px ${visualColor})` : 'none';

  return (
    <div className="flex flex-row items-center justify-center px-6 py-4 gap-6 w-full bg-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-md shadow-lg overflow-hidden relative">
      
      {/* Ambient Aura Layer */}
      <div 
        className="absolute inset-0 opacity-30 transition-colors duration-[2000ms] ease-in-out"
        style={{
            background: `radial-gradient(circle at 50% 50%, ${visualColor} 0%, transparent 70%)`
        }}
      />

      {/* Heart Icon Area */}
      <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center z-10">
        {/* Inner Pulse Glow */}
        <div 
            className="absolute rounded-full opacity-40 animate-pulse-slow blur-xl transition-colors duration-[2000ms]"
            style={{
                backgroundColor: visualColor,
                width: `${Math.max(progress * 1.5, 60)}%`,
                height: `${Math.max(progress * 1.5, 60)}%`,
            }}
        />

        <div style={{ transform: `scale(${scale})`, filter: glow }} className="transition-all duration-700 ease-out">
             <Heart 
                className={`w-10 h-10 ${progress > 80 ? 'animate-bounce' : ''} transition-colors duration-[2000ms]`}
                fill={progress > 10 ? visualColor : 'transparent'} 
                stroke={visualColor}
                strokeWidth={2}
             />
        </div>
      </div>
      
      {/* Text & Bar Area */}
      <div className="flex flex-col justify-center flex-grow max-w-sm z-10">
        <div className="flex justify-between items-end mb-2">
             <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">當前心靈狀態</p>
             <p className="text-xl text-white font-mono font-bold drop-shadow-md">{progress}%</p>
        </div>
        
        <h3 className="text-2xl font-bold text-white leading-none mb-4 tracking-wide drop-shadow-lg transition-all duration-500">
          {status}
        </h3>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-white/5">
            <div 
                className="h-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-[2000ms] ease-out"
                style={{ 
                    width: `${progress}%`,
                    backgroundColor: visualColor
                }}
            />
        </div>
      </div>
    </div>
  );
};