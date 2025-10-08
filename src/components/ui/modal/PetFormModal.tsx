"use client";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./index";
import Button from "../button/Button";

interface PetData {
  name: string;
  price: number;
  image?: File | null;
}

interface PetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PetData) => void;
  initialData?: {
    name?: string;
    price?: number;
    image_full_url?: string;
  };
  mode: "create" | "edit";
  isLoading?: boolean;
}

export const PetFormModal: React.FC<PetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<PetData>({
    name: "",
    price: 0,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof PetData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          price: initialData.price || 0,
          image: null,
        });
        setImagePreview(initialData.image_full_url || "");
      } else {
        setFormData({
          name: "",
          price: 0,
          image: null,
        });
        setImagePreview("");
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof PetData, value: string | number | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: "Vui lòng chọn file ảnh" }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Kích thước ảnh không được vượt quá 5MB" }));
        return;
      }

      handleChange("image", file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PetData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên bạn đồng hành không được để trống";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên bạn đồng hành phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 255) {
      newErrors.name = "Tên bạn đồng hành không được vượt quá 255 ký tự";
    }

    if (formData.price < 0) {
      newErrors.price = "Giá không được âm";
    }

    if (mode === "create" && !formData.image) {
      newErrors.image = "Vui lòng chọn ảnh cho bạn đồng hành";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      name: formData.name.trim(),
    });
  };

  const title = mode === "create" ? "Tạo bạn đồng hành mới" : "Sửa bạn đồng hành";
  const submitText = mode === "create" ? "Tạo mới" : "Cập nhật";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-6">
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xl mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === "create"
            ? "Nhập thông tin bạn đồng hành để tạo mới"
            : "Cập nhật thông tin bạn đồng hành"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ảnh hiện tại
              </label>
              <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <img
                  src={imagePreview}
                  alt="Pet preview"
                  className="max-h-[200px] max-w-full object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === "create" ? "Ảnh bạn đồng hành" : "Thay đổi ảnh"}
              {mode === "create" && <span className="text-red-500"> *</span>}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 focus:outline-hidden focus:ring-3 ${
                errors.image
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:file:bg-brand-900 dark:file:text-brand-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.image && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.image}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Chấp nhận file ảnh (PNG, JPG, GIF). Tối đa 5MB.
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên bạn đồng hành <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nhập tên bạn đồng hành"
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${
                errors.name
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giá <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange("price", parseInt(e.target.value) || 0)}
              placeholder="Nhập giá"
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${
                errors.price
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.price && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.price}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
