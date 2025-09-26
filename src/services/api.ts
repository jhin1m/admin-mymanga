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
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
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
}

export const apiService = new ApiService();