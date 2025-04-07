import React from 'react';
import { useAuthStore } from '../store/authStore';

export function ProfileButton() {
  const { accessToken, logout } = useAuthStore();
  const [profileData, setProfileData] = React.useState<{
    name: string;
    picture: string;
  } | null>(null);

  React.useEffect(() => {
    if (accessToken) {
      // Fetch profile data when accessToken is available
      fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.items?.[0]?.snippet) {
          setProfileData({
            name: data.items[0].snippet.title,
            picture: data.items[0].snippet.thumbnails.default.url
          });
        }
      })
      .catch(error => console.error('Error fetching profile:', error));
    }
  }, [accessToken]);

  if (!accessToken) return null;

  return (
    <div className="relative">
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        {profileData ? (
          <>
            <img 
              src={profileData.picture} 
              alt="Channel" 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-gray-700">{profileData.name}</span>
          </>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        )}
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
        <button
          onClick={logout}
          className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
}