
import React, { useState } from 'react';
import { PERSONAS } from './constants';
import { Persona } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Unlock, ArrowRight } from 'lucide-react';
import { playSoftClick } from './services/audioService';

const App: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const handlePersonaSelect = (persona: Persona) => {
    playSoftClick();
    setSelectedPersona(persona);
  };

  const handleBack = () => {
    setSelectedPersona(null);
  };

  return (
    <div className="min-h-screen bg-dark text-white selection:bg-primary/30 font-sans">
      {!selectedPersona ? (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          
          {/* Intro Section */}
          <div className="text-center mb-16 space-y-6 animate-[fadeIn_1s_ease-out]">
            <div className="inline-flex items-center justify-center p-5 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 mb-2 border border-white/10 shadow-2xl backdrop-blur-xl">
                <Unlock className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            </div>
            <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent pb-4 drop-shadow-sm">
              心靈解鎖
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              這是一個安全的避風港。<br/>
              選擇一個最貼近你現在心情的角色，讓我們溫柔地解開心結。
            </p>
          </div>

          {/* Grid - Adjusted to 3 columns for 9 items (3x3 layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {PERSONAS.map((persona) => (
              <div
                key={persona.id}
                onClick={() => handlePersonaSelect(persona)}
                className={`
                  group relative overflow-hidden rounded-[2rem] p-8 cursor-pointer
                  bg-slate-800/40 border border-white/5 hover:border-white/20
                  transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]
                  backdrop-blur-sm flex flex-col min-h-[320px]
                `}
              >
                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500 origin-left drop-shadow-lg">
                    {persona.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-gray-100 group-hover:text-white transition-colors tracking-wide">
                    {persona.title}
                  </h3>
                  
                  <p className="text-gray-400 group-hover:text-gray-300 text-base md:text-lg mb-6 flex-grow leading-relaxed font-normal opacity-90">
                    {persona.description}
                  </p>
                  
                  <div className="mt-auto flex items-center text-sm font-bold text-gray-500 uppercase tracking-widest border-t border-white/5 pt-5 group-hover:border-white/20 transition-colors">
                    <span className="group-hover:translate-x-1 transition-transform">開始對話</span>
                    <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ChatInterface persona={selectedPersona} onBack={handleBack} />
      )}
    </div>
  );
};

export default App;
