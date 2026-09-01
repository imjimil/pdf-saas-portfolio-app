import axios, { AxiosError, AxiosProgressEvent } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Let the browser set the multipart boundary itself.
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const path = window.location.pathname;
    const onAuthPage = path.includes('/login') || path.includes('/register');

    if (error.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

/** A failure with a message written for the person using the app. */
export class ApiError extends Error {
  readonly hint?: string;
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, options: { hint?: string; code?: string; status?: number } = {}) {
    super(message);
    this.name = 'ApiError';
    this.hint = options.hint;
    this.code = options.code;
    this.status = options.status;
  }
}

/**
 * Normalises every failure mode into an ApiError.
 *
 * File endpoints respond with a binary blob on success, so an error arriving on
 * one of those requests must be read out of the blob before it can be shown.
 */
async function toApiError(error: unknown): Promise<ApiError> {
  if (!axios.isAxiosError(error)) {
    return new ApiError(
      error instanceof Error ? error.message : 'Something went wrong.'
    );
  }

  if (error.code === 'ERR_NETWORK') {
    return new ApiError('Could not reach the server.', {
      hint: 'Check your connection and try again.',
    });
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError('The request timed out.', {
      hint: 'Large files can take a while — try again or use a smaller file.',
    });
  }

  const status = error.response?.status;
  let data: any = error.response?.data;

  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }

  if (data?.message) {
    return new ApiError(data.message, { hint: data.hint, code: data.code, status });
  }

  if (status === 413) {
    return new ApiError('That file is too large.', {
      hint: 'The limit is 50 MB. Try compressing it first.',
      status,
    });
  }

  if (status === 429) {
    return new ApiError('Too many requests.', {
      hint: 'Please wait a minute and try again.',
      status,
    });
  }

  return new ApiError('Something went wrong while processing your file.', { status });
}

export interface FileResult {
  blob: Blob;
  fileName: string;
  meta: Record<string, string | number | boolean>;
}

export type ProgressHandler = (percent: number) => void;

/** Posts multipart data and returns the resulting file plus its metadata. */
async function postForFile(
  endpoint: string,
  form: FormData,
  onProgress?: ProgressHandler
): Promise<FileResult> {
  try {
    const response = await api.post(endpoint, form, {
      responseType: 'blob',
      timeout: 5 * 60 * 1000,
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!onProgress || !event.total) return;
        // Upload is the first 90%; the rest covers server-side processing.
        onProgress(Math.round((event.loaded / event.total) * 90));
      },
    });

    onProgress?.(100);

    // An error can still arrive as a JSON blob with a 2xx-shaped request.
    const contentType = response.headers['content-type'] ?? '';
    if (contentType.includes('application/json')) {
      const payload = JSON.parse(await (response.data as Blob).text());
      throw new ApiError(payload.message ?? 'Conversion failed.', {
        hint: payload.hint,
        code: payload.code,
      });
    }

    return {
      blob: response.data as Blob,
      fileName: filenameFromDisposition(response.headers['content-disposition']),
      meta: parseMeta(response.headers['x-result-meta']),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw await toApiError(error);
  }
}

function parseMeta(header?: string): Record<string, string | number | boolean> {
  if (!header) return {};
  try {
    return JSON.parse(decodeURIComponent(header));
  } catch {
    return {};
  }
}

function filenameFromDisposition(header?: string): string {
  if (!header) return 'download';
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : 'download';
}

const appendFields = (form: FormData, fields: Record<string, unknown> = {}) => {
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  }
};

// --- Tools -------------------------------------------------------------------

export const pdfAPI = {
  /** Which conversions the server can currently perform at full fidelity. */
  capabilities: async () => (await api.get('/pdf/capabilities')).data,

  run: (
    endpoint: string,
    files: File | File[],
    fields: Record<string, unknown> = {},
    onProgress?: ProgressHandler
  ): Promise<FileResult> => {
    const form = new FormData();
    const list = Array.isArray(files) ? files : [files];

    if (Array.isArray(files)) {
      list.forEach((file) => form.append('files', file));
    } else {
      form.append('file', list[0]);
    }

    appendFields(form, fields);
    return postForFile(endpoint, form, onProgress);
  },

  ocrText: async (
    file: File,
    fields: Record<string, unknown> = {},
    onProgress?: ProgressHandler
  ) => {
    const form = new FormData();
    form.append('file', file);
    appendFields(form, { ...fields, createSearchablePdf: false });

    try {
      const response = await api.post('/pdf/ocr', form, {
        timeout: 5 * 60 * 1000,
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 90));
          }
        },
      });
      onProgress?.(100);
      return response.data as {
        type: 'text';
        text: string;
        fileName: string;
        characterCount: number;
        wordCount: number;
        source: string;
      };
    } catch (error) {
      throw await toApiError(error);
    }
  },
};

// --- Account -----------------------------------------------------------------

export const authAPI = {
  register: async (email: string, password: string) => {
    try {
      return (await api.post('/auth/register', { email, password })).data;
    } catch (error) {
      throw await toApiError(error);
    }
  },
  login: async (email: string, password: string) => {
    try {
      return (await api.post('/auth/login', { email, password })).data;
    } catch (error) {
      throw await toApiError(error);
    }
  },
  getProfile: async () => (await api.get('/auth/me')).data,
  updateProfile: async (name: string) => (await api.put('/auth/profile', { name })).data,
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      return (await api.put('/auth/password', { currentPassword, newPassword })).data;
    } catch (error) {
      throw await toApiError(error);
    }
  },
  deleteAccount: async () => (await api.delete('/auth/account')).data,
};

export const fileAPI = {
  getHistory: async (
    page = 1,
    limit = 20,
    filters: { operation?: string; startDate?: string; endDate?: string } = {}
  ) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.append(key, value);
    }
    return (await api.get(`/files/history?${params}`)).data;
  },
  deleteFile: async (id: string) => (await api.delete(`/files/${id}`)).data,
};

export const analyticsAPI = {
  getUsage: async (days = 30) => (await api.get(`/analytics/usage?days=${days}`)).data,
  getOperations: async (days = 30) =>
    (await api.get(`/analytics/operations?days=${days}`)).data,
};

/** Triggers a browser download for a blob returned by a tool. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default api;
