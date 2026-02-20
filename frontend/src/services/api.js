import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Reports API
export const reportsApi = {
  downloadLonglistDocx: (jobId) => {
    return `${API_BASE_URL}/reports/${jobId}/longlist/docx`;
  },

  downloadLonglistExcel: (jobId) => {
    return `${API_BASE_URL}/reports/${jobId}/longlist/xlsx`;
  },

  downloadCandidateReport: (resultId) => {
    return `${API_BASE_URL}/reports/candidate/${resultId}/docx`;
  },
};

export default api;
