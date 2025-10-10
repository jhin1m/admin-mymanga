"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./index";
import Button from "../button/Button";
import Select from "../../form/Select";

interface AchievementData {
  name: string;
  font_family: string;
  font_size: string;
  color: string;
  weight: string;
  font_style: string;
  text_shadow: string;
  required_points: number;
}

interface AchievementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AchievementData) => void;
  initialData?: Partial<AchievementData>;
  mode: "create" | "edit";
  isLoading?: boolean;
}

const FONT_OPTIONS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Garamond, serif", label: "Garamond" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Brush Script MT', cursive", label: "Brush Script MT" },
];

const FONT_SIZE_OPTIONS = [
  { value: "16", label: "16px" },
  { value: "17", label: "17px" },
  { value: "18", label: "18px" },
  { value: "19", label: "19px" },
  { value: "20", label: "20px" },
];

const FONT_STYLE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "italic", label: "Italic" },
  { value: "oblique", label: "Oblique" },
];

export const AchievementFormModal: React.FC<AchievementFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<AchievementData>({
    name: "",
    font_family: "Arial, sans-serif",
    font_size: "16",
    color: "#000000",
    weight: "400",
    font_style: "normal",
    text_shadow: "unset",
    required_points: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AchievementData, string>>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          font_family: initialData.font_family || "Arial, sans-serif",
          font_size: initialData.font_size || "16",
          color: initialData.color || "#000000",
          weight: initialData.weight || "400",
          font_style: initialData.font_style || "normal",
          text_shadow: initialData.text_shadow || "unset",
          required_points: initialData.required_points || 0,
        });
      } else {
        setFormData({
          name: "",
          font_family: "Arial, sans-serif",
          font_size: "16",
          color: "#000000",
          weight: "400",
          font_style: "normal",
          text_shadow: "unset",
          required_points: 0,
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof AchievementData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AchievementData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên danh hiệu không được để trống";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên danh hiệu phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 255) {
      newErrors.name = "Tên danh hiệu không được vượt quá 255 ký tự";
    }

    const weight = parseInt(formData.weight);
    if (isNaN(weight) || weight < 100 || weight > 900) {
      newErrors.weight = "Độ đậm nhạt phải từ 100 đến 900";
    }

    if (formData.required_points < 0) {
      newErrors.required_points = "Điểm không được âm";
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

  const title = mode === "create" ? "Tạo danh hiệu mới" : "Sửa danh hiệu";
  const submitText = mode === "create" ? "Tạo mới" : "Cập nhật";

  const previewStyle = {
    fontFamily: formData.font_family,
    fontSize: `${formData.font_size}px`,
    color: formData.color,
    fontWeight: formData.weight,
    fontStyle: formData.font_style,
    textShadow: formData.text_shadow === "unset" ? "none" : formData.text_shadow,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-6">
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xl mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === "create"
            ? "Nhập thông tin danh hiệu để tạo mới"
            : "Cập nhật thông tin danh hiệu"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Live Preview */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </label>
          <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-900 rounded min-h-[60px]">
            <span style={previewStyle}>
              {formData.name || "Xem trước danh hiệu"}
            </span>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nhập tên danh hiệu"
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

          {/* Font Family */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font chữ
            </label>
            <Select
              options={FONT_OPTIONS}
              defaultValue={formData.font_family}
              onChange={(value) => handleChange("font_family", value)}
              placeholder="Chọn font chữ"
            />
          </div>

          {/* Font Size */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cỡ chữ
            </label>
            <Select
              options={FONT_SIZE_OPTIONS}
              defaultValue={formData.font_size}
              onChange={(value) => handleChange("font_size", value)}
              placeholder="Chọn cỡ chữ"
            />
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Màu chữ
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="h-11 w-20 appearance-none rounded-lg border border-gray-300 cursor-pointer dark:border-gray-700 dark:bg-gray-900"
                disabled={isLoading}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                placeholder="#000000"
                className="h-11 flex-1 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Độ đậm nhạt (100-900)
            </label>
            <input
              type="number"
              min="100"
              max="900"
              step="100"
              value={formData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 ${
                errors.weight
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50`}
              disabled={isLoading}
            />
            {errors.weight && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.weight}
              </p>
            )}
          </div>

          {/* Font Style */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kiểu chữ
            </label>
            <Select
              options={FONT_STYLE_OPTIONS}
              defaultValue={formData.font_style}
              onChange={(value) => handleChange("font_style", value)}
              placeholder="Chọn kiểu chữ"
            />
          </div>

          {/* Text Shadow */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Đổ bóng (text shadow)
            </label>
            <input
              type="text"
              value={formData.text_shadow}
              onChange={(e) => handleChange("text_shadow", e.target.value)}
              placeholder="VD: 2px 2px 4px rgba(0,0,0,0.5)"
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Để &quot;unset&quot; nếu không muốn có đổ bóng
            </p>
          </div>

          {/* Required Points */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Điểm cần để đạt được
            </label>
            <input
              type="number"
              min="0"
              value={formData.required_points}
              onChange={(e) => handleChange("required_points", parseInt(e.target.value) || 0)}
              className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 ${
                errors.required_points
                  ? "border-red-300 focus:border-red-300 focus:ring-red-500/10"
                  : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
              } dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50`}
              disabled={isLoading}
            />
            {errors.required_points && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.required_points}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <button
            type="submit"
            className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
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
          </button>
        </div>
      </form>
    </Modal>
  );
};
