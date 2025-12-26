const VideoList = ({ videos, loading, onVideoSelect, onVideoDelete, selectedVideo, userRole }) => {
    const getStatusColor = (status) => {
      const colors = {
        uploading: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };
  
    const getSensitivityColor = (status) => {
      const colors = {
        pending: 'bg-gray-100 text-gray-800',
        safe: 'bg-green-100 text-green-800',
        flagged: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };
  
    if (loading) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos...</p>
        </div>
      );
    }
  
    if (videos.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No videos found. Upload your first video!
        </div>
      );
    }
  
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Videos ({videos.length})</h2>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {videos.map((video) => (
            <div
              key={video._id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedVideo?._id === video._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
              onClick={() => onVideoSelect(video)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{video.title}</h3>
                {(userRole === 'editor' || userRole === 'admin') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVideoDelete(video._id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              {video.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
              )}
              
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(video.status)}`}>
                  {video.status}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${getSensitivityColor(video.sensitivityStatus)}`}>
                  {video.sensitivityStatus}
                </span>
              </div>
              
              {video.status === 'processing' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${video.processingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Processing: {video.processingProgress}%
                  </p>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                Uploaded: {new Date(video.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default VideoList;