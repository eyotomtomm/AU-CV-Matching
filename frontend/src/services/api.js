import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Jobs API
export const jobsApi = {
  // Upload JD file and extract text
  uploadJD: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/jobs/upload-jd', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  create: async (jobData) => {
    const response = await api.post('/api/jobs/', jobData);
    return response.data;
  },

  list: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/api/jobs/', { params });
    return response.data;
  },

  get: async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}`);
    return response.data;
  },

  update: async (jobId, data) => {
    const response = await api.put(`/api/jobs/${jobId}`, data);
    return response.data;
  },

  delete: async (jobId) => {
    await api.delete(`/api/jobs/${jobId}`);
  },

  process: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/process`);
    return response.data;
  },

  getStatistics: async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}/statistics`);
    return response.data;
  },

  complete: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/complete`);
    return response.data;
  },
};

// Candidates API
export const candidatesApi = {
  uploadSingle: async (jobId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/candidates/${jobId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadBulk: async (jobId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post(`/candidates/${jobId}/upload-bulk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  list: async (jobId) => {
    const response = await api.get(`/candidates/${jobId}/list`);
    return response.data;
  },

  processAll: async (jobId) => {
    const response = await api.post(`/candidates/${jobId}/process-all`);
    return response.data;
  },

  getResults: async (jobId, longlistOnly = false) => {
    const params = { longlist_only: longlistOnly };
    const response = await api.get(`/candidates/${jobId}/results`, { params });
    return response.data;
  },

  getResult: async (resultId) => {
    const response = await api.get(`/candidates/result/${resultId}`);
    return response.data;
  },

  delete: async (candidateId) => {
    await api.delete(`/candidates/${candidateId}`);
  },
};

// Reports API - uses authenticated blob downloads
export const reportsApi = {
  downloadLonglistDocx: async (jobId) => {
    const response = await api.get(`/api/reports/${jobId}/longlist/docx`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '')
      : `longlist_report_${jobId}.docx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadLonglistExcel: async (jobId) => {
    const response = await api.get(`/api/reports/${jobId}/longlist/xlsx`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '')
      : `candidate_rankings_${jobId}.xlsx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadCandidateReport: async (resultId) => {
    const response = await api.get(`/api/reports/candidate/${resultId}/docx`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '')
      : `evaluation_report_${resultId}.docx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
