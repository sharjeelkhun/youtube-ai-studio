import { VideoData } from '../types/youtube';
import { fetchWithAuth, YOUTUBE_API_BASE } from './api';
import toast from 'react-hot-toast';

export async function getChannelStats(accessToken: string) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const response = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/channels?part=statistics&mine=true`,
      {
        headers: {
          'Accept': 'application/json',
        }
      },
      accessToken
    );

    if (!response.items?.[0]) {
      throw new Error('No channel data found');
    }

    return response.items[0].statistics;
  } catch (error: any) {
    console.error('Error fetching channel stats:', error);
    toast.error('Failed to fetch channel statistics');
    throw new Error(error.message || 'Failed to fetch channel statistics');
  }
}

export async function getChannelVideos(accessToken: string): Promise<VideoData[]> {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const channelResponse = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&mine=true`,
      {
        headers: {
          'Accept': 'application/json',
        }
      },
      accessToken
    );
    
    if (!channelResponse.items?.[0]) {
      throw new Error('No channel found');
    }

    const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;
    let allVideos: any[] = [];
    let nextPageToken: string | undefined;

    // Fetch all videos using pagination
    do {
      const videosResponse = await fetchWithAuth(
        `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploadsPlaylistId}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        },
        accessToken
      );

      if (!videosResponse.items) break;

      allVideos = [...allVideos, ...videosResponse.items];
      nextPageToken = videosResponse.nextPageToken;
    } while (nextPageToken);

    // Process videos in batches of 50 (YouTube API limit)
    const processedVideos: VideoData[] = [];
    for (let i = 0; i < allVideos.length; i += 50) {
      const batch = allVideos.slice(i, i + 50);
      const videoIds = batch.map(item => item.contentDetails.videoId).join(',');

      const detailsResponse = await fetchWithAuth(
        `${YOUTUBE_API_BASE}/videos?part=statistics,snippet&id=${videoIds}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        },
        accessToken
      );

      const processedBatch = batch.map((item: any, index: number) => {
        const details = detailsResponse.items[index];
        return {
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          views: details?.statistics?.viewCount || '0',
          likes: details?.statistics?.likeCount || '0',
          uploadDate: item.snippet.publishedAt,
          tags: details?.snippet?.tags || []
        };
      });

      processedVideos.push(...processedBatch);
    }

    return processedVideos;
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    toast.error('Failed to fetch videos from YouTube');
    throw new Error(error.message || 'Failed to fetch videos');
  }
}

export async function updateVideoThumbnail(videoId: string, thumbnailFile: File, accessToken: string) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const formData = new FormData();
    formData.append('image', thumbnailFile);

    const response = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/thumbnails/set?videoId=${videoId}`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      },
      accessToken
    );

    return response;
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    throw error;
  }
}

export async function getAISuggestions(videoId: string, accessToken: string) {
  const response = await fetch(`https://api.example.com/ai-suggestions/${videoId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch AI suggestions');
  }

  return response.json();
}