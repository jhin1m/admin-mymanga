"use client";
import React, { useState, useMemo } from "react";
import Checkbox from "@/components/form/input/Checkbox";

interface Genre {
  id: number;
  name: string;
  slug: string;
}

interface GenreCheckboxGridProps {
  genres: Genre[];
  selectedGenres: number[];
  onChange: (selectedIds: number[]) => void;
  className?: string;
}

const GenreCheckboxGrid: React.FC<GenreCheckboxGridProps> = ({
  genres,
  selectedGenres,
  onChange,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter genres based on search query
  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return genres;
    const query = searchQuery.toLowerCase();
    return genres.filter(genre =>
      genre.name.toLowerCase().includes(query) ||
      genre.slug.toLowerCase().includes(query)
    );
  }, [genres, searchQuery]);

  const handleToggle = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onChange([...selectedGenres, genreId]);
    }
  };

  const handleSelectAll = () => {
    onChange(filteredGenres.map(g => g.id));
  };

  const handleDeselectAll = () => {
    const filteredIds = filteredGenres.map(g => g.id);
    onChange(selectedGenres.filter(id => !filteredIds.includes(id)));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Tìm kiếm thể loại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/30 transition-colors"
          >
            Chọn tất cả
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Genre grid */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
        {filteredGenres.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredGenres.map((genre) => (
              <div
                key={genre.id}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                <Checkbox
                  id={`genre-${genre.id}`}
                  label={genre.name}
                  checked={selectedGenres.includes(genre.id)}
                  onChange={() => handleToggle(genre.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Không tìm thấy thể loại nào
          </div>
        )}
      </div>

      {/* Selected count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Đã chọn: <span className="font-medium">{selectedGenres.length}</span> thể loại
      </div>
    </div>
  );
};

export default GenreCheckboxGrid;
