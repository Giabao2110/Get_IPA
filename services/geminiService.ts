
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordDetails } from "../types";

// In-memory cache for audio
const audioCache = new Map<string, string>();

/**
 * [API] Lấy dữ liệu từ Gemini (Vẫn giữ cho độ chính xác cao về IPA)
 */
export async function getIPAForWord(word: string): Promise<WordDetails> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide linguistic data (IPA, definition, example) for the English word: "${word.trim()}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          ipa_us: { type: Type.STRING },
          ipa_uk: { type: Type.STRING },
          definition: { type: Type.STRING },
          example: { type: Type.STRING },
          partsOfSpeech: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["word", "ipa_us", "ipa_uk", "definition", "example", "partsOfSpeech"]
      }
    }
  });
  return JSON.parse(response.text?.trim() || "{}");
}

/**
 * [LOCAL] Phát âm bằng Web Speech API (Tốc độ phản hồi tức thì)
 */
export function speakLocal(text: string, accent: 'US' | 'UK' = 'US'): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Chọn giọng đọc dựa trên accent
    const voices = window.speechSynthesis.getVoices();
    if (accent === 'US') {
      utterance.lang = 'en-US';
      const usVoice = voices.find(v => v.lang.includes('US') && v.name.includes('Google'));
      if (usVoice) utterance.voice = usVoice;
    } else {
      utterance.lang = 'en-GB';
      const ukVoice = voices.find(v => v.lang.includes('GB') && v.name.includes('Google'));
      if (ukVoice) utterance.voice = ukVoice;
    }
    
    utterance.rate = 0.9; // Tốc độ vừa phải để dễ nghe
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * [API] Tạo âm thanh chất lượng cao bằng Gemini (Dùng khi người dùng muốn nghe giọng AI thật)
 */
export async function generatePronunciation(text: string, accent: 'US' | 'UK' = 'US'): Promise<string> {
  const cacheKey = `${accent}:${text.toLowerCase()}`;
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voice = accent === 'US' ? 'Kore' : 'Puck';
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  });

  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64) {
    audioCache.set(cacheKey, base64);
    return base64;
  }
  throw new Error("TTS Failed");
}

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function getWordSuggestions(input: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest 5 English words starting with: "${input}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function getParagraphIPA(text: string): Promise<{original: string, ipa: string}[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `IPA transcription for: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { original: { type: Type.STRING }, ipa: { type: Type.STRING } },
          required: ["original", "ipa"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}
