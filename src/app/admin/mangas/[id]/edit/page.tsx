"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import AutocompleteSelect from "@/components/form/AutocompleteSelect";
import GenreCheckboxGrid from "@/components/form/GenreCheckboxGrid";
import RichTextEditor from "@/components/form/RichTextEditor";
import ImageUploader from "@/components/form/ImageUploader";
import ChapterList from "@/components/manga/ChapterList";
import Switch from "@/components/form/switch/Switch";
import Alert from "@/components/ui/alert/Alert";

interface Manga {
  id: string;
  name: string;
  name_alt: string | null;
  pilot: string;
  status: number;
  is_hot: number;
  cover_full_url: string;
  user_id: string;
  artist_id: string | null;
  group_id: string | null;
  doujinshi_id: string | null;
  user?: { id: string; name: string };
  artist?: { id: string; name: string };
  group?: { id: string; name: string };
  doujinshi?: { id: string; name: string };
  genres: Array<{ id: number; name: string; slug: string }>;
}

interface Genre {
  id: number;
  name: string;
  slug: string;
}

interface MangaApiResponse {
  success: boolean;
  data: Manga;
  message?: string;
  code: number;
}

interface GenresApiResponse {
  success: boolean;
  data: Genre[];
  message?: string;
  code: number;
}

interface SearchApiResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
  code: number;
}

interface Doujinshi {
  id: string;
  name: string;
  slug: string;
}

interface Artist {
  id: string;
  name: string;
  slug: string;
}

interface Group {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function MangaEditPage() {
  const params = useParams();
  const { token } = useAuth();
  const mangaId = params.id as string;

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

  // Form data
  const [name, setName] = useState("");
  const [nameAlt, setNameAlt] = useState("");
  const [doujinshiId, setDoujinshiId] = useState("");
  const [doujinshiName, setDoujinshiName] = useState("");
  const [status, setStatus] = useState("2");
  const [artistId, setArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [pilot, setPilot] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState("");

  // Options
  const [allGenres, setAllGenres] = useState<Genre[]>([]);

  // Fetch manga data
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !mangaId) return;

      setLoading(true);
      try {
        // Fetch manga
        const mangaResponse = await apiService.getMangaById(token, mangaId) as MangaApiResponse;
        if (mangaResponse.success && mangaResponse.data) {
          const manga: Manga = mangaResponse.data;
          setName(manga.name);
          setNameAlt(manga.name_alt || "");
          setPilot(manga.pilot || "");
          setStatus(manga.status.toString());
          setIsHot(manga.is_hot === 1);
          setCurrentCoverUrl(manga.cover_full_url);
          setUserId(manga.user_id);
          setUserName(manga.user?.name || "");
          setArtistId(manga.artist_id || "");
          setArtistName(manga.artist?.name || "");
          setGroupId(manga.group_id || "");
          setGroupName(manga.group?.name || "");
          setDoujinshiId(manga.doujinshi_id || "");
          setDoujinshiName(manga.doujinshi?.name || "");
          setSelectedGenres(manga.genres.map(g => g.id));
        }

        // Fetch all genres
        const genresResponse = await apiService.getGenresAll(token) as GenresApiResponse;
        if (genresResponse.success && genresResponse.data) {
          setAllGenres(genresResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showAlert("error", "Lỗi tải dữ liệu", "Có lỗi xảy ra khi tải dữ liệu truyện");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, mangaId]);

  const handleSave = async () => {
    if (!token) return;

    // Validation
    if (!name.trim()) {
      showAlert("warning", "Thiếu thông tin", "Vui lòng nhập tên truyện");
      return;
    }

    setSaving(true);
    try {
      // If there's a cover image, use multipart form data
      if (coverImage) {
        const formData = new FormData();
        formData.append("_method", "PUT");
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

        const response = await apiService.updateManga(token, mangaId, formData);

        if (response.success) {
          showAlert("success", "Thành công", "Đã cập nhật truyện thành công");
        } else {
          showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi cập nhật truyện");
        }
      } else {
        // Use JSON payload when no cover image
        const payload: Record<string, unknown> = {
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

        const response = await apiService.updateMangaJSON(token, mangaId, payload);

        if (response.success) {
          showAlert("success", "Thành công", "Đã cập nhật truyện thành công");
        } else {
          showAlert("error", "Lỗi", response.message || "Có lỗi xảy ra khi cập nhật truyện");
        }
      }
    } catch (error: unknown) {
      console.error("Error updating manga:", error);
      const errorObj = error as { errors?: { fields?: Record<string, unknown> }; message?: string };
      console.error("Error.errors:", errorObj.errors);

      // Display validation errors if available
      if (errorObj.errors?.fields) {
        // Handle Laravel validation error format with 'fields'
        const errorMessages = Object.entries(errorObj.errors.fields)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join(', ');
        showAlert("error", "Lỗi validation", errorMessages);
      } else if (errorObj.errors) {
        // Fallback for other error formats
        if (typeof errorObj.errors === 'object' && !Array.isArray(errorObj.errors)) {
          const errorMessages = Object.entries(errorObj.errors)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join(', ');
          showAlert("error", "Lỗi validation", errorMessages);
        } else {
          showAlert("error", "Lỗi", JSON.stringify(errorObj.errors));
        }
      } else {
        showAlert("error", "Lỗi cập nhật", errorObj.message || "Có lỗi xảy ra khi cập nhật truyện");
      }
    } finally {
      setSaving(false);
    }
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
      <PageBreadcrumb pageTitle="Chỉnh sửa Truyện" />

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

      {/* Fixed save button */}
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg shadow-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Đang lưu..." : "Lưu"}
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
                  initialLabel={doujinshiName}
                  onChange={(value) => setDoujinshiId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchDoujinshis(token, query) as SearchApiResponse<Doujinshi>;
                    if (response.success && response.data) {
                      return response.data.map((d: Doujinshi) => ({
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
                  value={userName || "Admin"}
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

          {/* Chapter List */}
          <ComponentCard title="Danh sách chương">
            <ChapterList mangaId={mangaId} />
          </ComponentCard>
        </div>

        {/* Right column - Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Cover Image */}
          <ComponentCard title="Ảnh bìa">
            <ImageUploader
              currentImageUrl={currentCoverUrl}
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
                  initialLabel={artistName}
                  onChange={(value) => setArtistId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchArtists(token, query) as SearchApiResponse<Artist>;
                    if (response.success && response.data) {
                      return response.data.map((a: Artist) => ({
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
                  initialLabel={groupName}
                  onChange={(value) => setGroupId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchGroups(token, query) as SearchApiResponse<Group>;
                    if (response.success && response.data) {
                      return response.data.map((g: Group) => ({
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
                  initialLabel={userName}
                  onChange={(value) => setUserId(value)}
                  onSearch={async (query) => {
                    if (!token) return [];
                    const response = await apiService.searchUsers(token, query) as SearchApiResponse<User>;
                    if (response.success && response.data) {
                      return response.data.map((u: User) => ({
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
