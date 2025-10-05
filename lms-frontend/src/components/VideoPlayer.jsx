import { useRef, useCallback } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VideoPlayer = ({ 
  videoUrl, 
  title, 
  onTimeUpdate,
  initialTimestamp = 0 
}) => {
  const videoRef = useRef(null);

  const handleVideoContextMenu = (e) => {
    e.preventDefault();
    toast.error('Right-click is disabled for video protection');
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(Math.floor(videoRef.current.currentTime));
    }
  }, [onTimeUpdate]);

  const setVideoTimestamp = useCallback((timestamp) => {
    if (videoRef.current && videoRef.current.readyState > 0) {
      videoRef.current.currentTime = timestamp;
    }
  }, []);

  if (!videoUrl) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2 inline" />
        <span className="text-red-700">Video not available</span>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          controls
          controlsList="nodownload"
          className="absolute top-0 left-0 w-full h-full"
          src={videoUrl}
          title={title}
          onContextMenu={handleVideoContextMenu}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (initialTimestamp > 0) {
              setVideoTimestamp(initialTimestamp);
            }
          }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;