"use client";
import React from "react";
import { Modal } from "./index";
import Button from "../button/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmVariant = "primary",
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {confirmVariant === "danger" && (
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}
          <h4 className="font-semibold text-gray-900 dark:text-white text-xl">
            {title}
          </h4>
        </div>
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400 whitespace-pre-line">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isLoading}
          className={
            confirmVariant === "danger"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : ""
          }
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Đang xử lý...
            </span>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </Modal>
  );
};
