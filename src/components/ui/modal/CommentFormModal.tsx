"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./index";
import Button from "../button/Button";
import TextArea from "@/components/form/input/TextArea";

interface CommentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CommentFormData) => void;
  initialData?: CommentFormData;
  isLoading?: boolean;
}

export interface CommentFormData {
  content: string;
  commentable_type: string;
  commentable_id: string;
  parent_id?: string;
}

export const CommentFormModal: React.FC<CommentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CommentFormData>({
    content: "",
    commentable_type: "App\\Models\\Manga",
    commentable_id: "",
    parent_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Utility to strip HTML tags
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        ...initialData,
        content: stripHtml(initialData.content), // Strip HTML for plain text editing
      });
      setErrors({});
    } else if (isOpen) {
      setFormData({
        content: "",
        commentable_type: "App\\Models\\Manga",
        commentable_id: "",
        parent_id: "",
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Only validate content (other fields are hidden)
    if (!formData.content.trim()) {
      newErrors.content = "Nội dung không được để trống";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Submit all data (including hidden fields) to avoid backend errors
    const submitData: CommentFormData = {
      content: formData.content,
      commentable_type: formData.commentable_type,
      commentable_id: formData.commentable_id,
    };

    // Include parent_id if it exists
    if (formData.parent_id && formData.parent_id.trim()) {
      submitData.parent_id = formData.parent_id.trim();
    }

    onSubmit(submitData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-6">
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xl mb-1">
          Sửa nội dung comment
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chỉnh sửa nội dung văn bản (HTML tags sẽ bị loại bỏ)
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Only show Content field - hide all other fields */}
        <div>
          <label
            htmlFor="comment-content"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nội dung <span className="text-red-500">*</span>
          </label>
          <TextArea
            placeholder="Nhập nội dung comment"
            rows={6}
            value={formData.content}
            onChange={(value) => {
              setFormData({ ...formData, content: value });
              if (errors.content) {
                setErrors({ ...errors, content: "" });
              }
            }}
            disabled={isLoading}
            error={!!errors.content}
            hint={errors.content}
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
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
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
