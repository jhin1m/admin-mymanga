"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import ChapterInfoForm from "@/components/manga/ChapterInfoForm";
import ImagePreviewZone, { UploadStatus } from "@/components/manga/ImagePreviewZone";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";

const CreateNewChapterPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const mangaIdParam = searchParams.get("manga_id");

  const [chapterName, setChapterName] = useState("");
  const [mangaName, setMangaName] = useState("");
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<Map<number, { status: UploadStatus; error?: string }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal state
  const { isOpen: isConfirmOpen, openModal: openConfirmModal, closeModal: closeConfirmModal } = useModal();

  // Alert state
  interface AlertState {
    show: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    variant: "info",
    title: "",
    message: "",
  });

  const showAlert = (variant: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setAlert({ show: true, variant, title, message });
    // Auto-hide after 5 seconds for success messages
    if (variant === "success") {
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  // Load manga data if manga_id is provided in query params
  useEffect(() => {
    const loadMangaData = async () => {
      if (!token || !mangaIdParam) {
        showAlert("error", "Lỗi", "Không tìm thấy manga_id. Vui lòng truy cập từ trang quản lý truyện.");
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.getMangaById(token, mangaIdParam);
        if (response.success && response.data) {
          setMangaName(response.data.name);
        } else {
          showAlert("error", "Lỗi", "Không thể tải thông tin truyện");
        }
      } catch (error) {
        console.error("Error loading manga data:", error);
        showAlert("error", "Lỗi", "Không thể tải thông tin truyện");
      } finally {
        setLoading(false);
      }
    };

    loadMangaData();
  }, [token, mangaIdParam]);

  const handleCreateClick = () => {
    // Validation before opening modal
    if (!chapterName.trim()) {
      showAlert("warning", "Thiếu thông tin", "Vui lòng nhập tên chương");
      return;
    }
    if (!mangaIdParam) {
      showAlert("warning", "Thiếu thông tin", "Không tìm thấy manga_id");
      return;
    }
    openConfirmModal();
  };

  const handleConfirmCreate = async () => {
    if (!token || !mangaIdParam) return;

    setCreating(true);
    setUploadStatuses(new Map()); // Reset upload statuses

    try {
      // Step 1: Create the chapter
      const response = await apiService.createChapter(token, mangaIdParam, chapterName);

      if (!response.success || !response.data) {
        showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi tạo chương");
        setCreating(false);
        return;
      }

      const newChapterId = response.data.id;
      closeConfirmModal(); // Close modal after successful creation

      // Step 2: Upload pending images with status tracking if any
      if (pendingImages.length > 0) {
        const uploadErrors: string[] = [];
        let successCount = 0;

        for (let i = 0; i < pendingImages.length; i++) {
          // Update status to uploading
          setUploadStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(i, { status: "uploading" });
            return newMap;
          });

          try {
            await apiService.uploadChapterImage(token, newChapterId, pendingImages[i]);

            // Update status to success
            setUploadStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(i, { status: "success" });
              return newMap;
            });
            successCount++;
          } catch (error: any) {
            console.error(`Error uploading image ${i + 1}:`, error);
            const errorMsg = error.message || "Lỗi tải lên";
            uploadErrors.push(`Ảnh ${i + 1}: ${errorMsg}`);

            // Update status to error
            setUploadStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(i, { status: "error", error: errorMsg });
              return newMap;
            });
          }
        }

        // Show result
        if (uploadErrors.length > 0) {
          if (successCount > 0) {
            showAlert("warning", `Tạo chương thành công. Đã tải lên ${successCount}/${pendingImages.length} ảnh`, uploadErrors.join("\n"));
          } else {
            showAlert("warning", "Tạo chương thành công nhưng tất cả ảnh tải lên thất bại", uploadErrors.join("\n"));
          }
        } else {
          showAlert("success", "Thành công", "Đã tạo chương và tải lên tất cả ảnh thành công");
        }

        // Wait a bit to show final status, then redirect
        setTimeout(() => {
          router.push(`/admin/chapters/${newChapterId}/edit`);
        }, 2000);
      } else {
        showAlert("success", "Thành công", "Đã tạo chương mới thành công");
        // Redirect immediately if no images to upload
        setTimeout(() => {
          router.push(`/admin/chapters/${newChapterId}/edit`);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      const errorMessage = error.errors
        ? Object.values(error.errors).flat().join(", ")
        : error.message || "Có lỗi xảy ra khi tạo chương";
      showAlert("error", "Lỗi", errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleFilesSelected = (files: File[]) => {
    setPendingImages(files);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 p-6">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6 bg-gray-900 rounded-xl px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-300">Tạo chương mới</span>
            {mangaName && (
              <span className="text-xs text-gray-500">
                Truyện: <span className="text-brand-400">{mangaName}</span>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleCreateClick}
              disabled={creating}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Tạo chương
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className="mb-4">
            <Alert
              variant={alert.variant}
              title={alert.title}
              message={alert.message}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          {/* Chapter Info Form */}
          <ChapterInfoForm name={chapterName} onChange={setChapterName} />

          {/* Image Preview Zone */}
          <ImagePreviewZone
            pendingFiles={pendingImages}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemovePendingFile}
            disabled={creating}
            uploadStatuses={uploadStatuses}
          />
        </div>

        {/* Confirm Create Modal */}
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmCreate}
          title="Xác nhận tạo chương"
          message={`Bạn có chắc chắn muốn tạo chương "${chapterName}"${mangaName ? ` cho truyện "${mangaName}"` : ""}?`}
          confirmText="Tạo"
          cancelText="Hủy"
          confirmVariant="primary"
          isLoading={creating}
        />
      </div>
    </ProtectedRoute>
  );
};

export default CreateNewChapterPage;
