"use client";
import React, { useRef, useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface ImageWithStatus {
  file: File;
  previewUrl: string;
  status: UploadStatus;
  error?: string;
}

interface ImagePreviewZoneProps {
  pendingFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  uploadStatuses?: Map<number, { status: UploadStatus; error?: string }>;
}

// Status Icon Components
const UploadingIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Draggable Image Item
interface DraggableImageItemProps {
  preview: ImageWithStatus;
  index: number;
  onRemove: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  disabled: boolean;
}

const DraggableImageItem: React.FC<DraggableImageItemProps> = ({
  preview,
  index,
  onRemove,
  onMove,
  disabled,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "IMAGE",
    item: { index },
    canDrag: !disabled && preview.status === "pending",
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "IMAGE",
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const getStatusBadge = () => {
    switch (preview.status) {
      case "uploading":
        return (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 rounded text-xs text-white font-medium flex items-center gap-1">
            <UploadingIcon />
            <span>Đang tải lên</span>
          </div>
        );
      case "success":
        return (
          <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 rounded text-xs text-white font-medium flex items-center gap-1">
            <SuccessIcon />
            <span>Thành công</span>
          </div>
        );
      case "error":
        return (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 rounded text-xs text-white font-medium flex items-center gap-1">
            <ErrorIcon />
            <span>Thất bại</span>
          </div>
        );
      default:
        return (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 rounded text-xs text-white font-medium">
            Chờ tải lên
          </div>
        );
    }
  };

  return (
    <div
      ref={ref}
      className={`relative bg-gray-800/50 rounded-lg overflow-hidden group transition-all ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isOver ? "ring-2 ring-brand-500" : ""} ${
        preview.status === "pending" && !disabled ? "cursor-move" : ""
      }`}
    >
      <div className="aspect-square relative">
        <img
          src={preview.previewUrl}
          alt={`Preview ${index + 1}`}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">#{index + 1}</span>
            <span className="text-xs text-gray-300">
              {(preview.file.size / 1024).toFixed(0)} KB
            </span>
          </div>
        </div>
      </div>

      {/* Status badge */}
      {getStatusBadge()}

      {/* Delete button - only show if not uploading/success */}
      {preview.status !== "uploading" && preview.status !== "success" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
          className="absolute top-2 right-2 p-1.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Xóa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Error message tooltip */}
      {preview.status === "error" && preview.error && (
        <div className="absolute inset-x-0 bottom-full mb-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {preview.error}
        </div>
      )}
    </div>
  );
};

const ImagePreviewZone: React.FC<ImagePreviewZoneProps> = ({
  pendingFiles,
  onFilesSelected,
  onRemoveFile,
  disabled = false,
  uploadStatuses = new Map(),
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<ImageWithStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs when pendingFiles or uploadStatuses change
  useEffect(() => {
    // Clean up old preview URLs
    previews.forEach(preview => {
      URL.revokeObjectURL(preview.previewUrl);
    });

    // Generate new preview URLs with status
    const newPreviews: ImageWithStatus[] = pendingFiles.map((file, index) => {
      const statusInfo = uploadStatuses.get(index);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        status: statusInfo?.status || "pending",
        error: statusInfo?.error,
      };
    });
    setPreviews(newPreviews);

    // Cleanup on unmount
    return () => {
      newPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.previewUrl);
      });
    };
  }, [pendingFiles, uploadStatuses]);

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

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate max 200 files total (including existing)
    if (pendingFiles.length + fileArray.length > 200) {
      alert(`Tối đa 200 ảnh. Bạn đã có ${pendingFiles.length} ảnh, chỉ có thể thêm ${200 - pendingFiles.length} ảnh nữa.`);
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

    // Add new files to existing pending files
    onFilesSelected([...pendingFiles, ...validFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
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
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemovePreview = (index: number) => {
    onRemoveFile(index);
  };

  const handleMoveImage = (dragIndex: number, hoverIndex: number) => {
    const newFiles = [...pendingFiles];
    const draggedFile = newFiles[dragIndex];
    newFiles.splice(dragIndex, 1);
    newFiles.splice(hoverIndex, 0, draggedFile);
    onFilesSelected(newFiles);
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Hình chương</h2>
        {previews.length > 0 && (
          <span className="text-sm text-gray-400">
            {previews.length} ảnh đang chờ
          </span>
        )}
      </div>

      {/* Upload Zone */}
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
              : disabled
              ? "border-gray-700 bg-gray-800/30 cursor-not-allowed opacity-50"
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
          disabled={disabled}
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
              Chọn ảnh để xem trước, tối đa 200 ảnh, mỗi ảnh ≤ 3MB
            </p>
            <p className="text-xs text-blue-400 mt-2">
              Ảnh sẽ được tải lên khi bạn nhấn "Lưu"
            </p>
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-300">
              Xem trước ({previews.length} ảnh)
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFilesSelected([]);
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto p-1">
            {previews.map((preview, index) => (
              <DraggableImageItem
                key={index}
                preview={preview}
                index={index}
                onRemove={() => handleRemovePreview(index)}
                onMove={handleMoveImage}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </DndProvider>
  );
};

export default ImagePreviewZone;
