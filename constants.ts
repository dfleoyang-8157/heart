
import { Persona, EmotionType } from './types';

export const PERSONAS: Persona[] = [
  {
    id: 'perfectionist',
    title: '怕犯錯的完美主義者',
    icon: '🎯',
    description: '這也要做對，那也要做好。一點小失誤就讓你焦慮整晚，覺得自己很差勁。',
    systemPromptContext: '使用者是「怕犯錯的完美主義者」。他們對錯誤極度焦慮，覺得價值建立在成就上。引導他們接受「完成比完美重要」，理解不完美也是一種美。',
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'imposter',
    title: '覺得自己是騙子的冒牌者',
    icon: '🎭',
    description: '明明做得不錯，卻總覺得是運氣好。很怕哪天被發現其實自己沒那麼厲害。',
    systemPromptContext: '使用者是「冒牌者症候群」。他們無法內化成就，恐懼被揭穿。引導他們看見自己的實力與努力，將運氣與實力區分開來。',
    color: 'from-purple-500 to-pink-400'
  },
  {
    id: 'caregiver',
    title: '心好累的付出者',
    icon: '❤️‍🩹',
    description: '總是先照顧別人的情緒，把自己的需求縮得好小好小，累到想哭卻不敢停。',
    systemPromptContext: '使用者是「疲憊的照顧者」。習慣討好與付出，忽略自我。引導他們建立界線，重視自己的需求，明白照顧自己不是自私。',
    color: 'from-emerald-500 to-teal-400'
  },
  {
    id: 'loner',
    title: '害怕受傷的刺蝟',
    icon: '🦔',
    description: '想被理解又怕受傷。只要別人稍微靠近，就會忍不住想逃跑或把對方推開。',
    systemPromptContext: '使用者是「害怕受傷的刺蝟（孤獨者）」。渴望連結卻恐懼依賴。引導他們建立安全感，練習信任，慢慢放下身上的刺。',
    color: 'from-slate-500 to-gray-400'
  },
  {
    id: 'lost',
    title: '不知去向的迷路人',
    icon: '🧭',
    description: '看著大家都在前進，只有我停在原地。不知道未來在哪裡，覺得人生好迷惘。',
    systemPromptContext: '使用者是「迷路人」。對未來感到茫然焦慮，缺乏目標感。引導他們探索當下的感受，尋找微小的方向，專注於腳下的每一步。',
    color: 'from-orange-500 to-amber-400'
  },
  {
    id: 'hsp',
    title: '容易受傷的高敏感族',
    icon: '🦋',
    description: '別人的眼神、語氣，甚至環境的聲音都會讓你神經緊繃。常被說「你想太多了」。',
    systemPromptContext: '使用者是「高敏感族 (HSP)」。感官敏銳，容易過度負荷。引導他們將敏感視為天賦而非缺陷，學習情緒調節與自我保護。',
    color: 'from-rose-400 to-red-300'
  },
  {
    id: 'pleaser',
    title: '總是笑著的面具人',
    icon: '😊',
    description: '不敢拒絕，怕別人生氣或失望。總是笑著說「好」，心裡卻覺得好累好委屈。',
    systemPromptContext: '使用者是「討好者」。害怕衝突，壓抑真實感受。引導他們練習說「不」，表達真實情緒，找回真實的自己。',
    color: 'from-yellow-400 to-orange-300'
  },
  {
    id: 'numb',
    title: '感覺不到快樂的空心人',
    icon: '😶',
    description: '沒有特別難過，但也感覺不到開心。日子一天天過，心裡卻好像破了個洞。',
    systemPromptContext: '使用者是「空心人（情感麻木）」。與情緒斷聯，感到空虛。引導他們重新連結微小的感覺，找回生命力與熱情。',
    color: 'from-indigo-400 to-blue-300'
  },
  {
    id: 'breadwinner',
    title: '不敢冒險的家中支柱',
    icon: '🧱',
    description: '薪水高但心裡苦，待在舒適圈太久反而怕出去。背著全家的生計，覺得自己沒有「冒險的資格」。',
    systemPromptContext: '使用者是「不敢冒險的家中支柱（黃金手銬）」。身陷高薪但停滯的職場，背負家庭經濟重擔，恐懼改變帶來的風險。引導他們看見這份承擔的價值，接納「不敢動」的恐懼，並探索如何在沈重的責任縫隙中，找回一點點屬於自己的自由與喘息空間。',
    color: 'from-amber-700 to-yellow-600'
  }
];

export const EMOTION_COLORS: Record<EmotionType, string> = {
  neutral: '#a855f7', // Purple (Default)
  anxiety: '#facc15', // Yellow/Orange - Tense
  sadness: '#60a5fa', // Blue - Melancholy
  anger: '#ef4444',   // Red - Intense
  calm: '#34d399',    // Green/Teal - Balanced
  joy: '#fbbf24',     // Amber/Gold - Warm
  fear: '#a78bfa',    // Dark Purple - Shadow
  hope: '#f472b6',    // Pink - Gentle
};

export const EMOTION_CARDS = [
  { label: "委屈", value: "感到委屈，像是有苦說不出" },
  { label: "空虛", value: "心裡空空的，好像少了什麼" },
  { label: "焦慮", value: "停不下來，覺得有壞事要發生" },
  { label: "失落", value: "原本期待的落空了，心裡沉沉的" },
  { label: "愧疚", value: "覺得都是我的錯，對不起別人" },
  { label: "孤單", value: "世界上好像只有我一個人" },
  { label: "無力", value: "想改變卻一點力氣都沒有" },
  { label: "釋懷", value: "好像終於可以放下一點點了" },
];
