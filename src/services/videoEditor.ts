import { fetchWithAuth, YOUTUBE_API_BASE } from './api';
import { VideoData } from '../types/youtube';
import toast from 'react-hot-toast';

export async function updateVideoDetails(
  videoId: string, 
  accessToken: string,
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: 'private' | 'unlisted' | 'public';
  }
) {
  try {
    const response = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/videos?part=snippet,status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          id: videoId,
          snippet: {
            title: updates.title,
            description: updates.description,
            tags: updates.tags,
          },
          status: {
            privacyStatus: updates.privacyStatus,
          },
        }),
      },
      accessToken
    );

    toast.success('Video details updated successfully');
    return response;
  } catch (error) {
    console.error('Error updating video details:', error);
    toast.error('Failed to update video details');
    throw error;
  }
}

export async function deleteVideo(videoId: string, accessToken: string) {
  try {
    await fetchWithAuth(
      `${YOUTUBE_API_BASE}/videos?id=${videoId}`,
      {
        method: 'DELETE',
      },
      accessToken
    );

    toast.success('Video deleted successfully');
  } catch (error) {
    console.error('Error deleting video:', error);
    toast.error('Failed to delete video');
    throw error;
  }
}