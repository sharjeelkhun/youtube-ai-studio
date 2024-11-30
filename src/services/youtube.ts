import { VideoData } from '../types/youtube';
import { fetchWithAuth, YOUTUBE_API_BASE } from './api';
import { getMockAnalytics } from './analytics';
import toast from 'react-hot-toast';

export async function getChannelStats(accessToken: string) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const response = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/channels?part=statistics&mine=true`,
      {},
      accessToken
    );

    if (!response.items?.[0]) {
      throw new Error('No channel data found');
    }

    return {
      subscriberCount: response.items[0].statistics.subscriberCount || '0',
      videoCount: response.items[0].statistics.videoCount || '0',
      viewCount: response.items[0].statistics.viewCount || '0',
    };
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    throw error;
  }
}

export async function getChannelAnalytics(accessToken: string) {
  return getMockAnalytics();
}

export async function getChannelVideos(accessToken: string): Promise<VideoData[]> {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const channelResponse = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&mine=true`,
      {},
      accessToken
    );
    
    if (!channelResponse.items?.[0]) {
      throw new Error('No channel found');
    }

    const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

    const videosResponse = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploadsPlaylistId}`,
      {},
      accessToken
    );

    if (!videosResponse.items) {
      return [];
    }

    const videoIds = videosResponse.items
      .map((item: any) => item.contentDetails.videoId)
      .join(',');

    const statsResponse = await fetchWithAuth(
      `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoIds}`,
      {},
      accessToken
    );

    return videosResponse.items.map((item: any, index: number) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      views: statsResponse.items[index]?.statistics?.viewCount || '0',
      likes: statsResponse.items[index]?.statistics?.likeCount || '0',
      uploadDate: item.snippet.publishedAt,
      tags: item.snippet.tags || []
    }));
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
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
      },
      accessToken
    );

    return response;
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    throw error;
  }
}