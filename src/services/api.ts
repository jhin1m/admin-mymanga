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
    const data = await response.json();

    if (!response.ok) {
      throw {
        success: false,
        message: data.message || 'An error occurred',
        code: response.status,
        errors: data.errors
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
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/mangas${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse(response);
  }

  // Chapters management
  async getChapters(token: string, params?: Record<string, any>): Promise<ApiResponse<any>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/chapters${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(token),
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
}

export const apiService = new ApiService();