"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import ChapterInfoForm from "@/components/manga/ChapterInfoForm";
import ImageUploadZone from "@/components/manga/ImageUploadZone";
import ImageList from "@/components/manga/ImageList";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { useModal } from "@/hooks/useModal";
import Alert from "@/components/ui/alert/Alert";

interface Chapter {
  id: string;
  slug: string;
  user_id: string;
  manga_id: string;
  name: string;
  content: string[];
  views: number;
  order: number;
  created_at: string;
  updated_at: string;
}

const ChapterEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const chapterId = params.id as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterName, setChapterName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchChapterData = async () => {
    if (!token || !chapterId) return;

    setLoading(true);
    try {
      const response = await apiService.getChapterById(token, chapterId);

      if (response.success && response.data) {
        const data = response.data as Chapter;
        setChapter(data);
        setChapterName(data.name);
        setImages(data.content || []);
        setLastUpdated(formatDateTime(data.updated_at));
      }
    } catch (error: any) {
      console.error("Error fetching chapter:", error);
      showAlert("error", "Lỗi tải dữ liệu", error.message || "Không thể tải thông tin chương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapterData();
  }, [token, chapterId]);

  const handleSaveClick = () => {
    // Validation before opening modal
    if (!chapterName.trim()) {
      showAlert("warning", "Thiếu thông tin", "Vui lòng nhập tên chương");
      return;
    }
    openConfirmModal();
  };

  const handleConfirmSave = async () => {
    if (!token || !chapterId) return;

    setSaving(true);
    try {
      const response = await apiService.updateChapter(token, chapterId, {
        name: chapterName,
        image_urls: images,
      });

      if (response.success) {
        showAlert("success", "Thành công", "Đã lưu thông tin chương thành công");
        closeConfirmModal();
        await fetchChapterData();
      } else {
        showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi lưu chương");
      }
    } catch (error: any) {
      console.error("Error saving chapter:", error);
      const errorMessage = error.errors
        ? Object.values(error.errors).flat().join(", ")
        : error.message || "Có lỗi xảy ra khi lưu chương";
      showAlert("error", "Lỗi", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (chapterId: string, file: File) => {
    if (!token) throw new Error("No token");
    await apiService.uploadChapterImage(token, chapterId, file);
  };

  const handleUploadComplete = () => {
    // Refresh chapter data to get updated images
    fetchChapterData();
  };

  const handleDeleteImage = async (imageUrl: string, index: number) => {
    // Virtual delete - only remove from local state
    // Changes will be saved when user clicks "Lưu"
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
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

  if (!chapter) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Không tìm thấy chương</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 p-6">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6 bg-gray-900 rounded-xl px-6 py-4">
          <div className="text-sm text-gray-400">
            Cập nhật lần cuối lúc{" "}
            <span className="font-medium text-gray-300">{lastUpdated}</span>
          </div>
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Lưu
          </button>
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

          {/* Image Upload Zone */}
          <ImageUploadZone
            chapterId={chapterId}
            onUploadComplete={handleUploadComplete}
            uploadImageFn={uploadImage}
          />

          {/* Image List */}
          <ImageList images={images} onDelete={handleDeleteImage} />
        </div>

        {/* Confirm Save Modal */}
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmSave}
          title="Xác nhận lưu"
          message={`Bạn có chắc chắn muốn lưu thay đổi cho chương "${chapterName}"?`}
          confirmText="Lưu"
          cancelText="Hủy"
          confirmVariant="primary"
          isLoading={saving}
        />
      </div>
    </ProtectedRoute>
  );
};

export default ChapterEditPage;
