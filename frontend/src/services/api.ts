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
};

export default api;

