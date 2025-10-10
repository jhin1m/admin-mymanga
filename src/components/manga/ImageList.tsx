"use client";
import React, { useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface ImageListProps {
  images: string[];
  onDelete?: (imageUrl: string, index: number) => void;
  onReorder?: (newOrder: string[]) => void;
  disabled?: boolean;
}

interface ImageListItemProps {
  imageUrl: string;
  index: number;
  onDelete?: (imageUrl: string, index: number) => void;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  disabled?: boolean;
}

const ImageListItem: React.FC<ImageListItemProps> = ({
  imageUrl,
  index,
  onDelete,
  onMove,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(imageUrl, index);
    }
  };

  // Drag and Drop setup
  const [{ isDragging }, drag] = useDrag({
    type: "EXISTING_IMAGE",
    item: { index },
    canDrag: !disabled && !!onMove,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "EXISTING_IMAGE",
    hover: (item: { index: number }) => {
      if (!ref.current || !onMove) return;
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

  // Connect drag and drop refs
  if (onMove && !disabled) {
    drag(drop(ref));
  }

  return (
    <div
      ref={ref}
      className={`relative bg-gray-800/50 rounded-lg overflow-hidden transition-all ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isOver ? "ring-2 ring-brand-500" : ""} ${
        onMove && !disabled ? "cursor-move" : ""
      }`}
    >
      <div className="aspect-square relative">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-8 h-8 text-gray-500 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs text-gray-400">Lỗi tải ảnh</span>
            </div>
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt={`Page ${index + 1}`}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Gradient overlay */}
        {!hasError && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <span className="text-xs font-medium text-white">
                Page {index + 1}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Drag indicator icon */}
      {onMove && !disabled && (
        <div className="absolute top-2 left-2 p-1.5 bg-gray-700/80 rounded-lg">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      )}

      {/* Delete button */}
      {onDelete && !disabled && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg z-10"
          title="Xóa"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

const ImageList: React.FC<ImageListProps> = ({ images, onDelete, onReorder, disabled = false }) => {
  if (images.length === 0) {
    return null;
  }

  const handleMoveImage = (dragIndex: number, hoverIndex: number) => {
    if (!onReorder) return;

    const newImages = [...images];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedImage);
    onReorder(newImages);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            Danh sách hình ảnh
          </h2>
          <div className="flex items-center gap-3">
            {onReorder && !disabled && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h16M4 16h16"
                  />
                </svg>
                Kéo thả để sắp xếp
              </span>
            )}
            <span className="text-sm text-gray-400">
              Tổng: {images.length} ảnh
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto">
          {images.map((imageUrl, index) => (
            <ImageListItem
              key={`${imageUrl}-${index}`}
              imageUrl={imageUrl}
              index={index}
              onDelete={onDelete}
              onMove={onReorder ? handleMoveImage : undefined}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default ImageList;
