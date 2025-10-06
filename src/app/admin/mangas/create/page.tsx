"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import AutocompleteSelect from "@/components/form/AutocompleteSelect";
import GenreCheckboxGrid from "@/components/form/GenreCheckboxGrid";
import RichTextEditor from "@/components/form/RichTextEditor";
import ImageUploader from "@/components/form/ImageUploader";
import Switch from "@/components/form/switch/Switch";
import Alert from "@/components/ui/alert/Alert";

interface Genre {
  id: number;
  name: string;
  slug: string;
}

export default function CreateNewMangaPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Form data - all empty/default values
  const [name, setName] = useState("");
  const [nameAlt, setNameAlt] = useState("");
  const [doujinshiId, setDoujinshiId] = useState("");
  const [status, setStatus] = useState("2");
  const [artistId, setArtistId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [pilot, setPilot] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Options
  const [allGenres, setAllGenres] = useState<Genre[]>([]);

  // Fetch genres and set default user
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // Fetch all genres
        const genresResponse = await apiService.getGenresAll(token);
        if (genresResponse.success && genresResponse.data) {
          setAllGenres(genresResponse.data);
        }

        // Get current user profile to set as default user
        const profileResponse = await apiService.getProfile(token);
        if (profileResponse.success && profileResponse.data) {
          setUserId(profileResponse.data.id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showAlert("error", "Lỗi tải dữ liệu", "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleCreate = async () => {
    if (!token) return;

    // Validation
    if (!name.trim()) {
      showAlert("warning", "Thiếu thông tin", "Vui lòng nhập tên truyện");
      return;
    }

    if (!userId) {
      showAlert("warning", "Thiếu thông tin", "Không xác định được người đăng");
      return;
    }

    setSaving(true);
    try {
      // If there's a cover image, use multipart form data
      if (coverImage) {
        const formData = new FormData();
        formData.append("name", name.trim());

        // Only include name_alt if it has a value
        if (nameAlt.trim()) {
          formData.append("name_alt", nameAlt.trim());
        }

        // Only include pilot if it has a value
        if (pilot.trim()) {
          formData.append("pilot", pilot.trim());
        }

        formData.append("status", status);
        formData.append("is_hot", isHot ? "1" : "0");
        formData.append("user_id", userId);

        if (doujinshiId) formData.append("doujinshi_id", doujinshiId);
        if (artistId) formData.append("artist_id", artistId);
        if (groupId) formData.append("group_id", groupId);

        // Add genres
        selectedGenres.forEach((genreId, index) => {
          formData.append(`genres[${index}]`, genreId.toString());
        });

        formData.append("cover", coverImage);

        const response = await apiService.createManga(token, formData);

        if (response.success) {
          showAlert("success", "Thành công", "Đã tạo truyện thành công");
          // Redirect to manga edit page after a short delay
          const mangaId = response.data?.id;
          if (mangaId) {
            setTimeout(() => {
              router.push(`/admin/mangas/${mangaId}/edit`);
            }, 1500);
          }
        } else {
          showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi tạo truyện");
        }
      } else {
        // Use JSON payload when no cover image
        const payload: Record<string, any> = {
          genres: selectedGenres,
          name: name.trim(),
          user_id: userId,
          is_hot: isHot ? 1 : 0,
          status: parseInt(status),
        };

        // Only include name_alt if it has a value
        if (nameAlt.trim()) {
          payload.name_alt = nameAlt.trim();
        }

        // Only include pilot if it has a value
        if (pilot.trim()) {
          payload.pilot = pilot.trim();
        }

        // Optional fields
        if (doujinshiId) payload.doujinshi_id = doujinshiId;
        if (artistId) payload.artist_id = artistId;
        if (groupId) payload.group_id = groupId;

        const response = await apiService.createManga(token, payload);

        if (response.success) {
          showAlert("success", "Thành công", "Đã tạo truyện thành công");
          // Redirect to manga edit page after a short delay
          const mangaId = response.data?.id;
          if (mangaId) {
            setTimeout(() => {
              router.push(`/admin/mangas/${mangaId}/edit`);
            }, 1500);
          }
        } else {
          showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi tạo truyện");
        }
      }
    } catch (error: any) {
      console.error("Error creating manga:", error);
      console.error("Error.errors:", error.errors);

      // Display validation errors if available
      if (error.errors?.fields) {
        // Handle Laravel validation error format with 'fields'
        const errorMessages = Object.entries(error.errors.fields)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join(', ');
        showAlert("error", "Lỗi validation", errorMessages);
      } else if (error.errors) {
        // Fallback for other error formats
        if (typeof error.errors === 'object' && !Array.isArray(error.errors)) {
          const errorMessages = Object.entries(error.errors)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join(', ');
          showAlert("error", "Lỗi validation", errorMessages);
        } else {
          showAlert("error", "Lỗi", JSON.stringify(error.errors));
        }
      } else {
        showAlert("error", "Lỗi tạo truyện", error.message || "Có lỗi xảy ra khi tạo truyện");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/mangas");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Tạo Truyện Mới" />

      {/* Alert notification */}
      {alert.show && (
        <div className="mb-6">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      {/* Fixed action buttons */}
      <div className="fixed top-20 right-6 z-40 flex gap-3">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Hủy
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg shadow-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Đang tạo..." : "Tạo Truyện"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <ComponentCard title="Thông tin">
            <div className="space-y-4">
              {/* Hot toggle - top right */}
              <div className="flex justify-end">
                <Switch
                  label="Hot"
                  defaultChecked={isHot}
                  onChange={setIsHot}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên truyện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên truyện..."
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>

              {/* Alt name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên khác
                </label>
                <input
                  type="text"
                  value={nameAlt}
                  onChange={(e) => setNameAlt(e.target.value)}
                  placeholder="Tên khác (cách nhau bằng dấu phẩy)"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>

              {/* Doujinshi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Doujinshi
                </label>
                <AutocompleteSelect
                  placeholder="Tìm kiếm doujinshi..."
                  value={doujinshiId}
                  initialLabel=""
                  onChange={(value) => setDoujinshiId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchDoujinshis(token, query);
                    if (response.success && response.data) {
                      return response.data.map((d: any) => ({
                        value: d.id,
                        label: d.name,
                      }));
                    }
                    return [];
                  }}
                />
              </div>

              {/* Thực hiện */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thực hiện
                </label>
                <input
                  type="text"
                  value="Admin"
                  readOnly
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white/90 cursor-not-allowed"
                />
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thể loại
                </label>
                <GenreCheckboxGrid
                  genres={allGenres}
                  selectedGenres={selectedGenres}
                  onChange={setSelectedGenres}
                />
              </div>
            </div>
          </ComponentCard>

          {/* Description */}
          <ComponentCard title="Nội dung">
            <RichTextEditor
              value={pilot}
              onChange={setPilot}
              placeholder="Nhập mô tả hoặc giới thiệu ngắn về truyện..."
            />
          </ComponentCard>
        </div>

        {/* Right column - Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Cover Image */}
          <ComponentCard title="Ảnh bìa">
            <ImageUploader
              currentImageUrl=""
              onImageChange={setCoverImage}
            />
          </ComponentCard>

          {/* Additional Info */}
          <ComponentCard title="Thông tin khác">
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tình trạng
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="2">Đang tiến hành</option>
                  <option value="0">Tạm dừng</option>
                  <option value="1">Hoàn thành</option>
                </select>
              </div>

              {/* Artist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tác giả
                </label>
                <AutocompleteSelect
                  placeholder="Tìm kiếm tác giả..."
                  value={artistId}
                  initialLabel=""
                  onChange={(value) => setArtistId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchArtists(token, query);
                    if (response.success && response.data) {
                      return response.data.map((a: any) => ({
                        value: a.id,
                        label: a.name,
                      }));
                    }
                    return [];
                  }}
                />
              </div>

              {/* Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nhóm dịch
                </label>
                <AutocompleteSelect
                  placeholder="Tìm kiếm nhóm dịch..."
                  value={groupId}
                  initialLabel=""
                  onChange={(value) => setGroupId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchGroups(token, query);
                    if (response.success && response.data) {
                      return response.data.map((g: any) => ({
                        value: g.id,
                        label: g.name,
                      }));
                    }
                    return [];
                  }}
                />
              </div>

              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Người đăng
                </label>
                <AutocompleteSelect
                  placeholder="Tìm kiếm người đăng..."
                  value={userId}
                  initialLabel=""
                  onChange={(value) => setUserId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchUsers(token, query);
                    if (response.success && response.data) {
                      return response.data.map((u: any) => ({
                        value: u.id,
                        label: u.name,
                      }));
                    }
                    return [];
                  }}
                />
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
