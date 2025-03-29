import { fetchWithAuth, YOUTUBE_API_BASE } from './api';
import toast from 'react-hot-toast';

export async function updateVideoDetails(
  videoId: string,
  accessToken: string,
  data: { title: string; description: string; tags: string[] }
) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const response = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/videos?part=snippet`,
      {
        method: 'PUT',
        body: JSON.stringify({
          id: videoId,
          snippet: {
            title: data.title,
            description: data.description,
            tags: data.tags,
            categoryId: '22' // Default to "People & Blogs"
          }
        })
      },
      accessToken
    );

    return response;
  } catch (error: any) {
    console.error('Error updating video:', error);
    toast.error(error.message || 'Failed to update video details');
    throw error;
  }
}