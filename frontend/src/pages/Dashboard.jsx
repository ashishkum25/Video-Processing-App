import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { videoAPI } from '../services/api';
import VideoUpload from '../components/VideoUpload';
import VideoList from '../components/VideoList';
import VideoPlayer from '../components/VideoPlayer';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filter, setFilter] = useState({ status: '', sensitivityStatus: '' });
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('videoProgress', (data) => {
      console.log('Progress update:', data);
      fetchVideos();
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await videoAPI.getAll(filter);
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchVideos();
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleVideoDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await videoAPI.delete(videoId);
        fetchVideos();
        if (selectedVideo?._id === videoId) {
          setSelectedVideo(null);
        }
      } catch (error) {
        console.error('Failed to delete video:', error);
        alert('Failed to delete video');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Video Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.username} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Upload Section */}
        {(user?.role === 'editor' || user?.role === 'admin') && (
          <div className="mb-8">
            <VideoUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">All Status</option>
              <option value="uploading">Uploading</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filter.sensitivityStatus}
              onChange={(e) => setFilter({ ...filter, sensitivityStatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">All Sensitivity</option>
              <option value="pending">Pending</option>
              <option value="safe">Safe</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video List */}
          <div>
            <VideoList
              videos={videos}
              loading={loading}
              onVideoSelect={handleVideoSelect}
              onVideoDelete={handleVideoDelete}
              selectedVideo={selectedVideo}
              userRole={user?.role}
            />
          </div>

          {/* Video Player */}
          <div>
            {selectedVideo ? (
              <VideoPlayer video={selectedVideo} />
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                Select a video to play
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
