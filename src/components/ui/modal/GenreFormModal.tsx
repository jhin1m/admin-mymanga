"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./index";
import Button from "../button/Button";

interface GenreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  mode: "create" | "edit";
  isLoading?: boolean;
}

export const GenreFormModal: React.FC<GenreFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  mode,
  isLoading = false,
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setError("");
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Tên thể loại không được để trống");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Tên thể loại phải có ít nhất 2 ký tự");
      return;
    }

    if (trimmedName.length > 255) {
      setError("Tên thể loại không được vượt quá 255 ký tự");
      return;
    }

    setError("");
    onSubmit(trimmedName);
  };

  const title = mode === "create" ? "Tạo thể loại mới" : "Sửa tên thể loại";
  const submitText = mode === "create" ? "Tạo mới" : "Cập nhật";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xl mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === "create"
            ? "Nhập tên thể loại để tạo mới"
            : "Cập nhật tên thể loại"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="genre-name"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tên thể loại <span className="text-red-500">*</span>
          </label>
          <input
            id="genre-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Nhập tên thể loại"
            disabled={isLoading}
            className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${
              error
                ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
            } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            autoFocus
          />
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang xử lý...
              </span>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
