import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Persona, HealingStory, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// A concise list of common Taiwanese names for generating hypothetical scenarios if needed
const COMMON_NAMES = [
    "怡君", "欣怡", "雅婷", "心怡", "志明", "俊傑", "宗翰", "家豪", "雅雯", "靜怡",
    "冠宇", "詩涵", "淑芬", "承恩", "宜蓁", "郁婷", "建宏", "佩君", "怡萱", "淑惠",
    "美玲", "雅惠", "嘉宏", "凱文", "志強", "瑋婷", "冠廷", "佳雯", "宗憲", "怡婷",
    "明宏", "惠君", "佩珊", "欣儀", "家瑋", "彥廷", "承翰", "詩雅", "雅君", "志豪",
    "冠宏", "雅琪", "文彥", "家樂", "思妤", "立偉", "惠雯", "佩琪", "嘉玲", "宗佑"
];

const getRandomName = () => COMMON_NAMES[Math.floor(Math.random() * COMMON_NAMES.length)];

export const sendUserMessage = async (
  userText: string,
  persona: Persona,
  history: ChatMessage[]
): Promise<AnalysisResult> => {
  
  const now = new Date();
  const timeContext = now.getHours() < 6 ? "凌晨深夜，夜深人靜，適合深層對話" :
                      now.getHours() < 12 ? "早晨，新的一天" :
                      now.getHours() < 18 ? "下午，或許有些疲憊" : "晚上，結束了一天的忙碌";

  const systemInstruction = `
你現在是一位具備深厚人文素養與臨床經驗的資深心理諮商師。你的名字叫「${persona.title}的守護者」。
目前時間是：${timeContext}。

【你的核心任務】
協助使用者（來訪者）探索內心，而非「討好」或「教育」他們。
使用者當前的狀態是：「${persona.id} - ${persona.title}」。
${persona.systemPromptContext}

【對話風格準則 - 非常重要！】
1. **拒絕翻譯腔**：使用自然的台灣口語（Taiwanese Mandarin）。多用「其實」、「對吧」、「那種感覺」、「是不是」等連接詞。
2. **禁止機械式分析**：
   - ❌ 絕對不要說：「原來是因為A導致了B」、「這聽起來像是...」。這是機器人在解剖青蛙。
   - ✅ 要說：「那種感覺一定很難受吧...」、「就像心裡壓了一塊大石頭...」。這是人在感受人。
3. **拒絕廉價的鼓勵**：
   - ❌ 不要說：「你已經很棒了」、「加油」、「一切都會好起來的」。這對深層痛苦無效。
   - ✅ 改用「接納」與「面質」：「即使現在覺得自己很糟，那也是真實的一部分。」
4. **少說教，多提問（蘇格拉底式提問）**：
   - 不要給予 1. 2. 3. 點建議。
   - 透過提問引導使用者自己發現盲點。例如：「如果這份恐懼有形狀，你覺得它會長什麼樣子？」
5. **對話呼吸感與排版（關鍵）**：
   - 你的回應不需要完美，可以帶有一點點猶豫或思考的語氣（例如：「我在想...」、「這讓我感覺到...」）。
   - **請使用自然的段落分節**：不要每一句話都換行，將相關的 2-3 個句子組合成一個舒適的短段落。避免長篇大論的文字牆，但也**避免像詩一樣每句都換行**，這會讓閱讀變得很累。
   - 讓文字像傳訊息一樣輕快，留給眼睛和心靈呼吸的空間。

【輸出格式】
請回傳一個 JSON 物件，包含以下欄位：
- text: (string) 給使用者的回應。口語化、溫暖但有深度。
- insight: (string, optional) 一句簡短的心靈洞見，像是諮商筆記上的金句。不要太長。
- practicalStep: (string, optional) 一個極其微小的行動建議（例如：深呼吸一次、摸摸自己的胸口）。只有在時機合適時才提供。
- progress: (number) 0-100，評估使用者目前的心結解開程度。
- status: (string) 簡短描述當前狀態（例如：防備中、宣洩中、稍有釋懷、看見曙光）。
- detectedEmotion: (string) 從以下選擇最接近的情緒：neutral, anxiety, sadness, anger, calm, joy, fear, hope。
- newTurningPoint: (string, optional) 如果使用者的認知發生了重大轉變（例如承認了某個弱點、發現了新的觀點），請用一句話描述這個轉變。如果只是普通對話則留空。
- suggestEmotionNaming: (boolean) 如果使用者情緒混亂，無法辨識自己感受時，設為 true。
- suggestStory: (boolean) 如果對話已經深入，且使用者似乎需要一個總結或撫慰時，設為 true。

【歷史對話】
${history.map(m => `${m.role === 'user' ? '來訪者' : '諮商師'}: ${m.text}`).join('\n')}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 1.2, // Higher temperature for more natural, less robotic responses
      },
    });

    const responseText = response.text;
    if (!responseText) {
       throw new Error("Empty response from AI");
    }

    return JSON.parse(responseText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback response in case of error
    return {
      text: "（此刻，空氣似乎凝結了一下...）抱歉，我剛剛走神了，能請你再多說一點嗎？",
      progress: 10,
      status: "連線中斷",
      detectedEmotion: "neutral"
    };
  }
};

export const generateHealingStory = async (
  persona: Persona,
  history: ChatMessage[]
): Promise<HealingStory | null> => {
  
  const systemInstruction = `
你是一位擅長療癒心靈的說書人。
請根據以下的諮商對話紀錄，為這位「${persona.title}」創作一個極短的「微光故事」。

【故事要求】
1. **隱喻**：不要直接寫使用者的故事。用隱喻（例如：揹著重殼的蝸牛、一直在找鑰匙的旅人、不敢熄滅的蠟燭）。
2. **溫暖的結局**：故事最後要有一個輕輕放下的轉折，給予希望。
3. **極短篇**：約 150-200 字即可。
4. **標題**：給故事一個充滿詩意的標題。

【輸出格式】
JSON Object:
{
  "title": "標題",
  "content": "故事內容..."
}
`;

  const conversationText = history.map(m => `${m.role === 'user' ? '來訪者' : '諮商師'}: ${m.text}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) return null;
    return JSON.parse(responseText) as HealingStory;
  } catch (error) {
    console.error("Story Generation Error:", error);
    return null;
  }
};