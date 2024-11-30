export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  uploadDate: string;
  description: string;
  tags: string[];
}

export interface YouTubeApiError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}