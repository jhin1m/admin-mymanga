"use client";
import React, { useRef, useState } from "react";

interface UploadProgress {
  fileName: string;
  progress: number;
  error?: string;
}

interface ImageUploadZoneProps {
  chapterId: string;
  onUploadComplete: () => void;
  uploadImageFn: (chapterId: string, file: File) => Promise<void>;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  chapterId,
  onUploadComplete,
  uploadImageFn,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 3 * 1024 * 1024; // 3MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Định dạng không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.`;
    }

    if (file.size > maxSize) {
      return `${file.name}: Kích thước vượt quá 3MB.`;
    }

    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate max 200 files
    if (fileArray.length > 200) {
      alert("Tối đa 200 ảnh được phép tải lên cùng lúc.");
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length === 0) return;

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = validFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
    }));
    setUploadProgress(initialProgress);

    // Upload files sequentially
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        // Update progress to uploading
        setUploadProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 50 } : item
          )
        );

        await uploadImageFn(chapterId, file);

        // Update progress to complete
        setUploadProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 100 } : item
          )
        );
      } catch (error) {
        console.error("Upload failed:", error);
        // Update progress with error
        setUploadProgress((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, progress: 0, error: "Tải lên thất bại" }
              : item
          )
        );
      }
    }

    // Clear progress after 2 seconds
    setTimeout(() => {
      setUploadProgress([]);
      onUploadComplete();
    }, 2000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white">Hình chương</h2>

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
          ${
            isDragging
              ? "border-brand-500 bg-brand-500/10"
              : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <div className="text-gray-300">
            <p className="text-base font-medium">
              Bấm chọn hoặc kéo thả vào đây
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Các ảnh cũ sẽ được tự động xóa, tối đa 200 ảnh, mỗi ảnh ≤ 3MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">
            Đang tải lên ({uploadProgress.filter((p) => p.progress === 100).length}/
            {uploadProgress.length})
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {uploadProgress.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-xs text-gray-400 bg-gray-800/50 rounded p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.fileName}</p>
                </div>
                {item.error ? (
                  <span className="text-red-400">{item.error}</span>
                ) : item.progress === 100 ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
