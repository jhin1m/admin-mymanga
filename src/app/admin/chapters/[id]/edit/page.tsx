"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import ChapterInfoForm from "@/components/manga/ChapterInfoForm";
import ImageUploadZone from "@/components/manga/ImageUploadZone";
import ImageList from "@/components/manga/ImageList";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
      alert(error.message || "Không thể tải thông tin chương");
      router.push("/admin/mangas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapterData();
  }, [token, chapterId]);

  const handleSave = async () => {
    if (!token || !chapterId) return;

    if (!chapterName.trim()) {
      alert("Vui lòng nhập tên chương");
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateChapter(token, chapterId, {
        name: chapterName,
      });

      if (response.success) {
        alert("Đã lưu thông tin chương thành công");
        await fetchChapterData();
      }
    } catch (error: any) {
      console.error("Error saving chapter:", error);
      alert(error.message || "Có lỗi xảy ra khi lưu chương");
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
    // Note: The API documentation doesn't specify a delete image endpoint
    // This is a placeholder - you may need to implement this based on actual API
    alert("Tính năng xóa ảnh riêng lẻ chưa được hỗ trợ. Tải lên ảnh mới sẽ tự động thay thế toàn bộ.");
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
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang lưu...
              </>
            ) : (
              "Lưu"
            )}
          </button>
        </div>

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
      </div>
    </ProtectedRoute>
  );
};

export default ChapterEditPage;
