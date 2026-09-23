import React from 'react';
import { MediaType } from '../types';
import { Image as ImageIcon, Video } from 'lucide-react';

interface MediaRendererProps {
  type: MediaType;
  url: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Renders either an <img> or an auto-playing, muted, looping, control-less <video>.
 * Videos are always muted + playsInline because modern browsers block autoplay-with-sound.
 */
export const MediaRenderer: React.FC<MediaRendererProps> = ({
  type,
  url,
  className,
  style,
  alt,
}) => {
  if (!url) return null;

  if (type === 'video') {
    return (
      <video
        src={url}
        className={className}
        style={style}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt || ''}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
    />
  );
};

interface MediaTypeToggleProps {
  value: MediaType;
  onChange: (v: MediaType) => void;
  disabled?: boolean;
}

export const MediaTypeToggle: React.FC<MediaTypeToggleProps> = ({
  value,
  onChange,
  disabled,
}) => (
  <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 border border-slate-200">
    <button
      type="button"
      onClick={() => onChange('image')}
      disabled={disabled}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
        value === 'image'
          ? 'bg-[#2D5A50] text-white border-[#2D5A50] shadow-2xs'
          : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
      }`}
    >
      <ImageIcon className="w-3 h-3" />
      <span>Photo</span>
    </button>
    <button
      type="button"
      onClick={() => onChange('video')}
      disabled={disabled}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
        value === 'video'
          ? 'bg-[#2D5A50] text-white border-[#2D5A50] shadow-2xs'
          : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
      }`}
    >
      <Video className="w-3 h-3" />
      <span>Video</span>
    </button>
  </div>
);