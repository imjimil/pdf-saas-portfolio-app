import axios from 'axios';

// Use proxy in development (Vite handles /api), or full URL if specified
// @ts-ignore - Vite env types
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If FormData, let browser set Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if we're not already on login/register pages
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (name: string) => {
    const response = await api.put('/auth/profile', { name });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    return response.data;
  },
};

export const pdfAPI = {
  toWord: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/to-word', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  wordToPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/pdf/word-to-pdf', formData, {
        responseType: 'blob',
      });
      // Check if response is actually an error JSON blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to convert Word to PDF');
      }
      return response.data;
    } catch (error: any) {
      // If it's a blob error response, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to convert Word to PDF');
        } catch {
          throw new Error('Failed to convert Word to PDF');
        }
      }
      throw error;
    }
  },
  imageToPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/image-to-pdf', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  split: async (file: File, pageRanges?: { start: number; end: number }[]) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pageRanges) {
      formData.append('pageRanges', JSON.stringify(pageRanges));
    }
    const response = await api.post('/pdf/split', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  toTxt: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/to-txt', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  toEpub: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/to-epub', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  ocr: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/ocr', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  merge: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    try {
      const response = await api.post('/pdf/merge', formData, {
        responseType: 'blob',
      });
      // Check if response is actually an error JSON blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to merge PDFs');
      }
      return response.data;
    } catch (error: any) {
      // If it's a blob error response, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to merge PDFs');
        } catch {
          throw new Error('Failed to merge PDFs');
        }
      }
      throw error;
    }
  },
  compress: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/compress', formData, {
      responseType: 'blob',
    });
    return response.data;
  },
  watermark: async (file: File, watermarkText: string, options?: {
    position?: string;
    opacity?: number;
    fontSize?: number;
    rotation?: number;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('watermarkText', watermarkText);
    if (options?.position) formData.append('position', options.position);
    if (options?.opacity !== undefined) formData.append('opacity', options.opacity.toString());
    if (options?.fontSize) formData.append('fontSize', options.fontSize.toString());
    if (options?.rotation !== undefined) formData.append('rotation', options.rotation.toString());
    try {
      const response = await api.post('/pdf/watermark', formData, {
        responseType: 'blob',
      });
      // Check if response is actually an error JSON blob
      if (response.data.type && response.data.type.includes('application/json')) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to watermark PDF');
      }
      return response.data;
    } catch (error: any) {
      // If it's a blob error response, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to watermark PDF');
        } catch (parseError) {
          // If parsing fails, check status code for more info
          const status = error.response?.status;
          const statusText = error.response?.statusText;
          throw new Error(`Failed to watermark PDF (${status} ${statusText})`);
        }
      }
      // If it's a regular error response with data
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  protect: async (file: File, password: string, options?: {
    ownerPassword?: string;
    allowPrinting?: string;
    allowModifying?: string;
    allowCopying?: string;
    allowAnnotating?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    if (options?.ownerPassword) formData.append('ownerPassword', options.ownerPassword);
    if (options?.allowPrinting) formData.append('allowPrinting', options.allowPrinting);
    if (options?.allowModifying) formData.append('allowModifying', options.allowModifying);
    if (options?.allowCopying) formData.append('allowCopying', options.allowCopying);
    if (options?.allowAnnotating) formData.append('allowAnnotating', options.allowAnnotating);
    try {
      const response = await api.post('/pdf/protect', formData, {
        responseType: 'blob',
      });
      // Check if response is actually an error JSON blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to protect PDF');
      }
      return response.data;
    } catch (error: any) {
      // If it's a blob error response, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to protect PDF');
        } catch {
          throw new Error('Failed to protect PDF');
        }
      }
      throw error;
    }
  },
};

export const fileAPI = {
  getHistory: async (page: number = 1, limit: number = 20, filters?: {
    operation?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters?.operation) {
      params.append('operation', filters.operation);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    
    const response = await api.get(`/files/history?${params.toString()}`);
    return response.data;
  },
  
  getFile: async (id: string) => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },
  
  deleteFile: async (id: string) => {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  },
  
  downloadFile: async (id: string) => {
    const response = await api.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const analyticsAPI = {
  getUsage: async (days: number = 30) => {
    const response = await api.get(`/analytics/usage?days=${days}`);
    return response.data;
  },
  getOperations: async (days: number = 30) => {
    const response = await api.get(`/analytics/operations?days=${days}`);
    return response.data;
  },
};

export default api;

