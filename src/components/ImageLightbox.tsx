import { Download, X } from 'lucide-react';
import React from 'react';

interface ImageLightboxProps {
  imageUrl: string | null;
  imageName?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageUrl,
  imageName = 'Image',
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-12 right-0 flex items-center gap-3">
          <a
            href={imageUrl}
            download={imageName}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Download full image"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-full max-h-[82vh] rounded-lg shadow-2xl object-contain"
        />

        <div className="mt-3 text-xs text-neutral-300 font-medium truncate max-w-md">
          {imageName}
        </div>
      </div>
    </div>
  );
};
