
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VideoMetadata, GenerationResult } from "../types";

export class GeminiService {
  private getApiKey() {
    return process.env.API_KEY || "";
  }

  private createClient() {
    return new GoogleGenAI({ apiKey: this.getApiKey() });
  }

  async generateScriptAndMetadata(theme: string): Promise<VideoMetadata & { script: string; confidence: number; groundingSources?: any[] }> {
    const ai = this.createClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform an SEO analysis and generate a 30-60 second conversational YouTube Shorts script and full metadata for the theme: ${theme || 'trending topics'}. 
      The script should feel human, natural, and engaging.
      Use Google Search to find trending keywords for this theme.
      Include:
      1. A conversational script.
      2. SEO-optimized Title (max 60 chars).
      3. Description with keywords and hashtags.
      4. 8-12 Tags.
      5. A pinned comment text.
      6. End screen config.
      7. A self-assessment confidence score (0.0 to 1.0) for the creative quality.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            pinnedComment: { type: Type.STRING },
            seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
            endScreenConfig: {
              type: Type.OBJECT,
              properties: {
                subscribe: { type: Type.BOOLEAN },
                recommendedVideos: { type: Type.NUMBER }
              },
              required: ["subscribe", "recommendedVideos"]
            }
          },
          required: ["script", "title", "description", "tags", "hashtags", "pinnedComment", "seoKeywords", "confidence", "endScreenConfig"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      return {
        ...data,
        groundingSources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    } catch (e) {
      throw new Error("Failed to parse script generation response.");
    }
  }

  async generateThumbnails(title: string): Promise<string[]> {
    const ai = this.createClient();
    // We make two calls for variants
    const prompts = [
      `A high-contrast vertical 9:16 YouTube thumbnail for a video titled: "${title}". Use bold text, a clear human subject, and professional lighting. Variant A: Action-oriented.`,
      `A high-contrast vertical 9:16 YouTube thumbnail for a video titled: "${title}". Use bold text, a clear human subject, and professional lighting. Variant B: Emotive-oriented.`
    ];

    const results = await Promise.all(prompts.map(prompt => 
      ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } }
      })
    ));

    const thumbnails: string[] = [];
    results.forEach(res => {
      for (const part of res.candidates[0].content.parts) {
        if (part.inlineData) {
          thumbnails.push(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    });
    
    return thumbnails;
  }

  async generateVideo(prompt: string): Promise<string> {
    const ai = this.createClient();
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `${prompt}, cinematic vertical 9:16, handheld human-like camera motion, realistic lighting, high detail, no watermarks`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const response = await fetch(`${downloadLink}&key=${this.getApiKey()}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_EXPIRED_OR_INVALID");
      }
      throw err;
    }
  }

  async generateVoiceover(script: string): Promise<string> {
    const ai = this.createClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this naturally, like a friendly human YouTuber: ${script}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Voiceover failed");

    return `data:audio/pcm;base64,${base64Audio}`;
  }
}
