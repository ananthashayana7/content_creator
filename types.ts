
export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  pinnedComment: string;
  seoKeywords: string[];
  endScreenConfig: {
    subscribe: boolean;
    recommendedVideos: number;
    playlistLink?: string;
  };
}

export interface GenerationResult {
  videoUrl?: string;
  audioUrl?: string;
  thumbnails: string[];
  metadata: VideoMetadata;
  report: {
    videoId: string;
    uploadTime: string;
    confidence: number;
    summary: string;
    groundingSources?: any[];
  };
}

export type GenerationStatus = 'idle' | 'scripting' | 'media' | 'assembling' | 'completed' | 'error' | 'review';

export interface AppState {
  theme: string;
  voiceProfile: 'user-voice' | 'natural-tts';
  uploadTime: string;
  status: GenerationStatus;
  progress: number;
  result: GenerationResult | null;
  error: string | null;
}
