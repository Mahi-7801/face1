import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('admin')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  getMe: () => api.get('/api/auth/me'),
}

export const employeeAPI = {
  list: () => api.get('/api/employees/'),
  get: (id) => api.get(`/api/employees/${id}`),
  register: (formData) => api.post('/api/employees/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/api/employees/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/api/employees/${id}`),
}

export const attendanceAPI = {
  recognize: (data) => api.post('/api/attendance/recognize', data),
  getToday: () => api.get('/api/attendance/today'),
  getReports: (params) => api.get('/api/attendance/reports', { params }),
  getStats: () => api.get('/api/attendance/stats'),
  exportData: (params) => api.get('/api/attendance/export', { params }),
}

export default api
