import { FileText, Image as ImageIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatFileSize } from '../lib/utils';

interface FileUploadPreviewProps {
  file: File;
  onRemove: () => void;
}

export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ file, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 max-w-sm mb-2">
      {isImage && previewUrl ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-200 dark:bg-neutral-700">
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
          {file.name}
        </p>
        <p className="text-[10px] text-neutral-400">{formatFileSize(file.size)}</p>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
        title="Remove attachment"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
