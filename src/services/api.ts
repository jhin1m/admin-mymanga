// API Service for MyManga VN Admin
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/admin`;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code: number;
  errors?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface QueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  filters?: Record<string, string>;
}

export interface LoginResponse {
  token: string;
  type: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface BasicStats {
  user_count: number;
  manga_count: number;
  chapter_count: number;
  pet_count: number;
}

export interface ChapterReportUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface ChapterReportManga {
  id: string;
  name: string;
  cover?: string;
}

export interface ChapterReportChapter {
  id: string;
  name: string;
}

export interface ChapterReport {
  id: string;
  report_type: 'broken_images' | 'missing_images' | 'wrong_order' | 'wrong_chapter' | 'duplicate' | 'other';
  report_type_label: string;
  description: string;
  user_id: string;
  manga_id: string;
  chapter_id: string;
  created_at: string;
  updated_at: string;
  user?: ChapterReportUser;
  manga?: ChapterReportManga;
  chapter?: ChapterReportChapter;
}

export interface ChapterReportStatistics {
  total: number;
  today_reports: number;
  recent_reports: number;
}

export interface ChapterReportFilters {
  report_type?: string;
  user_id?: string;
}

class ApiService {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Handle 204 No Content - no body to parse
    if (response.status === 204) {
      return {
        success: true,
        data: undefined,
        code: 204
      };
    }

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let data: unknown;
    if (hasJsonContent) {
      try {
        data = await response.json();
      } catch (error) {
        // If JSON parsing fails but response is ok, return success
        if (response.ok) {
          return {
            success: true,
            data: undefined,
            code: response.status
          };
        }
        throw error;
      }
    } else {
      // No JSON content
      if (response.ok) {
        return {
          success: true,
          data: undefined,
          code: response.status
        };
      }
      data = {};
    }

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        data: data
      });
      throw {
        success: false,
        message: (data as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
        errors: (data as { errors?: unknown, error?: unknown }).errors || (data as { errors?: unknown, error?: unknown }).error
      };
    }

    return data as ApiResponse<T>;
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    return this.handleResponse<LoginResponse>(response);
  }

  async getProfile(token: string): Promise<ApiResponse<AdminUser>> {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<AdminUser>(response);
  }

  async logout(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Logout failed');
    }
  }

  // Statistics endpoint
  async getBasicStats(token: string): Promise<ApiResponse<BasicStats>> {
    const response = await fetch(`${API_BASE_URL}/statics/basic`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<BasicStats>(response);
  }

  // Users management
  async getUsers(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.trim() !== '') {
            urlParams.append(`filter[${key}]`, value.trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    // Debug log for development
    console.log('API URL:', `${API_BASE_URL}/users${queryString}`);

    const response = await fetch(`${API_BASE_URL}/users${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  // Mangas management
  async getMangas(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/mangas${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async updateMangaStatus(token: string, mangaId: string, isReviewed: boolean): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ is_reviewed: isReviewed ? 1 : 0 }),
    });

    return this.handleResponse(response);
  }

  async deleteManga(token: string, mangaId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Manga deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async getMangaById(token: string, mangaId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}?include=group,user,genres,artist,doujinshi`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async updateManga(token: string, mangaId: string, formData: FormData): Promise<ApiResponse<unknown>> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}`, {
      method: 'POST', // Laravel uses POST with _method=PUT for multipart
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async updateMangaJSON(token: string, mangaId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async createManga(token: string, payload: FormData | Record<string, unknown>): Promise<ApiResponse<unknown>> {
    if (payload instanceof FormData) {
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/mangas`, {
        method: 'POST',
        headers: headers,
        body: payload,
      });

      return this.handleResponse(response);
    } else {
      const response = await fetch(`${API_BASE_URL}/mangas`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(payload),
      });

      return this.handleResponse(response);
    }
  }

  // Chapters management
  async getChapters(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/chapters${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deleteChapter(token: string, chapterId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Chapter deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async getChapterById(token: string, chapterId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async updateChapter(
    token: string,
    chapterId: string,
    data: { name: string; imageUrls?: string[] }
  ): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('name', data.name);

    // If imageUrls provided, use them for reordering; otherwise send empty array
    if (data.imageUrls && data.imageUrls.length > 0) {
      data.imageUrls.forEach((url) => {
        formData.append('image_urls[]', url);
      });
    } else {
      // Backend expects image_urls field even if empty
      formData.append('image_urls', JSON.stringify([]));
    }

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}?_method=put`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async clearChapterImages(token: string, chapterId: string): Promise<ApiResponse<unknown>> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/clr-img`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async uploadChapterImage(token: string, chapterId: string, file: File): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('image', file);

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/add-img?_method=put`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async createChapter(token: string, mangaId: string, name: string): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('manga_id', mangaId);

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chapters`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async deleteMunknownChapters(token: string, chapterIds: string[]): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/chapters/delete-munknown`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids: chapterIds }),
    });

    return this.handleResponse(response);
  }

  // Genres management
  async getGenres(token: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/genres`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getGenresAll(token: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/genres?per_page=999999`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getGenresWithParams(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/genres${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getGenreById(token: string, genreId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/genres/${genreId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async createGenre(token: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/genres`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async updateGenre(token: string, genreId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/genres/${genreId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async deleteGenre(token: string, genreId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/genres/${genreId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Genre deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  // User management actions
  async banUser(token: string, userId: string, banDuration?: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/ban`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ban_duration: banDuration }),
    });

    return this.handleResponse(response);
  }

  async unbanUser(token: string, userId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/unban`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deleteUserComments(token: string, userId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/delete-comment`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  // Autocomplete search endpoints
  async searchGroups(token: string, query: string): Promise<ApiResponse<unknown>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/groups?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchArtists(token: string, query: string): Promise<ApiResponse<unknown>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/artists?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchDoujinshis(token: string, query: string): Promise<ApiResponse<unknown>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/doujinshis?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchUsers(token: string, query: string): Promise<ApiResponse<unknown>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/users?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchMangas(token: string, query: string): Promise<ApiResponse<unknown>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/mangas?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  // Artists management
  async getArtists(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/artists${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deleteArtist(token: string, artistId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/artists/${artistId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Artist deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async updateArtist(token: string, artistId: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/artists/${artistId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async createArtist(token: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/artists`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // Groups management
  async getGroups(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/groups${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getGroupById(token: string, groupId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async createGroup(token: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async updateGroup(token: string, groupId: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async deleteGroup(token: string, groupId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Group deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  // Achievements management
  async getAchievements(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/achievements${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getAchievementById(token: string, achievementId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/achievements/${achievementId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async createAchievement(token: string, data: {
    name: string;
    font_family: string;
    font_size: string;
    color: string;
    weight: string;
    font_style: string;
    text_shadow: string;
    required_points: number;
  }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/achievements`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async updateAchievement(token: string, achievementId: string, data: {
    name: string;
    font_family: string;
    font_size: string;
    color: string;
    weight: string;
    font_style: string;
    text_shadow: string;
    required_points: number;
  }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/achievements/${achievementId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async deleteAchievement(token: string, achievementId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/achievements/${achievementId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Achievement deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  // Doujinshis management
  async getDoujinshis(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/doujinshis${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deleteDoujinshi(token: string, doujinshiId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/doujinshis/${doujinshiId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Doujinshi deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async updateDoujinshi(token: string, doujinshiId: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/doujinshis/${doujinshiId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async createDoujinshi(token: string, data: { name: string }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/doujinshis`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // Pets management
  async getPets(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/pets${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deletePet(token: string, petId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Pet deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async updatePet(token: string, petId: string, formData: FormData): Promise<ApiResponse<unknown>> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add _method field to FormData for Laravel PUT method spoofing
    formData.append('_method', 'put');

    const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
      method: 'POST', // Laravel uses POST with _method=PUT for multipart
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async createPet(token: string, formData: FormData): Promise<ApiResponse<unknown>> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/pets`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Comments management
  async getComments(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/comments${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deleteComment(token: string, commentId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Comment deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async updateComment(token: string, commentId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async getCommentThread(token: string, commentId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `${API_BASE_URL}/comments/${commentId}?include=user,commentable,childes`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      }
    );

    return this.handleResponse(response);
  }

  async createCommentReply(token: string, data: {
    content: string;
    parent_id: string;
    commentable_id: string;
    commentable_type: string;
    user_id?: string;
  }): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // Announcement management
  async getAnnouncement(token: string): Promise<ApiResponse<{ html: string }>> {
    const response = await fetch(`${API_BASE_URL}/statics/announcement`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<{ html: string }>(response);
  }

  async saveAnnouncement(token: string, html: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/statics/announcement`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ html }),
    });

    return this.handleResponse(response);
  }

  // Chapter Reports management
  async getChapterReports(token: string, params?: QueryParams): Promise<ApiResponse<unknown>> {
    let queryString = '';
    if (params) {
      const urlParams = new URLSearchParams();

      // Handle standard parameters
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.per_page) urlParams.append('per_page', params.per_page.toString());
      if (params.sort) urlParams.append('sort', params.sort);
      if (params.include) urlParams.append('include', params.include);

      // Handle filter parameters with filter[field] format
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const value = params.filters![key];
          if (value && value.toString().trim() !== '') {
            urlParams.append(`filter[${key}]`, value.toString().trim());
          }
        });
      }

      queryString = urlParams.toString() ? '?' + urlParams.toString() : '';
    }

    const response = await fetch(`${API_BASE_URL}/chapter-reports${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getChapterReport(token: string, reportId: string): Promise<ApiResponse<ChapterReport>> {
    const response = await fetch(`${API_BASE_URL}/chapter-reports/${reportId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<ChapterReport>(response);
  }

  async deleteChapterReport(token: string, reportId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/chapter-reports/${reportId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Chapter report deleted successfully',
        code: 204,
      };
    }

    return this.handleResponse(response);
  }

  async bulkDeleteChapterReports(token: string, reportIds: string[]): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/chapter-reports/bulk-delete`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids: reportIds }),
    });

    return this.handleResponse(response);
  }

  async getChapterReportsStatistics(token: string): Promise<ApiResponse<ChapterReportStatistics>> {
    const response = await fetch(`${API_BASE_URL}/chapter-reports/statistics`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<ChapterReportStatistics>(response);
  }
}

export const apiService = new ApiService();