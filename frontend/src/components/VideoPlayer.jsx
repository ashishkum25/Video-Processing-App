import { videoAPI } from '../services/api';

const VideoPlayer = ({ video }) => {
  if (video.status !== 'completed') {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="mb-4">
          <div className="inline-block p-4 bg-blue-100 rounded-full">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-gray-600 font-medium mb-2">Video is still processing...</p>
        <p className="text-sm text-gray-500">
          Progress: {video.processingProgress}%
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4 max-w-xs mx-auto">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${video.processingProgress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="aspect-video bg-black">
        <video
          controls
          className="w-full h-full"
          src={videoAPI.getStreamUrl(video._id)}
          type={video.mimeType}
        >
          Your browser does not support video playback.
        </video>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h3>
        
        {video.description && (
          <p className="text-gray-600 mb-4">{video.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
          <div>
            <span className="font-medium text-gray-700">Duration:</span>{' '}
            <span className="text-gray-600">{video.duration}s</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Size:</span>{' '}
            <span className="text-gray-600">
              {(video.filesize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Sensitivity:</span>{' '}
            <span className={`font-medium ${
              video.sensitivityStatus === 'safe' ? 'text-green-600' : 
              video.sensitivityStatus === 'flagged' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {video.sensitivityStatus}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Score:</span>{' '}
            <span className="text-gray-600">{video.sensitivityScore.toFixed(2)}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-700">Uploaded by:</span>{' '}
            <span className="text-gray-600">{video.uploadedBy?.username || 'Unknown'}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-700">Uploaded on:</span>{' '}
            <span className="text-gray-600">
              {new Date(video.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;