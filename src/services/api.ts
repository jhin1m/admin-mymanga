// API Service for MyManga VN Admin
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/admin`;

export interface ApiResponse<T = any> {
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
        data: null as any,
        code: 204
      };
    }

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let data: any;
    if (hasJsonContent) {
      try {
        data = await response.json();
      } catch (error) {
        // If JSON parsing fails but response is ok, return success
        if (response.ok) {
          return {
            success: true,
            data: null as any,
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
          data: null as any,
          code: response.status
        };
      }
      data = {};
    }

    if (!response.ok) {
      console.error('API Error Response:', data);
      throw {
        success: false,
        message: data.message || 'An error occurred',
        code: response.status,
        errors: data.errors || data.error // Handle both 'errors' and 'error'
      };
    }

    return data;
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
  async getUsers(token: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
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
          const value = params.filters[key];
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
  async getMangas(token: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
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
          const value = params.filters[key];
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

  async updateMangaStatus(token: string, mangaId: string, isReviewed: boolean): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ is_reviewed: isReviewed ? 1 : 0 }),
    });

    return this.handleResponse(response);
  }

  async deleteManga(token: string, mangaId: string): Promise<ApiResponse<any>> {
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

  async getMangaById(token: string, mangaId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}?include=group,user,genres,artist,doujinshi`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async updateManga(token: string, mangaId: string, formData: FormData): Promise<ApiResponse<any>> {
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

  async updateMangaJSON(token: string, mangaId: string, data: Record<string, any>): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/mangas/${mangaId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async createManga(token: string, payload: FormData | Record<string, any>): Promise<ApiResponse<any>> {
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
  async getChapters(token: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
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
          const value = params.filters[key];
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

  async deleteChapter(token: string, chapterId: string): Promise<ApiResponse<any>> {
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

  async getChapterById(token: string, chapterId: string): Promise<ApiResponse<any>> {
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
  ): Promise<ApiResponse<any>> {
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

  async clearChapterImages(token: string, chapterId: string): Promise<ApiResponse<any>> {
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

  async uploadChapterImage(token: string, chapterId: string, file: File): Promise<ApiResponse<any>> {
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

  async createChapter(token: string, mangaId: string, name: string): Promise<ApiResponse<any>> {
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

  async deleteManyChapters(token: string, chapterIds: string[]): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/chapters/delete-many`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids: chapterIds }),
    });

    return this.handleResponse(response);
  }

  // Genres management
  async getGenres(token: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/genres`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async getGenresAll(token: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/genres?per_page=999999`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  // User management actions
  async banUser(token: string, userId: string, banDuration?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/ban`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ban_duration: banDuration }),
    });

    return this.handleResponse(response);
  }

  async unbanUser(token: string, userId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/unban`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async deleteUserComments(token: string, userId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/delete-comment`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  // Autocomplete search endpoints
  async searchGroups(token: string, query: string): Promise<ApiResponse<any>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/groups?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchArtists(token: string, query: string): Promise<ApiResponse<any>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/artists?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchDoujinshis(token: string, query: string): Promise<ApiResponse<any>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/doujinshis?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchUsers(token: string, query: string): Promise<ApiResponse<any>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/users?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  async searchMangas(token: string, query: string): Promise<ApiResponse<any>> {
    const urlParams = new URLSearchParams();
    urlParams.append('filter[name]', query);

    const response = await fetch(`${API_BASE_URL}/mangas?${urlParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();