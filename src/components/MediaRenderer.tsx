import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, FileVideo, Image as ImageIcon, Loader2 } from 'lucide-react';
import { VIDEO_EXTENSIONS } from '../constants';
import { normalizeUrl } from '../utils';

interface MediaRendererProps {
  url: string;
  label?: string;
  isActive: boolean;
  className?: string;
  onLoadStatusChange?: (isLoaded: boolean) => void;
  forceType?: 'image' | 'video' | string;
  videoPreload?: 'none' | 'metadata' | 'auto';
}

const MediaRenderer: React.FC<MediaRendererProps> = ({ url, label, isActive, className = '', onLoadStatusChange, forceType, videoPreload = 'auto' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const onLoadStatusChangeRef = useRef(onLoadStatusChange);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const finalUrl = normalizeUrl(url);

  useEffect(() => {
    onLoadStatusChangeRef.current = onLoadStatusChange;
  }, [onLoadStatusChange]);

  // Simple heuristic to detect type from URL extension
  useEffect(() => {
    setLoading(true);
    setError(false);
    setBlobUrl(null); // Reset blob url on new url
    onLoadStatusChangeRef.current?.(false);
    
    // Reset based on URL change
    const cleanUrl = url.trim().split('?')[0].split('#')[0].toLowerCase();
    const isVideoExt = VIDEO_EXTENSIONS.some(ext => cleanUrl.endsWith(`.${ext}`));

    // Detect if URL looks like multiple concatenated URLs
    const httpCount = (url.match(/https?:\/\//g) || []).length;
    if (httpCount > 1) {
      setError(true);
      setLoading(false);
      return;
    }

    if (isVideoExt) {
      setMediaType('video');
      return;
    }

    if (forceType === 'video' || forceType === 'image') {
      setMediaType(forceType);
      return;
    }

    setMediaType('image');
  }, [url, forceType]);

  // Cleanup blob URL when url changes or component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [url, blobUrl]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoadStatusChangeRef.current?.(true);
  };
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    if (mediaType !== 'video' || error) return;

    const markLoadedIfReady = () => {
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        handleLoad();
      }
    };

    const checks = [250, 1000, 3000].map(delay => window.setTimeout(markLoadedIfReady, delay));
    const softTimeout = window.setTimeout(() => {
      // Some CDNs/browsers allow manual playback but never fire canplay/loadeddata
      // in embedded contexts. Do not block voting forever in that state.
      handleLoad();
    }, 10000);

    markLoadedIfReady();

    return () => {
      checks.forEach(window.clearTimeout);
      window.clearTimeout(softTimeout);
    };
  }, [mediaType, finalUrl, blobUrl, retryKey, error]);

  const handleError = () => {
    setLoading(false);
    setError(true);
    onLoadStatusChangeRef.current?.(true); // Treat error as loaded so user can still vote if it fails
  };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setErrorStatus(null);
    setBlobUrl(null);
    // Force reload by appending a timestamp to the URL (if it's not a data URI)
    const retryUrl = finalUrl.startsWith('data:') ? finalUrl : `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}retry=${Date.now()}`;
    // We don't actually change the src prop, we just reset the state and let React re-render.
    // To force re-render of the media element, we can use a key.
  };

  const triggerRetry = () => {
    setLoading(true);
    setError(false);
    setErrorStatus(null);
    setBlobUrl(null);
    setRetryKey(prev => prev + 1);
  };

  if (!finalUrl) {
    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-xl group ${className}`}>
        <AlertCircle className="w-10 h-10 mb-2 text-slate-500 shrink-0" />
        <p className="text-sm font-medium text-slate-400">链接为空</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex flex-col bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-xl group ${className}`}>
      {/* Label Badge */}
      {label && (
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider border border-white/10 pointer-events-none">
          {label}
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-0">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 text-slate-400 p-4 text-center overflow-y-auto z-10">
          <AlertCircle className="w-10 h-10 mb-2 text-red-400 shrink-0" />
          <p className="text-sm font-medium text-slate-300">
            {errorStatus === 403 ? '403 Forbidden (CDN 拒绝访问)' : ((url.match(/https?:\/\//g) || []).length > 1 ? '检测到多个链接合并' : '加载失败')}
          </p>
          <p className="text-xs text-slate-500 mt-1 break-all max-w-full px-4 select-all">
            {errorStatus === 403 
              ? 'CDN 拒绝了来自此域名的请求。这通常是由于防盗链设置导致的。请尝试在 CDN 后台允许此域名，或将 Referrer 策略设置为允许空 Referrer。'
              : ((url.match(/https?:\/\//g) || []).length > 1 
                ? '您的表格解析失败，导致多个列的内容被合并到了一个链接中。请检查上传文件的分隔符（建议使用逗号或制表符）。'
                : (finalUrl ? `尝试加载的链接: ${finalUrl}` : '链接为空'))}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button 
              onClick={triggerRetry}
              className="px-3 py-1.5 bg-white/10 glass-panel-hover text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              重试
            </button>
            <button 
              onClick={() => {
                setMediaType(mediaType === 'image' ? 'video' : 'image');
                setLoading(true);
                setError(false);
                setRetryKey(prev => prev + 1);
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              尝试作为{mediaType === 'image' ? '视频' : '图片'}加载
            </button>
            <a 
              href={finalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              在新标签页打开
            </a>
          </div>
        </div>
      )}

      {/* Media Content */}
      <div className="flex-1 relative flex items-center justify-center bg-black/60">
        {mediaType === 'video' ? (
          <video
            key={`video-${retryKey}-${blobUrl ? 'blob' : 'url'}`}
            ref={videoRef}
            src={blobUrl || finalUrl || undefined}
            className={`max-w-full max-h-full object-contain focus:outline-none ${loading ? 'opacity-0' : 'opacity-100'}`}
            controls
            autoPlay={isActive}
            loop
            muted
            preload={videoPreload}
            playsInline // Critical for iOS/Mobile to prevent detached player refresh issues
            referrerPolicy="origin"
            onLoadedMetadata={handleLoad}
            onLoadedData={handleLoad}
            onCanPlay={handleLoad}
            onCanPlayThrough={handleLoad}
            onPlaying={handleLoad}
            onError={handleError}
            onKeyDown={(e) => e.stopPropagation()} // Prevent video shortcuts from interfering with app voting
          />
        ) : (
          <img
            key={`img-${retryKey}`}
            src={finalUrl || undefined}
            alt={label}
            className={`max-w-full max-h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'}`}
            referrerPolicy="origin"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>

      {/* Type Indicator (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg text-white/70 pointer-events-none">
        {mediaType === 'video' ? <FileVideo size={16} /> : <ImageIcon size={16} />}
      </div>
    </div>
  );
};

export default MediaRenderer;
