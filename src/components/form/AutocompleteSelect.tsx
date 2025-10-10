"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface Option {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  placeholder?: string;
  value?: string;
  initialLabel?: string; // Initial display label
  onChange: (value: string, option?: Option) => void;
  onSearch: (query: string) => Promise<Option[]>;
  className?: string;
  disabled?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
}

const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  placeholder = "Tìm kiếm...",
  value = "",
  initialLabel = "",
  onChange,
  onSearch,
  className = "",
  disabled = false,
  minSearchLength = 2,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState(initialLabel);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minSearchLength) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const results = await onSearch(searchQuery);
      setOptions(results);
    } catch (error) {
      console.error("Search error:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch, minSearchLength]);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch, debounceMs]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setFocusedIndex(-1);

    // If input is cleared, clear selection
    if (!newQuery) {
      onChange("", undefined);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: Option) => {
    setQuery(option.label);
    setIsOpen(false);
    setFocusedIndex(-1);
    onChange(option.value, option);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && options[focusedIndex]) {
          handleOptionSelect(options[focusedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Update query when initialLabel or value changes
  useEffect(() => {
    if (initialLabel) {
      setQuery(initialLabel);
    } else if (!value) {
      setQuery("");
    }
  }, [initialLabel, value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Đang tìm kiếm...
            </div>
          ) : options.length > 0 ? (
            <ul className="py-1">
              {options.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleOptionSelect(option)}
                  className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                    index === focusedIndex
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : query.length >= minSearchLength ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Không tìm thấy kết quả
            </div>
          ) : query.length > 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Nhập ít nhất {minSearchLength} ký tự để tìm kiếm
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSelect;