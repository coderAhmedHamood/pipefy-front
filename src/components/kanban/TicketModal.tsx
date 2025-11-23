import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/config';
import { Ticket, Process, Stage, Activity, Priority } from '../../types/workflow';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleMove } from '../../hooks/useSimpleMove';
import { useSimpleDelete } from '../../hooks/useSimpleDelete';
import { useSimpleUpdate } from '../../hooks/useSimpleUpdate';
import { useAttachments } from '../../hooks/useAttachments';
import { CommentsSection } from '../comments/CommentsSection';
import ticketAssignmentService, { TicketAssignment } from '../../services/ticketAssignmentService';
import ticketReviewerService, { TicketReviewer } from '../../services/ticketReviewerService';
import ticketService from '../../services/ticketService';
import userService from '../../services/userService';
import commentService from '../../services/commentService';
import notificationService from '../../services/notificationService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useQuickNotifications } from '../ui/NotificationSystem';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useThemeColors, useTheme } from '../../contexts/ThemeContext';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  Flag, 
  MessageSquare, 
  Paperclip, 
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Plus,
  Upload,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Settings,
  Target,
  Activity as ActivityIcon,
  FileText,
  Tag,
  Link2,
  MoreVertical,
  Send,
  Copy,
  Share,
  Archive,
  Star,
  Bookmark,
  History,
  Users,
  Bell,
  Shield,
  Zap,
  RefreshCw,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Video,
  Pause,
  Volume2
} from 'lucide-react';
import { getPriorityLabel, getPriorityColor } from '../../utils/priorityUtils';

// مكون معاينة الصور للمرفقات
const AttachmentImagePreview: React.FC<{ 
  attachmentId: string; 
  filename: string;
  onClick?: () => void;
}> = ({ attachmentId, filename, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const fileUrl = `${API_BASE_URL}/api/attachments/${attachmentId}/download`;
        
        const response = await fetch(fileUrl, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setImageUrl(blobUrl);
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ خطأ في تحميل الصورة:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImage();
    
    // تنظيف blob URL عند إلغاء التحميل
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [attachmentId, imageUrl]);

  if (loading) {
    return (
      <div className="w-10 h-10 flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-10 h-10 flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
        <ImageIcon className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div 
      className="w-10 h-10 flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-300 transition-colors"
      onClick={onClick}
    >
      <img 
        src={imageUrl} 
        alt={filename}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
};

// مكون Modal لعرض الصورة الكاملة
const ImageViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  filename: string;
  onLoadImage?: () => Promise<string | null>;
}> = ({ isOpen, onClose, imageUrl, filename, onLoadImage }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const onLoadImageRef = useRef(onLoadImage);
  const imageUrlRef = useRef(imageUrl);

  // تحديث refs عند تغيير القيم
  useEffect(() => {
    onLoadImageRef.current = onLoadImage;
    imageUrlRef.current = imageUrl;
  }, [onLoadImage, imageUrl]);

  // تحميل الصورة عند فتح Modal
  useEffect(() => {
    if (!isOpen) {
      // تنظيف blob URL عند إغلاق Modal
      if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentImageUrl);
      }
      setCurrentImageUrl(null);
      setLoading(false);
      setError(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    // إذا كان Modal مفتوح، ابدأ تحميل الصورة
    let blobUrlToClean: string | null = null;
    let isCancelled = false;
    
    const loadImage = async () => {
      if (onLoadImageRef.current) {
        setLoading(true);
        setError(false);
        setCurrentImageUrl(null);
        
        try {
          const url = await onLoadImageRef.current();
          
          if (isCancelled) {
            if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
            return;
          }
          
          if (url) {
            blobUrlToClean = url;
            setCurrentImageUrl(url);
            setLoading(false);
          } else {
            console.error('⚠️ [ImageViewerModal] URL فارغ');
            setError(true);
            setLoading(false);
          }
        } catch (err) {
          if (isCancelled) return;
          console.error('❌ [ImageViewerModal] خطأ في تحميل الصورة:', err);
          setError(true);
          setLoading(false);
        }
      } else if (imageUrlRef.current) {
        setCurrentImageUrl(imageUrlRef.current);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadImage();
    
    // Cleanup function - تنظيف عند إغلاق Modal أو unmount
    return () => {
      isCancelled = true;
      if (blobUrlToClean && blobUrlToClean.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlToClean);
      }
    };
  }, [isOpen]); // فقط isOpen كـ dependency

  // معالجة السحب للصورة
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleZoomIn = () => {
    const newScale = Math.min(5, scale + 0.25);
    setScale(newScale);
  };
  
  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale - 0.25);
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };
  
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // إغلاق عند الضغط على ESC والتكبير بالعجلة
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        onClose();
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (!imageContainerRef.current) return;
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(5, scale + delta));
      
      if (newScale !== scale) {
        setScale(newScale);
        
        // تكبير نحو موضع الفأرة
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const scaleChange = newScale - scale;
        setPosition({
          x: position.x - (x - rect.width / 2) * (scaleChange / scale),
          y: position.y - (y - rect.height / 2) * (scaleChange / scale)
        });
      }
      
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    };
    
    const container = imageContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isOpen, onClose, scale, position]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
          title="إغلاق (ESC)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* اسم الملف */}
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-medium truncate max-w-md">{filename}</p>
        </div>

        {/* أزرار التكبير */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 space-x-reverse bg-black bg-opacity-50 rounded-lg p-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="تصغير"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="تكبير"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white bg-opacity-30 mx-1"></div>
          <button
            onClick={handleResetZoom}
            disabled={scale === 1}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="إعادة تعيين التكبير"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* الصورة */}
        <div 
          ref={imageContainerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {loading ? (
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">جاري تحميل الصورة...</p>
            </div>
          ) : error ? (
            <div className="text-white text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg">فشل في تحميل الصورة</p>
            </div>
          ) : currentImageUrl ? (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                transformOrigin: 'center center',
              }}
            >
              <img
                src={currentImageUrl}
                alt={filename}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
                draggable={false}
                onLoad={() => {
                }}
                onError={(e) => {
                  console.error('❌ [ImageViewerModal] فشل تحميل الصورة في <img>:', e);
                  setError(true);
                }}
              />
            </div>
          ) : null}
        </div>

        {/* تلميح الإغلاق */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          اضغط ESC أو اضغط خارج الصورة للإغلاق
        </div>
      </div>
    </div>
  );
};

// مكون Modal لعرض الفيديو
const VideoViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  filename: string;
  onLoadVideo?: () => Promise<string | null>;
}> = ({ isOpen, onClose, videoUrl, filename, onLoadVideo }) => {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onLoadVideoRef = useRef(onLoadVideo);
  const videoUrlRef = useRef(videoUrl);

  // تحديث refs عند تغيير القيم
  useEffect(() => {
    onLoadVideoRef.current = onLoadVideo;
    videoUrlRef.current = videoUrl;
  }, [onLoadVideo, videoUrl]);

  // تحميل الفيديو عند فتح Modal
  useEffect(() => {
    if (!isOpen) {
      // تنظيف blob URL عند إغلاق Modal
      if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoUrl);
      }
      setCurrentVideoUrl(null);
      setLoading(false);
      setError(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      return;
    }

    // إذا كان Modal مفتوح، ابدأ تحميل الفيديو
    let blobUrlToClean: string | null = null;
    let isCancelled = false;
    
    const loadVideo = async () => {
      if (onLoadVideoRef.current) {
        setLoading(true);
        setError(false);
        setCurrentVideoUrl(null);
        
        try {
          const url = await onLoadVideoRef.current();
          
          if (isCancelled) {
            if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
            return;
          }
          
          if (url) {
            blobUrlToClean = url;
            setCurrentVideoUrl(url);
            setLoading(false);
          } else {
            console.error('⚠️ [VideoViewerModal] URL فارغ');
            setError(true);
            setLoading(false);
          }
        } catch (err) {
          if (isCancelled) return;
          console.error('❌ [VideoViewerModal] خطأ في تحميل الفيديو:', err);
          setError(true);
          setLoading(false);
        }
      } else if (videoUrlRef.current) {
        setCurrentVideoUrl(videoUrlRef.current);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadVideo();
    
    // Cleanup function - تنظيف عند إغلاق Modal أو unmount
    return () => {
      isCancelled = true;
      if (blobUrlToClean && blobUrlToClean.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlToClean);
      }
    };
  }, [isOpen]);

  // معالجة أحداث الفيديو
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoUrl]);

  // معالجة Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // معالجة لوحة المفاتيح
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case ' ': // Spacebar
          e.preventDefault();
          if (isPlaying) {
            video.pause();
          } else {
            video.play();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!isFullscreen) {
            video.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, duration, volume, isFullscreen, onClose]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    video.volume = newVolume;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (!isFullscreen) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-7xl max-h-[95vh] w-full h-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
          title="إغلاق (ESC)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* اسم الملف */}
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-medium truncate max-w-md">{filename}</p>
        </div>

        {/* الفيديو */}
        <div className="w-full h-full flex items-center justify-center">
          {loading ? (
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">جاري تحميل الفيديو...</p>
            </div>
          ) : error ? (
            <div className="text-white text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg">فشل في تحميل الفيديو</p>
            </div>
          ) : currentVideoUrl ? (
            <div className="w-full max-w-5xl">
              <video
                ref={videoRef}
                src={currentVideoUrl}
                className="w-full h-auto rounded-lg shadow-2xl max-h-[80vh]"
                controls
                volume={volume}
                onError={(e) => {
                  console.error('❌ [VideoViewerModal] فشل تحميل الفيديو:', e);
                  setError(true);
                }}
              />
              
              {/* أزرار التحكم المخصصة */}
              <div className="mt-4 bg-black bg-opacity-50 rounded-lg p-4 text-white">
                <div className="flex items-center space-x-4 space-x-reverse mb-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title={isPlaying ? "إيقاف (Space)" : "تشغيل (Space)"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Volume2 className="w-4 h-4" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title="ملء الشاشة (F)"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 text-center">
                  <p>Space: تشغيل/إيقاف | ← →: رجوع/تقديم 10 ثواني | ↑ ↓: صوت | F: ملء الشاشة | ESC: إغلاق</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

interface TicketModalProps {
  ticket: Ticket;
  process: Process;
  onClose: () => void;
  onSave: (ticketData: Partial<Ticket>) => void;
  onMoveToStage: (stageId: string) => void;
  onDelete?: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  process,
  onClose,
  onSave,
  onMoveToStage,
  onDelete
}) => {
  const { getProcessUsers, processes } = useWorkflow();
  const { hasPermission, hasProcessPermission } = useAuth();
  const notifications = useQuickNotifications();
  const { moveTicket, isMoving } = useSimpleMove();
  const { deleteTicket, isDeleting } = useSimpleDelete();
  const { updateTicket, isUpdating } = useSimpleUpdate();
  const { isMobile, isTablet } = useDeviceType();
  const colors = useThemeColors();
  const { currentTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [transitionType, setTransitionType] = useState<'single' | 'multiple'>('single');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAttachmentConfirm, setShowDeleteAttachmentConfirm] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; status: 'uploading' | 'success' | 'error' }[]>([]);
  const [viewingImage, setViewingImage] = useState<{ id: string; filename: string } | null>(null);
  const [viewingVideo, setViewingVideo] = useState<{ id: string; filename: string } | null>(null);
  
  // حالات الإسنادات والمراجعين
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [reviewers, setReviewers] = useState<TicketReviewer[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddReviewer, setShowAddReviewer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState('');
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // حالات نقل إلى عملية
  const [showProcessSelector, setShowProcessSelector] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [isMovingToProcess, setIsMovingToProcess] = useState(false);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  
  // Tabs للجوال
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'attachments' | 'stages'>('info');

  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description || '',
    priority: ticket.priority,
    due_date: ticket.due_date || '',
    assigned_to: ticket.assigned_to || '',
    data: { ...ticket.data }
  });

  // استخدام hook المرفقات
  const { attachments, isLoading: attachmentsLoading, refreshAttachments } = useAttachments(ticket.id);

  // جلب الإسنادات والمراجعين عند فتح التذكرة
  useEffect(() => {
    loadAssignments();
    loadReviewers();
  }, [ticket.id]);

  // جلب المستخدمين عند فتح Modal إضافة مستخدم أو مراجع
  useEffect(() => {
    if (showAddAssignment || showAddReviewer) {
      loadAllUsers();
    }
  }, [showAddAssignment, showAddReviewer]);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAssignmentDropdown && !target.closest('.assignment-search-container')) {
        setShowAssignmentDropdown(false);
      }
      if (showReviewerDropdown && !target.closest('.reviewer-search-container')) {
        setShowReviewerDropdown(false);
      }
    };

    if (showAssignmentDropdown || showReviewerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAssignmentDropdown, showReviewerDropdown]);

  // جلب العمليات عند فتح Modal نقل إلى عملية
  useEffect(() => {
    if (showProcessSelector) {
      loadAllProcesses();
    }
  }, [showProcessSelector]);



  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await userService.getAllUsers({ per_page: 100 });
      
      if (response.success && response.data) {
        const users = response.data;
        setAllUsers(users);
      } else {
        console.error('❌ فشل في جلب المستخدمين');
        setAllUsers([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      setAllUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadAllProcesses = async () => {
    setIsLoadingProcesses(true);
    try {
      // استخدام processes من WorkflowContext (متوفر بالفعل)
      if (processes && processes.length > 0) {
        setAllProcesses(processes);
      } else {
        console.error('❌ لا توجد عمليات');
        setAllProcesses([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب العمليات:', error);
      setAllProcesses([]);
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const loadAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await ticketAssignmentService.getTicketAssignments(ticket.id);
      if (response.success && response.data) {
        setAssignments(response.data);
      }
    } catch (error) {
      console.error('خطأ في جلب الإسنادات:', error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const loadReviewers = async () => {
    setIsLoadingReviewers(true);
    try {
      const response = await ticketReviewerService.getTicketReviewers(ticket.id);
      if (response.success && response.data) {
        setReviewers(response.data);
      }
    } catch (error) {
      console.error('خطأ في جلب المراجعين:', error);
    } finally {
      setIsLoadingReviewers(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedUserId) return;
    
    try {
      const response = await ticketAssignmentService.assignUser({
        ticket_id: ticket.id,
        user_id: selectedUserId,
        role: assignmentRole || undefined,
        notes: assignmentNotes || undefined
      });
      
      if (response.success) {
        await loadAssignments();
        setShowAddAssignment(false);
        setSelectedUserId('');
        setAssignmentRole('');
        setAssignmentNotes('');
        setAssignmentSearchQuery('');
        setShowAssignmentDropdown(false);
      }
    } catch (error) {
      console.error('خطأ في إضافة الإسناد:', error);
      alert('فشل في إضافة الإسناد');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإسناد؟')) return;
    
    try {
      const response = await ticketAssignmentService.deleteAssignment(assignmentId);
      if (response.success) {
        await loadAssignments();
      }
    } catch (error) {
      console.error('خطأ في حذف الإسناد:', error);
      alert('فشل في حذف الإسناد');
    }
  };

  const handleAddReviewer = async () => {
    if (!selectedUserId) return;
    
    try {
      const response = await ticketReviewerService.addReviewer({
        ticket_id: ticket.id,
        reviewer_id: selectedUserId,
        review_notes: reviewerNotes || undefined
      });
      
      if (response.success) {
        await loadReviewers();
        setShowAddReviewer(false);
        setSelectedUserId('');
        setReviewerNotes('');
        setReviewerSearchQuery('');
        setShowReviewerDropdown(false);
      }
    } catch (error) {
      console.error('خطأ في إضافة المراجع:', error);
      alert('فشل في إضافة المراجع');
    }
  };

  const handleRemoveReviewer = async (reviewerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المراجع؟')) return;
    
    try {
      const response = await ticketReviewerService.deleteReviewer(reviewerId);
      if (response.success) {
        await loadReviewers();
      }
    } catch (error) {
      console.error('خطأ في حذف المراجع:', error);
      alert('فشل في حذف المراجع');
    }
  };

  const handleUpdateReviewStatus = async (reviewerId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped') => {
    try {
      const response = await ticketReviewerService.updateReviewStatus(reviewerId, {
        review_status: status
      });
      
      if (response.success) {
        await loadReviewers();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المراجعة:', error);
      alert('فشل في تحديث حالة المراجعة');
    }
  };

  const handleUpdateReviewRate = async (reviewerId: string, rate: 'ضعيف' | 'جيد' | 'جيد جدا' | 'ممتاز') => {
    try {
      const response = await ticketReviewerService.updateReviewStatus(reviewerId, {
        review_status: 'completed',
        rate: rate
      });
      
      if (response.success) {
        await loadReviewers();
        notifications.showSuccess('تم تحديث التقييم بنجاح!', `تم تقييم المراجع بـ "${rate}"`);
      }
    } catch (error) {
      console.error('خطأ في تحديث التقييم:', error);
      notifications.showError('فشل في تحديث التقييم', 'حدث خطأ أثناء حفظ التقييم');
    }
  };

  const handleMoveToProcess = async () => {
    if (!selectedProcessId || isMovingToProcess) return;
    
    try {
      setIsMovingToProcess(true);
      
      const response = await ticketService.moveTicketToProcess(ticket.id, selectedProcessId);
      
      if (response.success) {
        alert('تم نقل التذكرة إلى العملية الجديدة بنجاح!');
        setShowProcessSelector(false);
        setSelectedProcessId('');
        onClose(); // إغلاق Modal التذكرة
        // يمكن إضافة refresh للصفحة أو تحديث الـ state
        window.location.reload();
      } else {
        console.error('❌ فشل في نقل التذكرة');
        alert('فشل في نقل التذكرة: ' + (response.message || 'خطأ غير معروف'));
      }
    } catch (error: any) {
      console.error('❌ خطأ في نقل التذكرة:', error);
      alert('حدث خطأ أثناء نقل التذكرة: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsMovingToProcess(false);
    }
  };

  // الحصول على المرحلة الحالية
  const currentStage = process.stages.find(s => s.id === ticket.current_stage_id);
  
  // الحصول على المراحل المسموحة للانتقال إليها
  const allowedStages = process.stages.filter(stage => 
    currentStage?.allowed_transitions?.includes(stage.id)
  );

  // ترتيب المراحل حسب الأولوية
  const sortedStages = [...process.stages].sort((a, b) => a.priority - b.priority);

  const handleSave = async () => {
    // استخدام handleUpdate للحفظ عبر API
    await handleUpdate();
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    const success = await deleteTicket(ticket.id);

    if (success) {

      // إشعار المكون الأب (KanbanBoard) بالحذف لتحديث الواجهة فوراً
      if (onDelete) {
        try {
          onDelete();
        } catch (error) {
          console.error('❌ خطأ في استدعاء onDelete:', error);
        }
      } else {
        console.error('❌ onDelete callback غير متوفر!');
      }

      // إغلاق مربع التأكيد
      setShowDeleteConfirm(false);
    } else {
      console.error('❌ فشل في حذف التذكرة من API');
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (isDeletingAttachment) return;

    setIsDeletingAttachment(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();

        // إعادة تحميل المرفقات لتحديث القائمة
        await refreshAttachments();

        setShowDeleteAttachmentConfirm(false);
        setAttachmentToDelete(null);
      } else {
        const errorData = await response.json();

        // رسالة خطأ مفصلة
        let errorMessage = errorData.message || 'خطأ غير معروف';
        if (response.status === 403) {
          errorMessage += '\n\nتأكد من أنك مسجل دخول بحساب له صلاحيات حذف المرفقات (مثل admin@pipefy.com)';
        }

        alert(`فشل في حذف المرفق: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ خطأ في حذف المرفق:', error);
      alert('حدث خطأ أثناء حذف المرفق');
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  const handleUploadAttachment = async (files: FileList) => {
    if (isUploadingAttachment || files.length === 0) return;


    setIsUploadingAttachment(true);
    setUploadProgress(0);

    // تهيئة قائمة الملفات الجارية رفعها
    const filesList = Array.from(files);
    setUploadingFiles(filesList.map(file => ({ 
      name: file.name, 
      progress: 0, 
      status: 'uploading' as const 
    })));

    try {
      const token = localStorage.getItem('auth_token');

      // إنشاء FormData للملفات
      const formData = new FormData();

      // إضافة الملفات إلى FormData
      filesList.forEach((file) => {
        formData.append('files', file);
      });

      // إضافة وصف اختياري للمرفقات
      formData.append('description', `مرفقات للتذكرة: ${ticket.title}`);

      // استخدام XMLHttpRequest لتتبع التقدم
      const xhr = new XMLHttpRequest();

      // تتبع التقدم للرفع الكلي
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const totalProgress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(totalProgress);
          
          // تحديث التقدم لكل ملف بشكل متساوٍ
          const progressPerFile = totalProgress / filesList.length;
          setUploadingFiles(prev => prev.map((file, index) => ({
            ...file,
            progress: Math.min(100, Math.round(progressPerFile * (index + 1)))
          })));
        }
      });

      // معالجة الاستجابة
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);

            // تحديث حالة جميع الملفات إلى نجاح
            setUploadingFiles(prev => prev.map(file => ({ ...file, progress: 100, status: 'success' as const })));

            // إعادة تحميل المرفقات لتحديث القائمة
            await refreshAttachments();

            // إظهار رسالة نجاح
            notifications.showSuccess(
              'تم الرفع بنجاح', 
              `تم رفع ${filesList.length} مرفق بنجاح!`
            );

            // إزالة قائمة الملفات بعد ثانيتين
            setTimeout(() => {
              setUploadingFiles([]);
              setIsUploadingAttachment(false);
              setUploadProgress(0);
            }, 2000);

          } catch (parseError) {
            console.error('❌ خطأ في تحليل الاستجابة:', parseError);
            setUploadingFiles(prev => prev.map(file => ({ ...file, status: 'error' as const })));
            notifications.showError('خطأ في الرفع', 'فشل في معالجة استجابة الخادم');
            setTimeout(() => {
              setUploadingFiles([]);
              setIsUploadingAttachment(false);
            }, 3000);
          }
        } else {
          // خطأ في الرفع
          let errorMessage = 'خطأ غير معروف';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = xhr.statusText || `خطأ ${xhr.status}`;
          }

          // تحديث حالة جميع الملفات إلى خطأ
          setUploadingFiles(prev => prev.map(file => ({ ...file, status: 'error' as const })));

          notifications.showError('فشل الرفع', errorMessage);

          setTimeout(() => {
            setUploadingFiles([]);
            setIsUploadingAttachment(false);
            setUploadProgress(0);
          }, 3000);
        }
      });

      // معالجة الأخطاء
      xhr.addEventListener('error', () => {
        console.error('❌ خطأ في رفع المرفقات');
        setUploadingFiles(prev => prev.map(file => ({ ...file, status: 'error' as const })));
        notifications.showError('خطأ في الرفع', 'حدث خطأ أثناء رفع المرفقات');
        setTimeout(() => {
          setUploadingFiles([]);
          setIsUploadingAttachment(false);
          setUploadProgress(0);
        }, 3000);
      });

      // إرسال الطلب
      xhr.open('POST', `${API_BASE_URL}/api/tickets/${ticket.id}/attachments`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('❌ خطأ في رفع المرفقات:', error);
      setUploadingFiles(prev => prev.map(file => ({ ...file, status: 'error' as const })));
      notifications.showError('خطأ في الرفع', 'حدث خطأ غير متوقع');
      setTimeout(() => {
        setUploadingFiles([]);
        setIsUploadingAttachment(false);
        setUploadProgress(0);
      }, 3000);
    }
  };

  // دالة مساعدة لإنشاء نص التعليق بناءً على التغييرات
  const generateChangeComment = () => {
    const changes: string[] = [];
    
    // مقارنة العنوان - التحقق من أن القيم مختلفة فعلياً
    const oldTitle = (ticket.title || '').trim();
    const newTitle = (formData.title || '').trim();
    if (oldTitle !== newTitle && oldTitle && newTitle) {
      changes.push(`📝 تم تغيير العنوان من: "${oldTitle}" إلى: "${newTitle}"`);
    }
    
    // مقارنة الوصف - التحقق من أن القيم مختلفة فعلياً
    const oldDescription = (ticket.description || '').trim();
    const newDescription = (formData.description || '').trim();
    if (oldDescription !== newDescription && (oldDescription || newDescription)) {
      changes.push(`📄 تم تحديث الوصف`);
    }
    
    // مقارنة الأولوية - التحقق من أن القيم مختلفة فعلياً
    if (ticket.priority && formData.priority && ticket.priority !== formData.priority) {
      const priorityLabels: Record<string, string> = {
        low: 'منخفض',
        medium: 'متوسط',
        high: 'عالي',
        urgent: 'عاجل'
      };
      const oldPriority = priorityLabels[ticket.priority] || ticket.priority;
      const newPriority = priorityLabels[formData.priority] || formData.priority;
      if (oldPriority !== newPriority) {
        changes.push(`🚩 تم تغيير الأولوية من: "${oldPriority}" إلى: "${newPriority}"`);
      }
    }
    
    // مقارنة تاريخ الاستحقاق - التحقق من أن القيم مختلفة فعلياً
    const oldDueDate = ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : null;
    const newDueDate = formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : null;
    
    // فقط إذا كانت القيم مختلفة فعلياً (وليس كلاهما null/undefined)
    if (oldDueDate !== newDueDate && (oldDueDate || newDueDate)) {
      const oldDateStr = oldDueDate ? new Date(ticket.due_date).toLocaleDateString('ar-SA') : 'غير محدد';
      const newDateStr = newDueDate ? new Date(formData.due_date).toLocaleDateString('ar-SA') : 'غير محدد';
      // فقط إذا كانت القيم النصية مختلفة
      if (oldDateStr !== newDateStr) {
        changes.push(`📅 تم تغيير تاريخ الاستحقاق من: ${oldDateStr} إلى: ${newDateStr}`);
      }
    }
    
    // مقارنة الحقول المخصصة - التحقق من أن القيم مختلفة فعلياً
    if (ticket.data && formData.data) {
      Object.keys(formData.data).forEach(key => {
        const oldValue = ticket.data[key];
        const newValue = formData.data[key];
        
        // التحقق من أن القيم مختلفة فعلياً
        if (oldValue !== newValue) {
          // التحقق من أن القيم ليست فارغة أو null بنفس الطريقة
          const oldValueStr = oldValue !== null && oldValue !== undefined && oldValue !== '' ? String(oldValue).trim() : '';
          const newValueStr = newValue !== null && newValue !== undefined && newValue !== '' ? String(newValue).trim() : '';
          
          // فقط إذا كانت القيم مختلفة فعلياً
          if (oldValueStr !== newValueStr && (oldValueStr || newValueStr)) {
            changes.push(`🔧 تم تحديث الحقل "${key}"`);
          }
        }
      });
    }
    
    // إذا لم يكن هناك تغييرات فعلية، لا ننشئ تعليق
    if (changes.length === 0) {
      return null;
    }
    
    // الحصول على اسم المستخدم الحالي
    const userData = localStorage.getItem('user_data');
    let userName = 'مستخدم';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userName = user.name || user.email || 'مستخدم';
      } catch (e) {
        console.error('خطأ في قراءة بيانات المستخدم:', e);
      }
    }
    
    return `✏️ تم تعديل التذكرة بواسطة: ${userName}\n\n${changes.join('\n')}`;
  };

  const handleUpdate = async () => {
    if (isUpdating) return;


    // إعداد البيانات للتحديث
    const updateData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      due_date: formData.due_date,
      data: formData.data
    };

    const success = await updateTicket(ticket.id, updateData);
    if (success) {

      // إنشاء تعليق تلقائي يوضح التغييرات
      try {
        const commentContent = generateChangeComment();
        if (commentContent) {
          await commentService.createComment(ticket.id, {
            content: commentContent,
            is_internal: false
          });
        }
      } catch (error) {
        console.error('❌ خطأ في إضافة التعليق التلقائي:', error);
        // نستمر في العملية حتى لو فشل التعليق
      }

      // إرسال إشعارات للمستخدمين المسندين والمراجعين
      try {
        // جمع جميع المستخدمين المعنيين
        const userIds: string[] = [];
        
        // إضافة المستخدم المسند الأساسي
        if (ticket.assigned_to) {
          userIds.push(ticket.assigned_to);
        }
        
        // إضافة المستخدمين المسندين من assignments
        assignments.forEach(assignment => {
          if (assignment.user_id && !userIds.includes(assignment.user_id)) {
            userIds.push(assignment.user_id);
          }
        });
        
        // إضافة المراجعين
        reviewers.forEach(reviewer => {
          if (reviewer.reviewer_id && !userIds.includes(reviewer.reviewer_id)) {
            userIds.push(reviewer.reviewer_id);
          }
        });
        
        // إضافة المراجعين الجدد من formData إذا تم تحديثهم
        if (formData.data) {
          const reviewersField = ticket.custom_fields?.find(f => 
            (f.field_type === 'ticket_reviewer' || f.type === 'ticket_reviewer') && 
            formData.data[f.id]
          );
          
          if (reviewersField && formData.data[reviewersField.id]) {
            const newReviewerIds = Array.isArray(formData.data[reviewersField.id])
              ? formData.data[reviewersField.id]
              : [formData.data[reviewersField.id]];
            
            newReviewerIds.forEach((reviewerId: string) => {
              if (reviewerId && !userIds.includes(reviewerId)) {
                userIds.push(reviewerId);
              }
            });
          }
        }
        
        // إرسال الإشعارات فقط إذا كان هناك مستخدمين
        if (userIds.length > 0) {
          const changes = generateChangeComment();
          const notificationMessage = changes 
            ? `تم تحديث التذكرة "${formData.title || ticket.title}":\n${changes}`
            : `تم تحديث التذكرة "${formData.title || ticket.title}"`;
          
          await notificationService.sendBulkNotification({
            user_ids: userIds,
            title: `تحديث التذكرة: ${formData.title || ticket.title}`,
            message: notificationMessage,
            notification_type: 'ticket_updated',
            action_url: `/tickets/${ticket.id}`,
            data: {
              ticket_id: ticket.id,
              ticket_title: formData.title || ticket.title,
              changes: formData,
              updated_fields: Object.keys(updateData).filter(key => 
                updateData[key as keyof typeof updateData] !== undefined
              )
            }
          });
          
        }
      } catch (error) {
        console.error('❌ خطأ في إرسال الإشعارات:', error);
        // نستمر في العملية حتى لو فشل إرسال الإشعارات
      }

      // تحديث البيانات المحلية فوراً
      Object.assign(ticket, formData);

      // تحديث البيانات في المكون الأب
      onSave(formData);
      setIsEditing(false);

    } else {
      console.error('❌ فشل في تحديث التذكرة من API');
    }
  };

  const handleStageMove = async () => {
    if (isMoving) return;

    if (transitionType === 'single' && selectedStages.length === 1) {
      const success = await moveTicket(ticket.id, selectedStages[0]);
      if (success) {
        // تحديث الـ state في KanbanBoard فوراً
        onMoveToStage(selectedStages[0]);
        setShowStageSelector(false);
        setSelectedStages([]);
      }
    } else if (transitionType === 'multiple' && selectedStages.length > 0) {
      // للانتقال المتعدد، نختار أول مرحلة كمثال
      const success = await moveTicket(ticket.id, selectedStages[0]);
      if (success) {
        // تحديث الـ state في KanbanBoard فوراً
        onMoveToStage(selectedStages[0]);
        setShowStageSelector(false);
        setSelectedStages([]);
      }
    }
  };



  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldId]: value
      }
    }));
  };

  const processUsers = getProcessUsers(process.id);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="w-4 h-4 text-blue-500" />;
      case 'stage_changed': return <ArrowRight className="w-4 h-4" style={{ color: colors.primary }} />;
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'field_updated': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'priority_changed': return <Flag className="w-4 h-4 text-red-500" />;
      case 'due_date_changed': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'reviewer_assigned': return <User className="w-4 h-4 text-indigo-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4" style={{ color: colors.primary }} />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // تحديد التاريخ المرجعي (تاريخ الإكمال إن وجد، وإلا التاريخ الحالي)
  const referenceDate = ticket.completed_at ? new Date(ticket.completed_at) : new Date();
  
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < referenceDate;
  const isDueSoon = ticket.due_date && 
    new Date(ticket.due_date) > referenceDate && 
    new Date(ticket.due_date) < new Date(referenceDate.getTime() + 2 * 24 * 60 * 60 * 1000);

  // حساب الفارق بالأيام
  const calculateDaysDifference = () => {
    if (!ticket.due_date) return null;
    
    const dueDate = new Date(ticket.due_date);
    
    // إذا كانت التذكرة مكتملة، نحسب الفرق بين موعد الإكمال وموعد الاستحقاق
    if (ticket.completed_at) {
      const completedDate = new Date(ticket.completed_at);
      const diffTime = dueDate.getTime() - completedDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays; // موجب = تم الإكمال قبل الموعد، سالب = متأخر
    }
    
    // إذا لم تكن مكتملة، نحسب الفرق بين التاريخ الحالي وموعد الاستحقاق
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysDifference = calculateDaysDifference();

  return (
    <>
    <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 ${isMobile || isTablet ? 'p-0' : 'p-4'}`} dir="rtl">
      <div className={`bg-white shadow-2xl w-full overflow-hidden ${isMobile || isTablet ? 'h-full rounded-none' : 'rounded-xl max-w-7xl max-h-[95vh]'}`}>
        {/* Header */}
        <div 
          className={`text-white ${isMobile || isTablet ? 'p-3' : 'p-6'}`}
          style={{ 
            backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
          }}
        >
          <div className={`flex ${isMobile || isTablet ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
            <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
              <div className={`${isMobile || isTablet ? 'w-10 h-10' : 'w-12 h-12'} ${currentStage?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className={`text-white font-bold ${isMobile || isTablet ? 'text-base' : 'text-lg'}`}>{process.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold truncate`}>{isEditing ? formData.title : ticket.title}</h1>
                <div className={`flex items-center ${isMobile || isTablet ? 'flex-wrap gap-1 mt-1' : 'space-x-3 space-x-reverse'} text-blue-100`}>
                  <span className="truncate">{process.name}</span>
                  <span>•</span>
                  <span className="truncate">{currentStage?.name}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    ticket.priority === 'urgent' ? 'bg-red-500' :
                    ticket.priority === 'high' ? 'bg-orange-500' :
                    ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* أزرار الإجراءات */}
            <div className={`flex items-center ${isMobile || isTablet ? 'justify-between w-full gap-2' : 'space-x-3 space-x-reverse'}`}>
              {isMobile || isTablet ? (
                <>
                  {allowedStages.length > 0 && (
                    <button
                      onClick={() => setShowStageSelector(true)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 px-2 py-1.5 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse shadow-sm text-xs flex-1 justify-center"
                      style={{ 
                        color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                      }}
                      title="نقل إلى مرحلة"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>نقل</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowProcessSelector(true)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 px-2 py-1.5 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse shadow-sm text-xs flex-1 justify-center"
                      style={{ 
                        color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                      }}
                      title="نقل إلى عملية"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>عملية</span>
                  </button>

                  {hasProcessPermission('tickets', 'update', process.id) && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1.5 rounded-lg transition-colors shadow-sm"
                      style={{ 
                        color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                      }}
                      title={isEditing ? "إلغاء التعديل" : "تعديل التذكرة"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}

                  {hasProcessPermission('tickets', 'delete', process.id) && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className={`bg-[#EF5350] bg-opacity-90 hover:bg-opacity-100 text-white p-1.5 rounded-lg transition-colors shadow-sm ${
                        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="حذف التذكرة"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1.5 rounded-lg transition-colors shadow-sm"
                      style={{ 
                        color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                      }}
                      title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* {allowedStages.length > 0 && (
                    <button
                      onClick={() => setShowStageSelector(true)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse shadow-sm"
                      style={{ 
                        color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>نقل إلى مرحلة</span>
                    </button>
                  )} */}
                  
                  <button
                    onClick={() => setShowProcessSelector(true)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse shadow-sm"
                    style={{ 
                      color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>نقل إلى عملية</span>
                  </button>





                  {hasProcessPermission('tickets', 'update', process.id) && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-lg transition-colors shadow-sm"
                      style={{ 
                        color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark 
                      }}
                      title={isEditing ? "إلغاء التعديل" : "تعديل التذكرة"}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}

                  {hasProcessPermission('tickets', 'delete', process.id) && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className={`bg-[#EF5350] bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-lg transition-colors shadow-sm ${
                        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="حذف التذكرة"
                    >
                      {isDeleting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-[#006D5B] p-2 rounded-lg transition-colors shadow-sm"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs للجوال */}
        {(isMobile || isTablet) && (
          <div className="bg-white border-b border-gray-200 flex overflow-x-auto sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline ml-1" />
              المعلومات
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline ml-1" />
              التعليقات
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attachments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Paperclip className="w-4 h-4 inline ml-1" />
              المرفقات
            </button>
            <button
              onClick={() => setActiveTab('stages')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'stages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="w-4 h-4 inline ml-1" />
              المراحل
            </button>
          </div>
        )}

        <div className={`flex ${isMobile || isTablet ? 'h-[calc(100vh-180px)] flex-col' : 'h-[calc(95vh-120px)]'}`}>
          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} ${isMobile || isTablet ? 'space-y-4' : 'space-y-6'}`}>
            {/* Basic Info */}
            {((isMobile || isTablet) && activeTab !== 'info') ? null : (
            <div className={`bg-white border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
                  <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>معلومات أساسية</h3>
                </div>
                
                {/* أزرار الحفظ والإلغاء للجوال - في الأعلى */}
                {isEditing && (isMobile || isTablet) && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      style={{
                        background: `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`,
                      }}
                      className="text-white py-1.5 px-3 text-xs rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1 space-x-reverse font-medium"
                      disabled={isUpdating}
                    >
                      <Save className="w-3 h-3" />
                      <span>{isUpdating ? 'جاري الحفظ...' : 'حفظ'}</span>
                    </button>
                    
                    <button
                      onClick={() => setIsEditing(false)}
                      className="border border-gray-300 text-gray-700 py-1.5 px-3 text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1 space-x-reverse"
                    >
                      <X className="w-3 h-3" />
                      <span>إلغاء</span>
                    </button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className={`${isMobile || isTablet ? 'space-y-3' : 'space-y-4'}`}>
                  <div>
                    <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>العنوان</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>الوصف</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={isMobile || isTablet ? 3 : 4}
                      className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                    />
                  </div>
                  
                  <div className={`grid ${isMobile || isTablet ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} ${isMobile || isTablet ? 'gap-3' : 'gap-4'}`}>
                    <div>
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>الأولوية</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                        className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="low">منخفض</option>
                        <option value="medium">متوسط</option>
                        <option value="high">عاجل</option>
                        <option value="urgent">عاجل جداً</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>تاريخ الاستحقاق</label>
                      <input
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${isMobile || isTablet ? 'space-y-3' : 'space-y-4'}`}>
                  <div>
                    <h4 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-2`}>الوصف</h4>
                    <p className={`text-gray-700 leading-relaxed ${isMobile || isTablet ? 'text-sm' : ''}`}>
                      {ticket.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  
                  <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Flag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">الأولوية:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </div>
                    
                    {ticket.due_date && (
                      <div className={`flex items-center space-x-2 space-x-reverse ${
                        isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">موعد الإنتهاء:</span>
                        <span className="text-sm font-medium">
                          {formatDate(ticket.due_date)}
                        </span>
                        {daysDifference !== null && (
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            daysDifference < 0 ? 'bg-red-100 text-red-800' :
                            daysDifference === 0 ? 'bg-yellow-100 text-yellow-800' :
                            daysDifference <= 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.completed_at ? (
                              // إذا كانت مكتملة
                              daysDifference < 0 ? `متأخر ${Math.abs(daysDifference)} يوم` : 
                              daysDifference === 0 ? 'تم في الموعد' :
                              `متبقي ${daysDifference} يوم`
                            ) : (
                              // إذا لم تكن مكتملة
                              daysDifference < 0 ? `متأخر ${Math.abs(daysDifference)} يوم` : 
                              daysDifference === 0 ? 'ينتهي اليوم' :
                              `${daysDifference} يوم متبقي`
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">تم الإنشاء:</span>
                      <span className="text-sm font-medium">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* عرض تاريخ الإكمال فقط إذا كانت التذكرة في مرحلة نهائية */}
                  {currentStage?.is_final && ticket.completed_at && (
                    <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }}>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-6 h-6" style={{ color: colors.primary }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>تم إكمال التذكرة</span>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${colors.primary}30`, color: colors.primaryDark }}>مكتملة</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse mt-1 text-sm" style={{ color: colors.primaryDark }}>
                            <Clock className="w-4 h-4" />
                            <span>تاريخ الإكمال:</span>
                            <span className="font-medium">
                              {formatDateTime(ticket.completed_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Custom Fields */}
            {((isMobile || isTablet) && activeTab !== 'info') ? null : (
              process.fields.length > 0 && (
              <div className={`bg-white border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <Settings className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: colors.primary }} />
                  <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>حقول {process.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {process.fields
                    .filter(field => !field.is_system_field)
                    .map((field) => {
                    const fieldType = (field as any).field_type || field.type || 'text';
                    const value = formData.data[field.id];
                    const fieldName = field.name || (field as any).label || '';
                    
                    return (
                      <div key={field.id} className={`space-y-2 ${
                        fieldType === 'textarea' || fieldType === 'multiselect' || fieldType === 'radio' ? 'md:col-span-2' : ''
                      }`}>
                        <label className="block text-sm font-medium text-gray-700">
                          {fieldName}
                          {field.is_required && <span className="text-red-500 mr-1">*</span>}
                        </label>
                        
                        {isEditing ? (
                          <>
                            {fieldType === 'text' && (
                              <input
                                type="text"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={(field as any).placeholder || `أدخل ${fieldName}...`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {fieldType === 'email' && (
                              <input
                                type="email"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={(field as any).placeholder || "example@domain.com"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {fieldType === 'number' && (
                              <input
                                type="number"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                                placeholder={(field as any).placeholder || `أدخل ${fieldName}...`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {fieldType === 'textarea' && (
                              <textarea
                                rows={3}
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={(field as any).placeholder || `أدخل ${fieldName}...`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                            )}
                            
                            {fieldType === 'phone' && (
                              <input
                                type="tel"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={(field as any).placeholder || "+966 50 123 4567"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {fieldType === 'date' && (
                              <input
                                type="date"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {fieldType === 'datetime' && (
                              <input
                                type="datetime-local"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {fieldType === 'select' && (
                              <select
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر {fieldName}</option>
                                {((field.options as any)?.choices || field.options || []).map((option: any, index: number) => {
                                  const optionValue = option.value !== undefined ? option.value : (option.id || index);
                                  const optionLabel = option.label || option.name || optionValue;
                                  return (
                                    <option key={option.id || index} value={optionValue}>
                                      {optionLabel}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                            
                            {fieldType === 'multiselect' && field.options && (
                              <div className="space-y-2">
                                {((field.options as any)?.choices || field.options || []).map((option: any, index: number) => {
                                  const optionValue = option.value !== undefined ? option.value : (option.id || index);
                                  const optionLabel = option.label || option.name || optionValue;
                                  return (
                                    <label key={option.id || index} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={
                                          Array.isArray(value) 
                                            ? value.includes(optionValue)
                                            : false
                                        }
                                        onChange={(e) => {
                                          const currentValues = Array.isArray(value) ? value : [];
                                          if (e.target.checked) {
                                            handleFieldChange(field.id, [...currentValues, optionValue]);
                                          } else {
                                            handleFieldChange(field.id, currentValues.filter((v: any) => v !== optionValue));
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                      />
                                      <span className="mr-2 text-sm text-gray-700">{optionLabel}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            
                            {fieldType === 'radio' && field.options && (
                              <div className="space-y-2">
                                {((field.options as any)?.choices || field.options || []).map((option: any, index: number) => {
                                  const optionValue = option.value !== undefined ? option.value : (option.id || index);
                                  const optionLabel = option.label || option.name || optionValue;
                                  return (
                                    <label key={option.id || index} className="flex items-center">
                                      <input
                                        type="radio"
                                        name={`field-${field.id}`}
                                        value={optionValue}
                                        checked={value === optionValue}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        className="text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                      />
                                      <span className="mr-2 text-sm text-gray-700">{optionLabel}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            
                            {fieldType === 'file' && (
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // إنشاء كائن ملف مؤقت
                                      const fileObject = {
                                        name: file.name,
                                        size: file.size,
                                        type: file.type,
                                        url: URL.createObjectURL(file),
                                        file: file // الملف الفعلي للرفع لاحقاً
                                      };
                                      handleFieldChange(field.id, fileObject);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  accept="*/*"
                                />
                                {value && typeof value === 'object' && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2 space-x-reverse">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium">{value.name}</span>
                                        <span className="text-xs text-gray-500">
                                          ({(value.size / 1024).toFixed(1)} KB)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleFieldChange(field.id, null)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="حذف الملف"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {fieldType === 'ticket_reviewer' && (
                              <div className="space-y-2">
                                <select
                                  value={value || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">اختر المراجع</option>
                                  {(allUsers.length > 0 ? allUsers : processUsers).map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name} - {user.role.name}
                                    </option>
                                  ))}
                                </select>
                                
                                {value && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                          {processUsers.find(u => u.id === value)?.name.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium text-blue-900">
                                          {processUsers.find(u => u.id === value)?.name}
                                        </div>
                                        <div className="text-sm text-blue-700">
                                          {processUsers.find(u => u.id === value)?.role.name}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-900">
                            {fieldType === 'ticket_reviewer' && value ? (
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {processUsers.find(u => u.id === value)?.name.charAt(0)}
                                  </span>
                                </div>
                                <span>{processUsers.find(u => u.id === value)?.name}</span>
                              </div>
                            ) : fieldType === 'multiselect' && Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-2">
                                {value.map((val: any, idx: number) => {
                                  const option = ((field.options as any)?.choices || field.options || []).find((o: any) => 
                                    (o.value !== undefined ? o.value : o.id) === val
                                  );
                                  return (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                      {option?.label || option?.name || val}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : fieldType === 'select' ? (
                              ((field.options as any)?.choices || field.options || []).find((o: any) => 
                                (o.value !== undefined ? o.value : o.id) === value
                              )?.label || value || 'غير محدد'
                            ) : fieldType === 'file' && value && typeof value === 'object' ? (
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <a
                                  href={value.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  {value.name}
                                </a>
                                <span className="text-xs text-gray-500">
                                  ({(value.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                            ) : (
                              typeof value === 'object' ? JSON.stringify(value) : (value || 'غير محدد')
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              )
            )}


            {/* Assignments & Reviewers Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المستخدمين المُسندين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse`}>
                      <Users className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
                      <span>المستخدمين المُسندين ({assignments.length})</span>
                    </h3>
                    {hasProcessPermission('ticket_assignees', 'create', process.id) && (
                      <button
                        onClick={() => setShowAddAssignment(true)}
                        className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                        title="إضافة مستخدم"
                      >
                        <Plus className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                      </button>
                    )}
                  </div>

                  <div className={`space-y-2 ${isMobile || isTablet ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
                    {isLoadingAssignments ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs">جاري التحميل...</p>
                      </div>
                    ) : assignments.length > 0 ? (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {assignment.user_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-blue-900">{assignment.user_name || 'مستخدم'}</div>
                              <div className="text-xs text-blue-700">
                                {assignment.role && <span className="bg-blue-200 px-2 py-0.5 rounded">{assignment.role}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="حذف"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا يوجد مستخدمين مُسندين</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* المراجعين */}
                {hasProcessPermission('ticket_reviewers', 'view', process.id) && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse`}>
                        <Shield className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: colors.primary }} />
                        <span>المراجعين ({reviewers.length})</span>
                      </h3>
                      {hasProcessPermission('ticket_reviewers', 'create', process.id) && (
                        <button
                          onClick={() => setShowAddReviewer(true)}
                          className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} rounded-lg transition-colors`}
                          style={{ color: colors.primary }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}15`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="إضافة مراجع"
                        >
                          <Plus className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                        </button>
                      )}
                    </div>

                  <div className={`space-y-2 ${isMobile || isTablet ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
                    {isLoadingReviewers ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{ borderColor: colors.primary }}></div>
                        <p className="text-xs">جاري التحميل...</p>
                      </div>
                    ) : reviewers.length > 0 ? (
                      reviewers.map((reviewer) => (
                        <div key={reviewer.id} className="p-3 rounded-lg border" style={{ backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}>
                                <span className="text-white font-bold text-sm">
                                  {reviewer.reviewer_name?.charAt(0) || 'R'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium" style={{ color: colors.textPrimary }}>{reviewer.reviewer_name || 'مراجع'}</div>
                                <div className="text-xs" style={{ color: colors.primaryDark }}>
                                  <span className={`px-2 py-0.5 rounded ${
                                    reviewer.review_status === 'completed' ? '' :
                                    reviewer.review_status === 'in_progress' ? 'bg-yellow-200' :
                                    reviewer.review_status === 'skipped' ? 'bg-gray-200' :
                                    'bg-blue-200'
                                  }`}>
                                    {reviewer.review_status === 'completed' ? '✓ مكتمل' :
                                     reviewer.review_status === 'in_progress' ? '⏳ قيد المراجعة' :
                                     reviewer.review_status === 'skipped' ? '⊘ متخطى' :
                                     '⏸ معلق'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveReviewer(reviewer.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                              title="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {reviewer.review_status !== 'completed' && (
                            <div className="flex space-x-2 space-x-reverse mt-2">
                              {reviewer.review_status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateReviewStatus(reviewer.id, 'in_progress')}
                                  className="flex-1 text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                                >
                                  بدء المراجعة
                                </button>
                              )}
                              {reviewer.review_status === 'in_progress' && (
                                <button
                                  onClick={() => handleUpdateReviewStatus(reviewer.id, 'completed')}
                                  className="flex-1 text-xs text-white px-2 py-1 rounded transition-colors"
                                  style={{ backgroundColor: colors.primary }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                                >
                                  إكمال المراجعة
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateReviewStatus(reviewer.id, 'skipped')}
                                className="flex-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                              >
                                تخطي
                              </button>
                            </div>
                          )}
                          
                          {/* نظام التقييم بعد اكتمال المراجعة */}
                          {reviewer.review_status === 'completed' && !reviewer.rate && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-2">قيم أداء المراجع:</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleUpdateReviewRate(reviewer.id, 'ممتاز')}
                                  className="text-xs text-white px-3 py-2 rounded transition-colors"
                                  style={{ backgroundColor: colors.primary }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                                >
                                  ⭐ ممتاز
                                </button>
                                <button
                                  onClick={() => handleUpdateReviewRate(reviewer.id, 'جيد جدا')}
                                  className="text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                  👍 جيد جداً
                                </button>
                                <button
                                  onClick={() => handleUpdateReviewRate(reviewer.id, 'جيد')}
                                  className="text-xs bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 transition-colors"
                                >
                                  👌 جيد
                                </button>
                                <button
                                  onClick={() => handleUpdateReviewRate(reviewer.id, 'ضعيف')}
                                  className="text-xs bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors"
                                >
                                  👎 ضعيف
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* عرض التقييم إذا كان موجوداً */}
                          {reviewer.review_status === 'completed' && reviewer.rate && (
                            <div className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">التقييم:</span>
                                <span className="text-sm px-2 py-1 rounded"
                                  style={reviewer.rate === 'ممتاز' ? {
                                    backgroundColor: `${colors.primary}30`,
                                    color: colors.primaryDark
                                  } : reviewer.rate === 'جيد جدا' ? {
                                    backgroundColor: '#DBEAFE',
                                    color: '#1E40AF'
                                  } : reviewer.rate === 'جيد' ? {
                                    backgroundColor: '#FEF3C7',
                                    color: '#854D0E'
                                  } : {
                                    backgroundColor: '#FEE2E2',
                                    color: '#991B1B'
                                  }}
                                >
                                  {reviewer.rate === 'ممتاز' ? '⭐ ممتاز' :
                                   reviewer.rate === 'جيد جدا' ? '👍 جيد جداً' :
                                   reviewer.rate === 'جيد' ? '👌 جيد' :
                                   '👎 ضعيف'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا يوجد مراجعين</p>
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            {((isMobile || isTablet) && activeTab !== 'comments') ? null : (
            <div className={isMobile || isTablet ? 'mt-4' : ''}>
              <CommentsSection
                ticketId={ticket.id}
                ticketTitle={ticket.title}
                assignedUserIds={[
                  ...(ticket.assigned_to ? [ticket.assigned_to] : []),
                  ...assignments.map(a => a.user_id).filter(Boolean)
                ]}
                reviewerUserIds={reviewers.map(r => r.reviewer_id).filter(Boolean)}
                onCommentAdded={(comment) => {
                  // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
                }}
              />
            </div>
            )}

            
          </div>

          {/* Right Sidebar - Horizontal Layout */}
          {((isMobile || isTablet) && activeTab !== 'attachments' && activeTab !== 'stages') ? null : (
          <div className={`${isMobile || isTablet ? 'w-full border-t' : 'w-96 lg:w-[500px] border-r'} border-gray-200 bg-gray-50 flex flex-col`}>
            {/* أزرار التعديل - تظهر فقط عند تفعيل وضع التعديل */}
            {isEditing && (
              <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200 bg-white`}>
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    style={{
                      background: `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`,
                    }}
                    className={`w-full text-white ${isMobile || isTablet ? 'py-2 px-3 text-xs' : 'py-2 px-4 text-sm'} rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium`}
                    disabled={isUpdating}
                  >
                    <Save className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span>{isUpdating ? 'جاري الحفظ...' : 'حفظ'}</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`w-full border border-gray-300 text-gray-700 ${isMobile || isTablet ? 'py-2 px-3 text-xs' : 'py-2 px-4 text-sm'} rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse`}
                  >
                    <X className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span>إلغاء التعديل</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Horizontal Container for Process Path and Attachments */}
            <div className={`flex ${isMobile || isTablet ? 'flex-col' : 'flex-col md:flex-row'} h-full ${isMobile || isTablet ? '' : 'min-h-[400px]'}`}>
            
              {/* Attachments - Right Column */}
              {((isMobile || isTablet) && activeTab !== 'attachments') ? null : (
              <div className={`flex-1 ${isMobile || isTablet ? 'w-full' : 'md:w-1/2'}`}>
                <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} bg-white h-full`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse`}>
                      <Paperclip className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
                      <span>المرفقات ({(ticket.attachments?.length || 0) + (attachments?.length || 0)})</span>
                    </h3>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadAttachment(e.target.files);
                        // إعادة تعيين قيمة input لتمكين رفع نفس الملف مرة أخرى
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                    id="attachment-upload"
                    disabled={isUploadingAttachment}
                  />
                  <label
                    htmlFor="attachment-upload"
                    className={`cursor-pointer text-blue-600 hover:text-blue-700 p-1 rounded transition-colors ${
                      isUploadingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="رفع مرفقات"
                  >
                    {isUploadingAttachment ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </label>
                      {isUploadingAttachment && uploadProgress > 0 && (
                        <div className="text-xs text-blue-600">
                          {uploadProgress}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* مؤشرات التقدم للرفع */}
                  {uploadingFiles.length > 0 && (
                    <div className="mt-3 mb-3 space-y-2">
                      {uploadingFiles.map((file, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {file.status === 'uploading' && (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                )}
                                {file.status === 'success' && (
                                  <CheckCircle className="w-4 h-4" style={{ color: colors.primary }} />
                                )}
                                {file.status === 'error' && (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-blue-600 ml-2 flex-shrink-0">
                              {file.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${file.progress}%`,
                                backgroundColor: file.status === 'success' ? colors.primary : file.status === 'error' ? '#EF4444' : '#2563EB'
                              }}
                            />
                          </div>
                          {file.status === 'success' && (
                            <p className="text-xs mt-1" style={{ color: colors.primary }}>✓ تم الرفع بنجاح</p>
                          )}
                          {file.status === 'error' && (
                            <p className="text-xs text-red-600 mt-1">✗ فشل الرفع</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* منطقة المرفقات مع Scroll */}
                  <div className={`${isMobile || isTablet ? 'max-h-[40vh]' : 'max-h-80 md:max-h-96'} overflow-y-auto space-y-2 pr-2 scrollbar-thin border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-gray-50`}>
                    {ticket.attachments?.map((attachment: any) => {
                      // معالجة المرفقات القديمة (من ticket.attachments مباشرة)
                      const isImage = attachment.mime_type?.startsWith('image/') || attachment.type?.startsWith('image/');
                      const isVideo = attachment.mime_type?.startsWith('video/') || attachment.type?.startsWith('video/');
                      const isPDF = attachment.mime_type === 'application/pdf' || attachment.type === 'application/pdf';
                      const isText = attachment.mime_type?.startsWith('text/') || attachment.type?.startsWith('text/');
                      
                      // محاولة إنشاء رابط - إذا كان attachment.url موجود
                      const fileUrl = attachment.url || attachment.file_path || attachment.file_url;
                      const attachmentId = attachment.id;
                      let downloadUrl = '#';
                      
                      if (attachmentId) {
                        // إذا كان لديه id، استخدم endpoint التحميل
                        downloadUrl = `${API_BASE_URL}/api/attachments/${attachmentId}/download`;
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          downloadUrl += `?token=${token}`;
                        }
                      } else if (fileUrl) {
                        // إذا كان لديه رابط مباشر
                        downloadUrl = fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                      }

                      const handleOpenFile = () => {
                        if (!downloadUrl || downloadUrl === '#') return;
                        
                        if (isImage && attachmentId) {
                          // للصور - فتح Modal داخلي
                          setViewingImage({ 
                            id: attachmentId, 
                            filename: attachment.name || attachment.filename || attachment.original_filename || 'صورة' 
                          });
                        } else if (isVideo && attachmentId) {
                          // للفيديو - فتح Modal داخلي
                          setViewingVideo({ 
                            id: attachmentId, 
                            filename: attachment.name || attachment.filename || attachment.original_filename || 'فيديو' 
                          });
                        } else if (isPDF || isText) {
                          window.open(downloadUrl, '_blank');
                        } else {
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = attachment.name || attachment.filename || attachment.original_filename || 'file';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      };

                      const handleDownloadFile = async () => {
                        if (!attachmentId) return;
                        
                        try {
                          const token = localStorage.getItem('auth_token');
                          const fileUrl = `${API_BASE_URL}/api/attachments/${attachmentId}/download`;
                          
                          const response = await fetch(fileUrl, {
                            headers: token ? {
                              'Authorization': `Bearer ${token}`
                            } : {}
                          });
                          
                          if (response.ok) {
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = attachment.name || attachment.filename || attachment.original_filename || 'file';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                            notifications.showSuccess('تم التحميل', 'تم تحميل الملف بنجاح');
                          } else {
                            notifications.showError('فشل التحميل', 'فشل في تحميل الملف');
                          }
                        } catch (error) {
                          console.error('❌ خطأ في تحميل الملف:', error);
                          notifications.showError('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف');
                        }
                      };

                      return (
                        <div 
                          key={attachment.id || attachment.name} 
                          className={`flex items-center justify-between ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group`}
                          onClick={handleOpenFile}
                        >
                          <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                            {isImage && attachmentId ? (
                              <AttachmentImagePreview 
                                attachmentId={attachmentId}
                                filename={attachment.name || attachment.filename || attachment.original_filename || 'صورة'}
                                onClick={() => setViewingImage({ 
                                  id: attachmentId, 
                                  filename: attachment.name || attachment.filename || attachment.original_filename || 'صورة' 
                                })}
                              />
                            ) : isVideo && attachmentId ? (
                              <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:border-purple-300 transition-colors`} onClick={() => setViewingVideo({ 
                                id: attachmentId, 
                                filename: attachment.name || attachment.filename || attachment.original_filename || 'فيديو' 
                              })}>
                                <Video className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-purple-500`} />
                              </div>
                            ) : isPDF ? (
                              <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-red-500 flex-shrink-0`} />
                            ) : isText ? (
                              <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500 flex-shrink-0`} />
                            ) : (
                              <Paperclip className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500 flex-shrink-0`} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors`} title={attachment.name || attachment.filename || attachment.original_filename}>
                                {attachment.name || attachment.filename || attachment.original_filename || 'ملف'}
                              </div>
                              <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                                {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(1)} MB` : 
                                 attachment.file_size ? `${(Number(attachment.file_size) / 1024).toFixed(1)} KB` : 'حجم غير معروف'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse flex-shrink-0">
                            {(isImage || isVideo || isPDF || isText) && attachmentId && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFile();
                                }}
                                className={`text-blue-600 hover:text-blue-700 ${isMobile || isTablet ? 'p-0.5' : 'p-1'} rounded transition-colors`}
                                title="فتح الملف"
                              >
                                <Eye className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                              </button>
                            )}
                            {attachmentId && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile();
                                }}
                                className={`${isMobile || isTablet ? 'p-0.5' : 'p-1'} rounded transition-colors`}
                                style={{ color: colors.primary }}
                                onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryDark}
                                onMouseLeave={(e) => e.currentTarget.style.color = colors.primary}
                                title="تحميل الملف"
                              >
                                <Download className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                
                {/* عرض المرفقات من API */}
                {attachmentsLoading ? (
                  <div className="text-center py-4 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-xs">جاري تحميل المرفقات...</p>
                  </div>
                ) : attachments.length > 0 ? (
                  attachments.map((attachment) => {
                    const isImage = attachment.mime_type?.startsWith('image/') || attachment.is_image;
                    const isVideo = attachment.mime_type?.startsWith('video/');
                    const isPDF = attachment.mime_type === 'application/pdf';
                    const isText = attachment.mime_type?.startsWith('text/');
                    const fileUrl = `${API_BASE_URL}/api/attachments/${attachment.id}/download`;
                    
                    // إنشاء رابط للتحميل مع التوكن في header
                    const handleOpenFile = async () => {
                      try {
                        const token = localStorage.getItem('auth_token');
                        
                        if (isImage) {
                          // للصور - فتح Modal داخلي
                          setViewingImage({ id: attachment.id, filename: attachment.original_filename });
                        } else if (isVideo) {
                          // للفيديو - فتح Modal داخلي
                          setViewingVideo({ id: attachment.id, filename: attachment.original_filename });
                        } else if (isPDF || isText) {
                          // للPDF والنصوص - فتح في نافذة جديدة
                          if (token) {
                            // إنشاء blob URL للوصول للملف مع التوكن
                            const response = await fetch(fileUrl, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            
                            if (response.ok) {
                              const blob = await response.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              window.open(blobUrl, '_blank');
                              // تنظيف blob URL بعد فتحه (اختياري)
                              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                            } else {
                              console.error('❌ فشل في جلب الملف:', response.status);
                              notifications.showError('خطأ في فتح الملف', 'فشل في جلب الملف من الخادم');
                            }
                          } else {
                            // بدون توكن - محاولة فتح مباشرة
                            window.open(fileUrl, '_blank');
                          }
                        } else {
                          // للملفات الأخرى - تحميل مباشر
                          const link = document.createElement('a');
                          link.href = fileUrl;
                          link.download = attachment.original_filename;
                          link.target = '_blank';
                          
                          // إضافة التوكن إذا كان متوفراً (عبر fetch ثم blob)
                          if (token) {
                            try {
                              const response = await fetch(fileUrl, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (response.ok) {
                                const blob = await response.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                link.href = blobUrl;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                return;
                              }
                            } catch (error) {
                              console.error('❌ خطأ في تحميل الملف:', error);
                            }
                          }
                          
                          // Fallback - تحميل مباشر
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (error) {
                        console.error('❌ خطأ في فتح الملف:', error);
                        notifications.showError('خطأ في فتح الملف', error instanceof Error ? error.message : 'فشل في فتح الملف');
                      }
                    };

                    const handleDownloadFile = async () => {
                      try {
                        const token = localStorage.getItem('auth_token');
                        
                        const response = await fetch(fileUrl, {
                          headers: token ? {
                            'Authorization': `Bearer ${token}`
                          } : {}
                        });
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = attachment.original_filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                          notifications.showSuccess('تم التحميل', 'تم تحميل الملف بنجاح');
                        } else {
                          notifications.showError('فشل التحميل', 'فشل في تحميل الملف');
                        }
                      } catch (error) {
                        console.error('❌ خطأ في تحميل الملف:', error);
                        notifications.showError('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف');
                      }
                    };

                    return (
                      <div 
                        key={attachment.id} 
                        className={`flex items-center justify-between ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group`}
                        onClick={handleOpenFile}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                          {isImage ? (
                            <AttachmentImagePreview 
                              attachmentId={attachment.id}
                              filename={attachment.original_filename}
                              onClick={() => setViewingImage({ id: attachment.id, filename: attachment.original_filename })}
                            />
                          ) : isVideo ? (
                            <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:border-purple-300 transition-colors`} onClick={() => setViewingVideo({ id: attachment.id, filename: attachment.original_filename })}>
                              <Video className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-purple-500`} />
                            </div>
                          ) : isPDF ? (
                            <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-red-500 flex-shrink-0`} />
                          ) : isText ? (
                            <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500 flex-shrink-0`} />
                          ) : (
                            <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500 flex-shrink-0`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors`} title={attachment.original_filename}>
                              {attachment.original_filename}
                            </p>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                              {(Number(attachment.file_size) / 1024).toFixed(1)} KB
                              {attachment.uploaded_by_name && ` • ${attachment.uploaded_by_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {(isImage || isVideo || isPDF || isText) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile();
                              }}
                              className={`text-blue-600 hover:text-blue-700 ${isMobile || isTablet ? 'p-0.5' : 'p-1'} rounded transition-colors`} 
                              title="فتح الملف"
                            >
                              <Eye className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile();
                            }}
                            className={`text-green-600 hover:text-green-700 ${isMobile || isTablet ? 'p-0.5' : 'p-1'} rounded transition-colors`} 
                            title="تحميل الملف"
                          >
                            <Download className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                          </button>
                          <button
                            onClick={() => {
                              setAttachmentToDelete(attachment.id);
                              setShowDeleteAttachmentConfirm(true);
                            }}
                            disabled={isDeletingAttachment}
                            className={`text-red-600 hover:text-red-700 ${isMobile || isTablet ? 'p-0.5' : 'p-1'} rounded transition-colors ${
                              isDeletingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="حذف المرفق"
                          >
                            {isDeletingAttachment && attachmentToDelete === attachment.id ? (
                              <div className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} border-2 border-red-600 border-t-transparent rounded-full animate-spin`} />
                            ) : (
                              <Trash2 className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Paperclip className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">لا توجد مرفقات</p>
                  </div>
                )}
              </div>

                  {/* مؤشر الـ scroll عندما يكون هناك الكثير من المرفقات */}
                  {((ticket.attachments?.length || 0) + (attachments?.length || 0)) > 3 && (
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center space-x-1 space-x-reverse text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <span>📜</span>
                        <span>مرر للأسفل لرؤية جميع المرفقات</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            
              {/* Stage Flow - Left Column */}
              {((isMobile || isTablet) && activeTab !== 'stages') ? null : (
              <div className={`flex-1 ${isMobile || isTablet ? 'w-full border-t' : 'md:w-1/2 border-b md:border-b-0 md:border-r'} border-gray-200`}>
                <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} bg-white h-full`}>
                  <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse`}>
                    <Target className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
                    <span>مسار العملية</span>
                  </h3>

                  <div className={`space-y-3 ${isMobile || isTablet ? 'max-h-[50vh]' : 'max-h-96'} overflow-y-auto pr-2 scrollbar-thin`}>
                    {sortedStages.map((stage) => {
                  const isCurrentStage = stage.id === ticket.current_stage_id;
                  const isAllowedTransition = currentStage?.allowed_transitions?.includes(stage.id);
                  const isPassed = stage.priority < (currentStage?.priority || 0);
                  
                  return (
                    <div key={stage.id} 
                      className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors border"
                      style={isPassed ? {
                        backgroundColor: `${colors.primary}15`,
                        borderColor: `${colors.primary}40`
                      } : isCurrentStage ? {
                        backgroundColor: '#DBEAFE',
                        borderColor: '#93C5FD'
                      } : isAllowedTransition ? {
                        backgroundColor: '#FEF3C7',
                        borderColor: '#FDE047'
                      } : {
                        backgroundColor: '#F9FAFB',
                        borderColor: '#E5E7EB'
                      }}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={isPassed ? {
                          backgroundColor: colors.primary
                        } : isCurrentStage ? {
                          backgroundColor: '#3B82F6'
                        } : isAllowedTransition ? {
                          backgroundColor: '#EAB308'
                        } : {
                          backgroundColor: '#D1D5DB',
                          color: '#4B5563'
                        }}
                      >
                        {isCurrentStage ? <Target className="w-3 h-3" /> :
                         isPassed ? <CheckCircle className="w-3 h-3" /> :
                         stage.priority}
                      </div>
                      
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isCurrentStage ? 'text-blue-900' :
                          isPassed ? '' :
                          isAllowedTransition ? 'text-yellow-900' :
                          'text-gray-600'
                        }`}>
                          {stage.name}
                        </div>
                        {stage.description && (
                          <div className="text-xs text-gray-500 mt-1">{stage.description}</div>
                        )}
                      </div>
                      
                      {isCurrentStage && (
                        <div className="text-blue-600">
                          <Eye className="w-4 h-4" />
                        </div>
                      )}
                      
                      {isAllowedTransition && !isCurrentStage && (
                        <button
                          onClick={async () => {
                            if (!isMoving) {
                              const success = await moveTicket(ticket.id, stage.id);
                              if (success) {
                                onMoveToStage(stage.id);
                              }
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            isMoving
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-yellow-600 hover:text-yellow-700'
                          }`}
                          disabled={isMoving}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {allowedStages.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowStageSelector(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse text-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>خيارات النقل المتقدمة</span>
                  </button>
                  </div>
                )}
                </div>
              </div>
              )}
            
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Stage Selector Modal */}
      {showStageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">نقل التذكرة إلى مرحلة جديدة</h3>
              <button
                onClick={() => {
                  setShowStageSelector(false);
                  setSelectedStages([]);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Transition Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">نوع الانتقال</label>
                <div className="flex space-x-4 space-x-reverse">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="transitionType"
                      value="single"
                      checked={transitionType === 'single'}
                      onChange={(e) => {
                        setTransitionType('single');
                        setSelectedStages([]);
                      }}
                      className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">انتقال واحد</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="transitionType"
                      value="multiple"
                      checked={transitionType === 'multiple'}
                      onChange={(e) => {
                        setTransitionType('multiple');
                        setSelectedStages([]);
                      }}
                      className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">انتقال متعدد</span>
                  </label>
                </div>
              </div>

              {/* Available Stages */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  المراحل المتاحة للانتقال ({allowedStages.length})
                </label>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allowedStages.map((stage) => (
                    <div key={stage.id} className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                        <input
                          type={transitionType === 'single' ? 'radio' : 'checkbox'}
                          name="selectedStage"
                          value={stage.id}
                          checked={selectedStages.includes(stage.id)}
                          onChange={(e) => {
                            if (transitionType === 'single') {
                              setSelectedStages(e.target.checked ? [stage.id] : []);
                            } else {
                              if (e.target.checked) {
                                setSelectedStages([...selectedStages, stage.id]);
                              } else {
                                setSelectedStages(selectedStages.filter(id => id !== stage.id));
                              }
                            }
                          }}
                          className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        
                        <div className={`w-4 h-4 ${stage.color} rounded`}></div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{stage.name}</div>
                          <div className="text-sm text-gray-500">أولوية: {stage.priority}</div>
                          {stage.description && (
                            <div className="text-xs text-gray-400 mt-1">{stage.description}</div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            مسموح
                          </span>
                          {stage.is_final && (
                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${colors.primary}30`, color: colors.primaryDark }}>
                              نهائي
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Stage Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <div className={`w-4 h-4 ${currentStage?.color} rounded`}></div>
                  <span className="font-medium text-blue-900">المرحلة الحالية: {currentStage?.name}</span>
                </div>
                <div className="text-sm text-blue-700">
                  أولوية: {currentStage?.priority} | 
                  المراحل المتاحة: {allowedStages.length}
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-3">
              <button
                onClick={handleStageMove}
                disabled={selectedStages.length === 0 || isMoving}
                style={{
                  background: `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`,
                }}
                className="w-full text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMoving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري التحريك...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      {transitionType === 'single' ? 'نقل إلى المرحلة' : `نقل إلى ${selectedStages.length} مرحلة`}
                    </span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowStageSelector(false);
                  setSelectedStages([]);
                }}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">تأكيد حذف التذكرة</h3>
                <p className="text-sm text-gray-600">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                هل أنت متأكد من حذف التذكرة:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{ticket.title}</p>
                <p className="text-sm text-gray-600">رقم التذكرة: {ticket.ticket_number}</p>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 space-x-reverse ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف التذكرة</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إضافة مستخدم مُسند</h3>
              <button
                onClick={() => {
                  setShowAddAssignment(false);
                  setSelectedUserId('');
                  setAssignmentRole('');
                  setAssignmentNotes('');
                  setAssignmentSearchQuery('');
                  setShowAssignmentDropdown(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
                <div className="relative assignment-search-container">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={assignmentSearchQuery}
                      onChange={(e) => {
                        setAssignmentSearchQuery(e.target.value);
                        setShowAssignmentDropdown(true);
                      }}
                      onFocus={() => setShowAssignmentDropdown(true)}
                      placeholder="ابحث عن مستخدم..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showAssignmentDropdown && (allUsers.length > 0 || processUsers.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const users = allUsers.length > 0 ? allUsers : processUsers;
                        const filteredUsers = users.filter((user) => {
                          const query = assignmentSearchQuery.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query) ||
                            user.role?.name?.toLowerCase().includes(query)
                          );
                        });
                        
                        return filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setAssignmentSearchQuery(user.name || '');
                                setShowAssignmentDropdown(false);
                              }}
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                                selectedUserId === user.id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">
                                    {user.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.role?.name}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">لا توجد نتائج</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {selectedUserId && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name}
                          </div>
                          <div className="text-sm text-blue-700">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.role?.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUserId('');
                          setAssignmentSearchQuery('');
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور (اختياري)</label>
                <input
                  type="text"
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                  placeholder="مثال: مطور، مصمم، مدير"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

             
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddAssignment}
                disabled={!selectedUserId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddAssignment(false);
                  setSelectedUserId('');
                  setAssignmentRole('');
                  setAssignmentNotes('');
                  setAssignmentSearchQuery('');
                  setShowAssignmentDropdown(false);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reviewer Modal */}
      {showAddReviewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إضافة مراجع</h3>
              <button
                onClick={() => {
                  setShowAddReviewer(false);
                  setSelectedUserId('');
                  setReviewerNotes('');
                  setReviewerSearchQuery('');
                  setShowReviewerDropdown(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المراجع</label>
                <div className="relative reviewer-search-container">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={reviewerSearchQuery}
                      onChange={(e) => {
                        setReviewerSearchQuery(e.target.value);
                        setShowReviewerDropdown(true);
                      }}
                      onFocus={() => setShowReviewerDropdown(true)}
                      placeholder="ابحث عن مراجع..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showReviewerDropdown && (allUsers.length > 0 || processUsers.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const users = allUsers.length > 0 ? allUsers : processUsers;
                        const filteredUsers = users.filter((user) => {
                          const query = reviewerSearchQuery.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query) ||
                            user.role?.name?.toLowerCase().includes(query)
                          );
                        });
                        
                        return filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setReviewerSearchQuery(user.name || '');
                                setShowReviewerDropdown(false);
                              }}
                              className="px-4 py-3 cursor-pointer transition-colors"
                              style={{
                                backgroundColor: selectedUserId === user.id ? `${colors.primary}20` : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (selectedUserId !== user.id) {
                                  e.currentTarget.style.backgroundColor = `${colors.primary}10`;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedUserId !== user.id) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}>
                                  <span className="text-white font-bold text-sm">
                                    {user.name?.charAt(0) || 'R'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.role?.name}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">لا توجد نتائج</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {selectedUserId && (
                  <div className="mt-2 p-3 rounded-lg border" style={{ backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}>
                          <span className="text-white font-bold text-sm">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name?.charAt(0) || 'R'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: colors.textPrimary }}>
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name}
                          </div>
                          <div className="text-sm" style={{ color: colors.primaryDark }}>
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.role?.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUserId('');
                          setReviewerSearchQuery('');
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddReviewer}
                disabled={!selectedUserId}
                className="flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddReviewer(false);
                  setSelectedUserId('');
                  setReviewerNotes('');
                  setReviewerSearchQuery('');
                  setShowReviewerDropdown(false);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <ImageViewerModal
          isOpen={!!viewingImage}
          onClose={() => setViewingImage(null)}
          imageUrl={null}
          filename={viewingImage.filename}
          onLoadImage={async () => {
            const token = localStorage.getItem('auth_token');
            const fileUrl = `${API_BASE_URL}/api/attachments/${viewingImage.id}/download`;
            
            try {
              const response = await fetch(fileUrl, {
                method: 'GET',
                headers: token ? {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'image/*, application/pdf, text/*'
                } : {
                  'Accept': 'image/*, application/pdf, text/*'
                }
              });
              
              if (!response.ok) {
                let errorText = '';
                try {
                  errorText = await response.text();
                } catch (e) {
                  errorText = response.statusText;
                }
                console.error('❌ [ImageViewerModal] فشل في جلب الصورة:', response.status, errorText);
                throw new Error(`فشل في تحميل الصورة: ${response.status} - ${errorText.substring(0, 100)}`);
              }
              
              const blob = await response.blob();
              
              if (blob.size === 0) {
                throw new Error('الصورة فارغة أو غير موجودة');
              }
              
              const blobUrl = URL.createObjectURL(blob);
              
              return blobUrl;
            } catch (error) {
              console.error('❌ [ImageViewerModal] خطأ في تحميل الصورة:', error);
              if (error instanceof Error) {
                throw new Error(error.message);
              }
              throw new Error('حدث خطأ غير متوقع أثناء تحميل الصورة');
            }
          }}
        />
      )}

      {/* Video Viewer Modal */}
      {viewingVideo && (
        <VideoViewerModal
          isOpen={!!viewingVideo}
          onClose={() => setViewingVideo(null)}
          videoUrl={null}
          filename={viewingVideo.filename}
          onLoadVideo={async () => {
            const token = localStorage.getItem('auth_token');
            const fileUrl = `${API_BASE_URL}/api/attachments/${viewingVideo.id}/download`;
            
            try {
              const response = await fetch(fileUrl, {
                method: 'GET',
                headers: token ? {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'video/*'
                } : {
                  'Accept': 'video/*'
                }
              });
              
              if (!response.ok) {
                throw new Error(`فشل في تحميل الفيديو: ${response.status}`);
              }
              
              const blob = await response.blob();
              
              if (blob.size === 0) {
                throw new Error('الفيديو فارغ أو غير موجود');
              }
              
              const blobUrl = URL.createObjectURL(blob);
              return blobUrl;
            } catch (error) {
              console.error('❌ [VideoViewerModal] خطأ في تحميل الفيديو:', error);
              throw error;
            }
          }}
        />
      )}

      {/* Process Selector Modal */}
      {showProcessSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">نقل التذكرة إلى عملية أخرى</h3>
              <button
                onClick={() => {
                  setShowProcessSelector(false);
                  setSelectedProcessId('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Current Process Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">العملية الحالية: {process.name}</span>
                </div>
                <div className="text-sm text-blue-700">
                  {process.description || 'لا يوجد وصف'}
                </div>
              </div>

              {/* Available Processes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  اختر العملية المستهدفة
                </label>
                
                {isLoadingProcesses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">جاري تحميل العمليات...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allProcesses
                      .filter(p => p.id !== process.id) // استبعاد العملية الحالية
                      .map((proc) => (
                        <div 
                          key={proc.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedProcessId === proc.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedProcessId(proc.id)}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <input
                              type="radio"
                              name="selectedProcess"
                              value={proc.id}
                              checked={selectedProcessId === proc.id}
                              onChange={() => setSelectedProcessId(proc.id)}
                              className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{proc.name}</div>
                              {proc.description && (
                                <div className="text-sm text-gray-500 mt-1">{proc.description}</div>
                              )}
                              <div className="flex items-center space-x-2 space-x-reverse mt-2">
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {proc.stages?.length || 0} مرحلة
                                </span>
                                {proc.is_active && (
                                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${colors.primary}30`, color: colors.primaryDark }}>
                                    نشط
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {allProcesses.filter(p => p.id !== process.id).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا توجد عمليات أخرى متاحة</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Warning Message */}
              {selectedProcessId && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900">تنبيه</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        سيتم نقل التذكرة إلى العملية الجديدة وسيتم تحديث جميع البيانات المرتبطة بها.
                        هذا الإجراء لا يمكن التراجع عنه.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-3 border-t border-gray-200">
              <button
                onClick={handleMoveToProcess}
                disabled={!selectedProcessId || isMovingToProcess}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMovingToProcess ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري النقل...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>تنفيذ النقل</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowProcessSelector(false);
                  setSelectedProcessId('');
                }}
                disabled={isMovingToProcess}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Attachment Delete Confirmation Dialog */}
      {showDeleteAttachmentConfirm && attachmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">تأكيد حذف المرفق</h3>
                <p className="text-sm text-gray-600">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                هل أنت متأكد من أنك تريد حذف هذا المرفق؟
              </p>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => handleDeleteAttachment(attachmentToDelete)}
                disabled={isDeletingAttachment}
                className={`flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 space-x-reverse ${
                  isDeletingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeletingAttachment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف المرفق</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowDeleteAttachmentConfirm(false);
                  setAttachmentToDelete(null);
                }}
                disabled={isDeletingAttachment}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TicketModal;