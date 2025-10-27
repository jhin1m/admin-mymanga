"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import ChapterInfoForm from "@/components/manga/ChapterInfoForm";
import ImagePreviewZone, { UploadStatus } from "@/components/manga/ImagePreviewZone";
import ImageList from "@/components/manga/ImageList";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Alert from "@/components/ui/alert/Alert";
import Breadcrumb, { BreadcrumbItem } from "@/components/common/Breadcrumb";

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

interface ChapterApiResponse {
  success: boolean;
  data: Chapter;
  message?: string;
  code: number;
}

interface Manga {
  id: string;
  name: string;
  slug: string;
}

interface MangaApiResponse {
  success: boolean;
  data: Manga;
  message?: string;
  code: number;
}

const ChapterEditPage = () => {
  const params = useParams();
  const { token } = useAuth();
  const chapterId = params.id as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterName, setChapterName] = useState("");
  const [mangaName, setMangaName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<Map<number, { status: UploadStatus; error?: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

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

  const fetchChapterData = useCallback(async () => {
    if (!token || !chapterId) return;

    setLoading(true);
    try {
      const response = await apiService.getChapterById(token, chapterId) as ChapterApiResponse;

      if (response.success && response.data) {
        const data = response.data;
        setChapter(data);
        setChapterName(data.name);
        setImages(data.content || []);
        setLastUpdated(formatDateTime(data.updated_at));

        // Fetch manga information for breadcrumb
        if (data.manga_id) {
          try {
            const mangaResponse = await apiService.getMangaById(token, data.manga_id) as MangaApiResponse;
            if (mangaResponse.success && mangaResponse.data) {
              setMangaName(mangaResponse.data.name);
            }
          } catch (mangaError) {
            console.error("Error fetching manga:", mangaError);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error fetching chapter:", error);
      const errorMessage = error instanceof Error ? error.message : "Không thể tải thông tin chương";
      showAlert("error", "Lỗi tải dữ liệu", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, chapterId]);

  useEffect(() => {
    fetchChapterData();
  }, [fetchChapterData]);

  const handleSaveClick = async () => {
    // Validation
    if (!chapterName.trim()) {
      showAlert("warning", "Thiếu thông tin", "Vui lòng nhập tên chương");
      return;
    }

    if (!token || !chapterId) return;

    setSaving(true);
    setUploadStatuses(new Map()); // Reset upload statuses

    try {
      // Step 1: Update chapter name and reorder existing images if needed
      const nameChanged = chapterName !== chapter?.name;
      const originalImageCount = chapter?.content?.length || 0;
      const hasDeletedImages = images.length < originalImageCount;

      // Always update chapter to sync name and existing image order
      if (nameChanged || images.length > 0) {
        const response = await apiService.updateChapter(token, chapterId, {
          name: chapterName,
          imageUrls: images.length > 0 ? images : undefined,
        });

        if (!response.success) {
          showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi lưu chương");
          setSaving(false);
          return;
        }
      }

      // Step 2: Handle image deletion by clearing if needed
      if (hasDeletedImages && pendingImages.length === 0) {
        // User only deleted images without adding new ones
        await apiService.clearChapterImages(token, chapterId);
        showAlert("success", "Thành công", "Đã xóa ảnh thành công");
        setPendingImages([]);
        await fetchChapterData();
        setSaving(false);
        return;
      }

      // Step 3: Upload new pending images with status tracking
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
            await apiService.uploadChapterImage(token, chapterId, pendingImages[i]);

            // Update status to success
            setUploadStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(i, { status: "success" });
              return newMap;
            });
            successCount++;
          } catch (error: unknown) {
            console.error(`Error uploading image ${i + 1}:`, error);
            const errorMsg = error instanceof Error ? error.message : "Lỗi tải lên";
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
            showAlert("warning", `Đã tải lên ${successCount}/${pendingImages.length} ảnh`, uploadErrors.join("\n"));
          } else {
            showAlert("error", "Tải lên thất bại", uploadErrors.join("\n"));
          }
        } else {
          showAlert("success", "Thành công", "Đã lưu thông tin chương và tải lên tất cả ảnh thành công");
        }

        // Wait a bit to show final status, then clear
        setTimeout(() => {
          setPendingImages([]);
          setUploadStatuses(new Map());
          fetchChapterData();
        }, 2000);
      } else if (nameChanged || images.length > 0) {
        showAlert("success", "Thành công", "Đã cập nhật chương thành công");
        await fetchChapterData();
      }
    } catch (error: unknown) {
      console.error("Error saving chapter:", error);
      let errorMessage = "Có lỗi xảy ra khi lưu chương";

      if (error && typeof error === 'object' && 'errors' in error) {
        const errorObj = error as { errors: Record<string, string[]> };
        errorMessage = Object.values(errorObj.errors).flat().join(", ");
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showAlert("error", "Lỗi", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setPendingImages(files);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageUrl: string, index: number) => {
    // Virtual delete - only remove from local state
    // Changes will be saved when user clicks "Lưu"
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleReorderImages = (newOrder: string[]) => {
    setImages(newOrder);
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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Quản lý truyện", href: "/admin/mangas" },
  ];

  if (mangaName && chapter) {
    breadcrumbItems.push(
      { label: mangaName, href: `/admin/mangas/${chapter.manga_id}/edit` },
      { label: `Chỉnh sửa chương: ${chapterName}` }
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          pageTitle={`Chỉnh sửa chương${chapterName ? `: ${chapterName}` : ""}`}
          items={breadcrumbItems}
        />

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

          {/* Image Preview Zone - For new images */}
          <ImagePreviewZone
            pendingFiles={pendingImages}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemovePendingFile}
            disabled={saving}
            uploadStatuses={uploadStatuses}
          />

          {/* Image List - For existing images */}
          <ImageList
            images={images}
            onDelete={handleDeleteImage}
            onReorder={handleReorderImages}
            disabled={saving}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ChapterEditPage;
