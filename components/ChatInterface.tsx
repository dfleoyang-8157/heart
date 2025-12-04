import React, { useState, useEffect, useRef } from 'react';
import { Persona, ChatMessage, AnalysisResult, HealingStory, EmotionType, JourneyPoint } from '../types';
import { sendUserMessage, generateHealingStory } from '../services/geminiService';
import { HeartVisualizer } from './HeartVisualizer';
import { EMOTION_CARDS, EMOTION_COLORS } from '../constants';
import { ArrowLeft, Send, BookOpen, X, LoaderCircle, Map, Fingerprint, Smile, Lightbulb, Footprints, Sparkles } from 'lucide-react';
import { playMessageSent, playMessageReceived, playSoftClick, playStoryUnlock, playNotification } from '../services/audioService';

interface ChatInterfaceProps {
  persona: Persona;
  onBack: () => void;
}

const QUICK_EMOTIONS = [
  { icon: "😢", label: "想哭" },
  { icon: "😔", label: "低落" },
  { icon: "😩", label: "好累" },
  { icon: "💔", label: "受傷" },
  { icon: "😠", label: "生氣" },
  { icon: "🤯", label: "煩躁" },
  { icon: "😨", label: "害怕" },
  { icon: "😵", label: "混亂" },
  { icon: "😶", label: "無感" },
  { icon: "🤔", label: "困惑" },
  { icon: "🙄", label: "無奈" },
  { icon: "😮", label: "震驚" },
  { icon: "😌", label: "平靜" },
  { icon: "😊", label: "開心" },
  { icon: "🥰", label: "溫暖" },
  { icon: "✨", label: "希望" },
];

// Helper to split text by explicit newlines only
// We removed the aggressive punctuation splitting to avoid the "vertical list" look
const formatTextToParagraphs = (text: string): string[] => {
  return text.split('\n').filter(line => line.trim() !== '');
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ persona, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("正在用心感受...");
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(10);
  const [currentStatus, setCurrentStatus] = useState("防備中");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  // Story Modal State
  const [storyForModal, setStoryForModal] = useState<HealingStory | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [triggerStoryGeneration, setTriggerStoryGeneration] = useState(false);

  // Journey Map State
  const [journeyPoints, setJourneyPoints] = useState<JourneyPoint[]>([]);
  const [showJourneyMap, setShowJourneyMap] = useState(false);
  const [hasUnreadJourney, setHasUnreadJourney] = useState(false);

  // Emotion Naming State
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to detect mobile device
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingStatus]);

  // Auto-focus input when loading finishes (ONLY on Desktop)
  useEffect(() => {
    if (!isLoading) {
      // We only auto-focus on non-mobile devices to prevent keyboard from
      // covering the screen and disrupting the reading flow on phones.
      if (!isMobile()) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading]);

  // Handle Input Focus (Scroll to bottom when keyboard opens on mobile)
  const handleInputFocus = () => {
    if (isMobile()) {
        // Wait for keyboard animation to likely finish
        setTimeout(() => {
            scrollToBottom(true);
        }, 400);
    }
  };

  // Effect to handle automatic story generation based on AI suggestion
  useEffect(() => {
    if (triggerStoryGeneration && !isStoryLoading && messages.length >= 2) {
      handleRequestStory();
      setTriggerStoryGeneration(false);
    }
  }, [messages, triggerStoryGeneration, isStoryLoading]);

  // Initialize Chat
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      setLoadingStatus("正在連結深層意識...");
      // Initialize Journey Points FIRST to avoid overwriting subsequent updates
      setJourneyPoints([{ timestamp: Date.now(), description: "踏上旅程", emotion: 'neutral' }]);
      setHasUnreadJourney(false);
      
      try {
        const result = await sendUserMessage("(諮商開始。來訪者靜靜地走進房間。)", persona, []);
        handleAIResponse(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        setLoadingStatus("正在用心感受...");
      }
    };
    initChat();
  }, [persona]);

  const handleRequestStory = async () => {
    if (isStoryLoading) return;
    
    // Only play click sound if triggered manually (optional distinction, but here we assume playSoftClick is fine)
    if (!triggerStoryGeneration) playSoftClick();
    
    setIsStoryLoading(true);
    try {
      const story = await generateHealingStory(persona, messages);
      if (story) {
        setStoryForModal(story);
        setShowStoryModal(true);
        playStoryUnlock();
      } else {
        // Fallback if story fails (likely quota)
        const errorMsg: ChatMessage = {
            role: 'model',
            text: "(微光故事暫時無法顯現...可能是心靈連結過於頻繁，請稍作休息後再試。)",
            timestamp: Date.now(),
            isError: true
        };
        setMessages((prev) => [...prev, errorMsg]);
        console.warn("Could not generate a story at this time.");
      }
    } catch (error) {
      console.error("Error requesting story:", error);
    } finally {
      setIsStoryLoading(false);
    }
  };

  const handleAIResponse = (result: AnalysisResult) => {
    const aiMsg: ChatMessage = {
      role: 'model',
      text: result.text,
      timestamp: Date.now(),
      insight: result.insight,
      practicalStep: result.practicalStep
    };
    setMessages((prev) => [...prev, aiMsg]);
    setCurrentProgress(result.progress);
    setCurrentStatus(result.status);
    setCurrentEmotion(result.detectedEmotion);
    
    playMessageReceived();

    // Handle Turning Points
    if (result.newTurningPoint) {
      setJourneyPoints(prev => {
        // Prevent duplicate consecutive entries (simple debounce for strict mode/rapid updates)
        const lastPoint = prev[prev.length - 1];
        if (lastPoint && lastPoint.description === result.newTurningPoint) {
            return prev;
        }
        
        // If the map is closed, mark as unread to trigger flash
        if (!showJourneyMap) {
            setHasUnreadJourney(true);
        }
        
        return [
            ...prev, 
            { 
              timestamp: Date.now(), 
              description: result.newTurningPoint!, 
              emotion: result.detectedEmotion 
            }
        ];
      });
    }

    // Handle Emotion Naming Trigger
    if (result.suggestEmotionNaming) {
      playNotification();
      setShowEmotionSelector(true);
    }

    // Handle Story Suggestion
    if (result.suggestStory) {
       setTriggerStoryGeneration(true);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue.trim();
    if (isLoading || !textToSend) return;
    
    if (showDisclaimer) setShowDisclaimer(false);
    
    playMessageSent();
    setInputValue("");
    setShowEmotionSelector(false); // Close selector if open
    setShowEmojiPicker(false);

    const userMsg: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };
    
    // Optimistically update UI
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    
    // 1. Calculate Reading Delay (Simulating human reading speed)
    // Base 800ms + 30ms per character, capped at 2.5s
    const readingDelay = Math.min(2500, 800 + textToSend.length * 30);
    setLoadingStatus("正在閱讀你的文字...");

    try {
      // Execute API call and Reading Delay in parallel
      // We ensure that we wait for at least 'readingDelay' even if API returns faster
      const apiPromise = sendUserMessage(textToSend, persona, messages);
      const delayPromise = new Promise(resolve => setTimeout(resolve, readingDelay));

      const [result] = await Promise.all([apiPromise, delayPromise]);

      // 2. Calculate Typing Delay (Simulating human typing speed)
      // Base 1000ms + 20ms per character of output, capped at 4s
      // This happens AFTER reading is done
      setLoadingStatus("正在思考回應...");
      const responseLength = result.text.length;
      const typingDelay = Math.min(4000, 1000 + responseLength * 20);
      
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      handleAIResponse(result);
    } catch (error: any) {
      console.error("Failed to send", error);
      
      let errorText = "連線似乎有些不穩，請再試一次。";
      const errorString = error ? (typeof error === 'object' ? JSON.stringify(error) : String(error)) : "";
      
      if (errorString.includes("429") || errorString.includes("quota") || errorString.includes("RESOURCE_EXHAUSTED")) {
        errorText = "目前心靈連結過於頻繁（已達 API 額度上限），請深呼吸休息一分鐘後再試。";
      }

      const errorMsg: ChatMessage = {
          role: 'model',
          text: errorText,
          timestamp: Date.now(),
          isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStatus("正在用心感受..."); // Reset to default
    }
  };

  const handleEmojiClick = (emoji: string, label: string) => {
    // If user has input text, append emoji. 
    // If input is empty, send emoji with label context to let AI judge mood immediately.
    const content = inputValue.trim() ? `${inputValue} ${emoji}` : `${emoji} (覺得${label})`;
    handleSendMessage(content);
    playSoftClick();
    setShowEmojiPicker(false);
  };

  const handleEmotionSelect = (emotionLabel: string, emotionValue: string) => {
    playSoftClick();
    handleSendMessage(`(我選擇了「${emotionLabel}」情緒卡) 我覺得...${emotionValue}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };
  
  const closeStoryModal = () => {
    playSoftClick();
    setShowStoryModal(false);
    setTimeout(() => {
      setStoryForModal(null);
    }, 300);
  };

  const handleBack = () => {
    playSoftClick();
    onBack();
  };

  const toggleJourneyMap = () => {
    playSoftClick();
    if (!showJourneyMap) {
        // We are opening it, so mark as read
        setHasUnreadJourney(false);
    }
    setShowJourneyMap(!showJourneyMap);
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} className="font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const bgOpacity = 0.1 + (currentProgress / 100) * 0.15;

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden selection:bg-indigo-500/30 font-sans">
      
      {/* Journey Map Modal */}
      {showJourneyMap && (
        <div 
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-appear"
          onClick={toggleJourneyMap}
        >
          <div 
            className="relative w-full max-w-lg bg-slate-900/80 border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={toggleJourneyMap} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <div className="flex items-center gap-3 mb-8">
                <Map className="text-indigo-400" />
                <h3 className="text-2xl font-bold text-white">對話旅程地圖</h3>
            </div>
            
            <div className="relative ml-4 border-l-2 border-white/10 space-y-8">
                {journeyPoints.map((point, idx) => (
                    <div key={idx} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div 
                            className="absolute -left-[9px] top-0 w-4 h-4 rounded-full ring-4 ring-slate-900"
                            style={{ backgroundColor: EMOTION_COLORS[point.emotion] }}
                        />
                        <span className="text-xs text-gray-500 block mb-1">
                            {new Date(point.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <p className="text-lg text-white font-medium">{point.description}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Emotion Selector Overlay */}
      {showEmotionSelector && (
         <div className="absolute bottom-24 left-0 right-0 z-30 px-4 animate-fade-in-up">
            <div className="max-w-5xl mx-auto bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl md:text-2xl text-white font-bold flex items-center gap-3 tracking-wide">
                        <Fingerprint className="w-8 h-8 text-pink-400" />
                        試著為這份感受命名...
                    </h4>
                    <button onClick={() => setShowEmotionSelector(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={28} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {EMOTION_CARDS.map((card, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleEmotionSelect(card.label, card.value)}
                            className="p-4 md:p-6 rounded-2xl bg-slate-900 hover:bg-slate-700 border border-white/10 hover:border-indigo-500/50 transition-all text-left group shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            <span className="block text-xl md:text-2xl text-indigo-300 font-bold group-hover:text-indigo-200 mb-2 md:mb-3 tracking-wider">{card.label}</span>
                            <span className="block text-xs md:text-sm text-gray-400 group-hover:text-gray-200 font-medium leading-relaxed">{card.value}</span>
                        </button>
                    ))}
                </div>
            </div>
         </div>
      )}

      {/* Story Modal */}
      {showStoryModal && storyForModal && (
        <div 
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-appear"
          onClick={closeStoryModal}
        >
          <div 
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br ${persona.color} opacity-10 blur-[100px] pointer-events-none`}></div>
            <div className={`absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-gradient-to-br ${persona.color} opacity-10 blur-[100px] pointer-events-none`}></div>
            
            <button 
              onClick={closeStoryModal}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-30"
              aria-label="關閉故事"
            >
              <X size={32} />
            </button>
            
            <div className="overflow-y-auto p-6 md:p-14 custom-scrollbar relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 md:mb-8 inline-flex items-center justify-center p-4 rounded-full bg-white/5 border border-white/10 ring-1 ring-white/5">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-gray-300" />
                </div>
                
                <h4 className="font-bold text-sm tracking-[0.4em] uppercase text-indigo-300/80 mb-4">心靈微光故事</h4>
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 md:mb-10 drop-shadow-xl leading-tight tracking-tight">{storyForModal.title}</h3>
                
                <div className="relative px-2 md:px-8 w-full">
                  <span className="absolute top-0 left-0 text-6xl md:text-7xl text-white/5 leading-none font-serif -translate-x-4 -translate-y-4">“</span>
                  <div className="text-lg md:text-2xl text-gray-200 leading-relaxed tracking-wide font-normal space-y-6 text-justify">
                    {/* Using formatTextToParagraphs here too for stories */}
                    {formatTextToParagraphs(storyForModal.content).map((paragraph, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      return (
                        <p 
                          key={idx} 
                          className={isLast ? "text-indigo-300 font-bold text-center mt-8 italic tracking-wider drop-shadow-[0_0_8px_rgba(165,180,252,0.3)]" : ""}
                        >
                          {renderFormattedText(paragraph)}
                        </p>
                      );
                    })}
                  </div>
                  <span className="absolute bottom-0 right-0 text-6xl md:text-7xl text-white/5 leading-none font-serif translate-x-4 translate-y-4">”</span>
                </div>

                <button 
                  onClick={closeStoryModal}
                  className="mt-10 md:mt-12 px-10 py-3 rounded-full bg-white/5 hover:bg-white/10 text-base text-gray-400 hover:text-white transition-all border border-white/5 tracking-wider"
                >
                  收入心底
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 transition-opacity duration-1000">
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950 opacity-95"></div>
         {/* Blob colors now also react to emotion slightly by blending with global ambiance, but main blobs keep persona color for identity */}
         <div 
            className={`absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-r ${persona.color} rounded-full mix-blend-screen filter blur-[120px] animate-blob`}
            style={{ opacity: bgOpacity }}
         ></div>
         <div 
            className={`absolute top-[30%] right-[-20%] w-[600px] h-[600px] bg-gradient-to-l ${persona.color} rounded-full mix-blend-screen filter blur-[100px] animate-blob-reverse`}
            style={{ opacity: bgOpacity * 0.8 }}
         ></div>
         <div 
            className={`absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-gradient-to-t ${persona.color} rounded-full mix-blend-screen filter blur-[130px] animate-blob animation-delay-4000`}
            style={{ opacity: bgOpacity }}
         ></div>
         <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Header - Compact on mobile */}
      <header className="flex items-center justify-between px-4 md:px-6 py-2 md:py-4 z-20 h-16 md:h-20 flex-shrink-0 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
        <button onClick={handleBack} className="p-2 md:p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white group" aria-label="返回">
          <ArrowLeft size={24} className="md:w-7 md:h-7 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-center animate-appear">
          <h2 className="text-lg md:text-xl font-bold text-white/90 flex items-center justify-center gap-2 md:gap-3 tracking-wide">
            <span className="text-2xl md:text-3xl drop-shadow-md filter">{persona.icon}</span> 
            <span className="drop-shadow-sm">{persona.title}</span>
          </h2>
        </div>
        <button 
            onClick={toggleJourneyMap}
            className="p-2 md:p-3 hover:bg-white/10 rounded-full transition-colors text-indigo-400 hover:text-white group relative" 
            aria-label="旅程地圖"
        >
          <Map size={24} />
          {hasUnreadJourney && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full animate-ping" />
          )}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative max-w-5xl mx-auto w-full overflow-hidden z-10">
        
        {/* Visualizer Area - Compact padding on mobile */}
        <div className="flex-shrink-0 px-4 py-2 md:px-6 md:py-4 z-10 transition-all duration-1000 ease-in-out animate-fade-in-up">
          <HeartVisualizer 
            progress={currentProgress} 
            status={currentStatus} 
            color={persona.color} 
            currentEmotion={currentEmotion}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-2 md:py-4 space-y-6 md:space-y-8 z-10 custom-scrollbar mb-2 scroll-smooth">
            {messages.length === 0 && isLoading && (
                 <div className="flex flex-col justify-center items-center h-48 md:h-64 text-gray-400 animate-pulse space-y-4 md:space-y-6">
                    <div className="relative">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-t-transparent border-white/10 animate-spin"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-b-transparent border-indigo-500/30 animate-spin animation-delay-2000"></div>
                    </div>
                    <p className="tracking-[0.2em] uppercase text-xs md:text-sm font-medium opacity-70">{loadingStatus}</p>
                 </div>
            )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col w-full animate-fade-in-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`} style={{ animationDelay: '0.1s' }}>
              <div 
                className={`
                    max-w-[95%] md:max-w-[85%] rounded-[1.2rem] md:rounded-[1.5rem] px-5 py-4 md:px-8 md:py-6 transition-all duration-500 
                    ${msg.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-600 via-violet-600 to-violet-700 text-white rounded-br-none shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] border border-white/10' 
                        : 'bg-slate-800/60 text-gray-100 border border-white/5 rounded-tl-none backdrop-blur-md shadow-lg'
                    }
                `}
              >
                {/* Apply formatTextToParagraphs here to split long paragraphs */}
                {formatTextToParagraphs(msg.text).map((paragraph, index, arr) => (
                  <p
                    key={index}
                    className={`text-lg md:text-2xl leading-relaxed tracking-wide font-normal ${index < arr.length - 1 ? 'mb-6 md:mb-8' : ''}`}
                  >
                    {renderFormattedText(paragraph)}
                  </p>
                ))}
                
                {/* 
                   NEW: Render Substantial Help Cards (Insight & Practical Step) inside the message bubble 
                   This directly addresses the "hollow interaction" feedback by providing visual weight to advice.
                */}
                
                {msg.insight && (
                    <div className="mt-6 pt-5 border-t border-white/10">
                        <div className="flex items-start gap-3 bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                            <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-1">心靈洞見</span>
                                <p className="text-base md:text-lg text-white font-medium italic">"{msg.insight}"</p>
                            </div>
                        </div>
                    </div>
                )}

                {msg.practicalStep && (
                    <div className="mt-4 pt-2">
                        <div className="flex items-start gap-3 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                            <Footprints className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                            <div>
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block mb-1">微行動</span>
                                <p className="text-base md:text-lg text-gray-200">{msg.practicalStep}</p>
                            </div>
                        </div>
                    </div>
                )}

              </div>
            </div>
          ))}
           {isLoading && messages.length > 0 && (
            <div className="flex justify-start w-full animate-fade-in-up">
              <div className="relative overflow-hidden bg-slate-800/80 px-6 py-5 rounded-[1.5rem] rounded-tl-none backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(79,70,229,0.15)] group">
                {/* Shimmer gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-full animate-shimmer"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                   {/* Animated Icon */}
                   <div className="relative flex items-center justify-center">
                      <div className="absolute w-8 h-8 bg-indigo-500 rounded-full blur-xl opacity-30 animate-pulse-slow"></div>
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-spin-slow" /> 
                   </div>

                   {/* Dynamic Text & Dots */}
                   <div className="flex items-center gap-1.5">
                      <span className="text-indigo-200/90 text-sm font-medium tracking-widest min-w-[80px]">
                        {loadingStatus}
                      </span>
                      <span className="flex gap-1 items-center mt-1">
                         <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                         <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                         <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                      </span>
                   </div>
                </div>
              </div>
            </div>
          )}
          {isStoryLoading && (
            <div className="flex justify-start w-full animate-fade-in-up">
               <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-3 rounded-xl flex items-center gap-3 border border-indigo-500/20 backdrop-blur-md">
                 <LoaderCircle className="w-4 h-4 text-indigo-400 animate-spin" />
                 <span className="text-indigo-300 text-xs md:text-sm tracking-widest animate-pulse">正在為你編織微光故事...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Bar */}
        <div className="flex-shrink-0 px-4 pb-6 pt-2 md:px-6 md:pb-8 z-20 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2 md:gap-3 bg-slate-800/50 border border-white/10 rounded-[2rem] p-1.5 pr-2 md:p-2 md:pr-3 shadow-2xl backdrop-blur-2xl transition-all duration-500 focus-within:bg-slate-800/80 focus-within:border-indigo-500/30 focus-within:ring-1 focus-within:ring-indigo-500/20 focus-within:shadow-[0_0_20px_rgba(79,70,229,0.2)]">
            
            {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-4 p-3 md:p-4 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in-up w-64 md:w-72 z-30">
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_EMOTIONS.map((e, i) => (
                      <button 
                        key={i}
                        onClick={() => handleEmojiClick(e.icon, e.label)}
                        className="flex flex-col items-center justify-center p-2 md:p-3 hover:bg-white/10 rounded-xl transition-colors group"
                      >
                        <span className="text-xl md:text-2xl mb-1 group-hover:scale-110 transition-transform">{e.icon}</span>
                        <span className="text-[10px] text-gray-400">{e.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Arrow */}
                  <div className="absolute -bottom-2 left-16 w-4 h-4 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
                </div>
            )}

            <button
                onClick={() => handleRequestStory()}
                disabled={isStoryLoading || messages.length < 3}
                className={`
                    p-2 md:p-3 rounded-full flex-shrink-0 transition-all duration-300
                    ${isStoryLoading || messages.length < 3 ? 'text-gray-600 bg-white/5 cursor-not-allowed' : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'}
                `}
                title={messages.length < 3 ? "對話深入後可解鎖故事" : "生成心靈微光故事"}
            >
                {isStoryLoading ? <LoaderCircle className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

             <button 
                onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    playSoftClick();
                }}
                className={`p-2 md:p-3 rounded-full flex-shrink-0 transition-colors ${showEmojiPicker ? 'text-yellow-400 bg-white/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'}`}
             >
                <Smile className="w-6 h-6 md:w-6 md:h-6" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={isLoading ? "..." : "說說你的感覺..."}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-base md:text-lg py-2 md:py-3 px-1 md:px-2 font-light tracking-wide outline-none min-w-0"
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className={`
                p-3 md:p-4 rounded-full flex-shrink-0 transition-all duration-300 transform
                ${!inputValue.trim() || isLoading 
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 shadow-[0_4px_12px_rgba(79,70,229,0.4)]'
                }
              `}
            >
              <Send size={18} className={`md:w-5 md:h-5 ${inputValue.trim() && !isLoading ? "ml-0.5" : ""}`} />
            </button>
          </div>
          {showDisclaimer && (
            <p className="text-center text-gray-600/60 text-[10px] md:text-xs mt-2 md:mt-3 tracking-widest font-light animate-fade-in-up">
              AI 生成內容僅供參考，請以專業醫療建議為準
            </p>
          )}
        </div>
      </div>
    </div>
  );
};