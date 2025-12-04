
export interface Persona {
  id: string;
  title: string;
  icon: string;
  description: string;
  systemPromptContext: string;
  color: string;
}

export interface HealingStory {
  title: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  // New fields for substantial value
  insight?: string;
  practicalStep?: string;
}

export type EmotionType = 'neutral' | 'anxiety' | 'sadness' | 'anger' | 'calm' | 'joy' | 'fear' | 'hope';

export interface JourneyPoint {
  timestamp: number;
  description: string;
  emotion: EmotionType;
}

export interface AnalysisResult {
  text: string;
  progress: number; // 0 to 100
  status: string; // Short phrase
  detectedEmotion: EmotionType; // For the Emotional Spectrum
  newTurningPoint?: string; // If a key moment occurred, describe it
  suggestEmotionNaming?: boolean; // If true, trigger the Emotion Naming UI
  suggestStory?: boolean; // If true, automatically trigger the healing story generation
  
  // New fields for substantial value
  insight?: string; // A re-framing quote or key takeaway
  practicalStep?: string; // A concrete micro-action for the user
}

export type AppView = 'selection' | 'chat' | 'summary';
