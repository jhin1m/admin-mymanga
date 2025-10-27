"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./index";
import Button from "../button/Button";

interface AdFormData {
  name: string;
  type: string;
  location: string;
  position: string;
  code: string;
  is_active: boolean;
  order: number;
}

interface AdFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdFormData) => void;
  initialData?: Partial<AdFormData>;
  mode: "create" | "edit";
  isLoading?: boolean;
}

export const AdFormModal: React.FC<AdFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<AdFormData>({
    name: "",
    type: "banner",
    location: "home",
    position: "",
    code: "",
    is_active: true,
    order: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AdFormData, string>>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          type: initialData.type || "banner",
          location: initialData.location || "home",
          position: initialData.position || "",
          code: initialData.code || "",
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
          order: initialData.order !== undefined ? initialData.order : 0,
        });
      } else {
        setFormData({
          name: "",
          type: "banner",
          location: "home",
          position: "",
          code: "",
          is_active: true,
          order: 0,
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AdFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên quảng cáo không được để trống";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên quảng cáo phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 255) {
      newErrors.name = "Tên quảng cáo không được vượt quá 255 ký tự";
    }

    if (!formData.type) {
      newErrors.type = "Vui lòng chọn loại quảng cáo";
    }

    if (!formData.location) {
      newErrors.location = "Vui lòng chọn vị trí trang";
    }

    if (formData.position && formData.position.length > 50) {
      newErrors.position = "Vị trí cụ thể không được vượt quá 50 ký tự";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Mã HTML/JavaScript không được để trống";
    }

    if (formData.order < 0) {
      newErrors.order = "Thứ tự phải là số không âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      name: formData.name.trim(),
      position: formData.position.trim() || "",
      code: formData.code.trim(),
    };

    onSubmit(submitData);
  };

  const handleFieldChange = (field: keyof AdFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const title = mode === "create" ? "Tạo quảng cáo mới" : "Sửa quảng cáo";
  const submitText = mode === "create" ? "Tạo mới" : "Cập nhật";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-6">
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xl mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === "create"
            ? "Nhập thông tin quảng cáo để tạo mới"
            : "Cập nhật thông tin quảng cáo"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2"
             style={{ minHeight: "400px" }}>
          {/* Name */}
          <div>
            <label
              htmlFor="ad-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tên quảng cáo <span className="text-red-500">*</span>
            </label>
            <input
              id="ad-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Nhập tên quảng cáo"
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

          {/* Type */}
          <div>
            <label
              htmlFor="ad-type"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Loại <span className="text-red-500">*</span>
            </label>
            <select
              id="ad-type"
              value={formData.type}
              onChange={(e) => handleFieldChange("type", e.target.value)}
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 ${
                errors.type
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="banner">Banner</option>
              <option value="catfish">Catfish</option>
              <option value="other">Khác</option>
            </select>
            {errors.type && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.type}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="ad-location"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Vị trí trang <span className="text-red-500">*</span>
            </label>
            <select
              id="ad-location"
              value={formData.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 ${
                errors.location
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="home">Trang chủ</option>
              <option value="manga_detail">Chi tiết manga</option>
              <option value="chapter_content">Nội dung chapter</option>
              <option value="all_pages">Tất cả trang</option>
            </select>
            {errors.location && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.location}
              </p>
            )}
          </div>

          {/* Position */}
          <div>
            <label
              htmlFor="ad-position"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Vị trí cụ thể
            </label>
            <input
              id="ad-position"
              type="text"
              value={formData.position}
              onChange={(e) => handleFieldChange("position", e.target.value)}
              placeholder="vd: header_bottom, carousel_top, content_middle"
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${
                errors.position
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.position && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.position}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Tùy chọn: Chỉ định vị trí cụ thể trong trang (vd: header_bottom, sidebar_top)
            </p>
          </div>

          {/* Code */}
          <div>
            <label
              htmlFor="ad-code"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mã HTML/JavaScript <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ad-code"
              value={formData.code}
              onChange={(e) => handleFieldChange("code", e.target.value)}
              placeholder='<script>...</script> hoặc <div>...</div>'
              disabled={isLoading}
              rows={8}
              className={`w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 font-mono ${
                errors.code
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.code && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.code}
              </p>
            )}
          </div>

          {/* Order */}
          <div>
            <label
              htmlFor="ad-order"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Thứ tự hiển thị
            </label>
            <input
              id="ad-order"
              type="number"
              min="0"
              value={formData.order}
              onChange={(e) => handleFieldChange("order", parseInt(e.target.value) || 0)}
              disabled={isLoading}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 ${
                errors.order
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.order && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.order}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Số thứ tự hiển thị (0 = ưu tiên cao nhất)
            </p>
          </div>

          {/* Active */}
          <div className="flex items-center">
            <input
              id="ad-active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleFieldChange("is_active", e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="ad-active"
              className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kích hoạt ngay
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
