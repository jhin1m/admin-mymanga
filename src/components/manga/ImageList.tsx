"use client";
import React, { useState } from "react";
import Image from "next/image";

interface ImageListProps {
  images: string[];
  onDelete?: (imageUrl: string, index: number) => void;
}

const ImageListItem: React.FC<{
  imageUrl: string;
  index: number;
  onDelete?: (imageUrl: string, index: number) => void;
}> = ({ imageUrl, index, onDelete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(imageUrl, index);
    }
  };

  return (
    <div className="relative bg-gray-800/50 rounded-lg overflow-hidden">
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

      {/* Delete button */}
      {onDelete && (
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

const ImageList: React.FC<ImageListProps> = ({ images, onDelete }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">
          Danh sách hình ảnh
        </h2>
        <span className="text-sm text-gray-400">
          Tổng: {images.length} ảnh
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto">
        {images.map((imageUrl, index) => (
          <ImageListItem
            key={`${imageUrl}-${index}`}
            imageUrl={imageUrl}
            index={index}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageList;
