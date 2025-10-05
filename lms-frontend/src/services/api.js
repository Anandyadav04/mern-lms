// src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout to prevent infinite buffering
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  setToken: (token) => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`
    } else {
      delete api.defaults.headers.Authorization
    }
  }
}

export const lessonsAPI = {
  getByCourse: (courseId) => api.get(`/lessons/course/${courseId}`),
  getById: (id) => api.get(`/lessons/${id}`),
  create: (lessonData) => {
    const courseId = lessonData.course;
    return api.post(`/lessons/course/${courseId}`, lessonData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  update: (id, lessonData) => api.put(`/lessons/${id}`, lessonData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => api.delete(`/lessons/${id}`),
  complete: (id) => api.post(`/lessons/${id}/complete`)
}

export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getByInstructor: (instructorId) => api.get(`/courses/instructor/${instructorId}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => api.delete(`/courses/${id}`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
}

export const quizzesAPI = {
  submitQuiz: async (lessonId, quizData) => {
    const response = await api.post(`/quiz/${lessonId}/submit`, quizData);
    return response;
  },
  getQuizResults: async (lessonId) => {
    const response = await api.get(`/quiz/${lessonId}/results`);
    return response;
  },
  getBestQuizResult: async (lessonId) => {
    const response = await api.get(`/quiz/${lessonId}/best`);
    return response;
  }
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getEnrolledCourses: () => api.get('/users/enrolled-courses'),
  getCourseProgress: (courseId) => api.get(`/users/progress/${courseId}`)
}

export const certificatesAPI = {
  generateCertificate: (courseId) => api.post('/certificates', { courseId }),
  getUserCertificate: (courseId) => api.get(`/certificates/course/${courseId}`),
  getUserCertificates: () => api.get('/certificates/user'),
  getCertificateById: (certificateId) => api.get(`/certificates/${certificateId}`),
  // Download certificate as PDF
  downloadCertificate: (certificateId) => api.get(`/certificates/${certificateId}/download`, { 
    responseType: 'blob' 
  }),
  // View certificate in browser
  viewCertificate: (certificateId) => api.get(`/certificates/${certificateId}/view`, {
    responseType: 'blob'
  }),
  verifyCertificate: (certificateId) => api.get(`/certificates/${certificateId}/verify`),
  shareCertificate: (certificateId, email) => api.post(`/certificates/${certificateId}/share`, { email }),
};

// Utility functions for blob handling
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
};

export const openBlobInNewTab = (blob) => {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const adminAPI = {
  // Dashboard statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // User management
  createUser: (userData) => api.post('/admin/users', userData),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, roleData) => api.patch(`/admin/users/${userId}/role`, roleData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Course management
  getCourses: (params) => api.get('/admin/courses', { params }),
  getPendingCourses: () => api.get('/admin/courses/pending'),
  updateCourseStatus: (courseId, statusData) => api.patch(`/admin/courses/${courseId}/status`, statusData),
  deleteCourse: (courseId) => api.delete(`/admin/courses/${courseId}`), // Add this
  
  // Analytics and reports
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  generateReport: (reportData) => api.post('/admin/reports', reportData),
  getAnalyticsOverview: () => api.get('/admin/analytics/overview'),
  getEnrollmentAnalytics: (params) => api.get('/admin/analytics/enrollments', { params }),
  getCourseAnalytics: () => api.get('/admin/analytics/courses'),
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  
  // Reports
  generateReport: (type, format = 'json') => api.get(`/admin/reports/${type}?format=${format}`),
}

// FIXED: Remove duplicate generateReport and fix the ratings API
// Temporary mock for testing - remove when backend is ready
export const ratingsAPI = {
  submitRating: async (courseId, data) => {
    console.log('Mock: Submitting rating', { courseId, data });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock success response
    return {
      data: {
        message: 'Rating submitted successfully (mock)',
        data: {
          _id: 'mock-rating-id',
          user: { _id: 'mock-user-id', name: 'Current User' },
          rating: data.rating,
          review: data.review,
          createdAt: new Date()
        }
      }
    };
  },
  
  getCourseRatings: async (courseId) => {
    return { data: { data: [] } };
  },
  
  getRatingStats: async (courseId) => {
    return { 
      data: { 
        averageRating: 0, 
        totalRatings: 0, 
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
      } 
    };
  },
  
  deleteRating: async (courseId) => {
    return { data: { message: 'Rating deleted successfully (mock)' } };
  },
  
  getMyRating: async (courseId) => {
    throw new Error('No rating found (mock)');
  }
};

// Add progress API methods
export const progressAPI = {
  getProgress: (courseId) => api.get(`/progress/courses/${courseId}`),
  
  updateLessonProgress: (courseId, lessonId, data) => 
    api.post(`/progress/courses/${courseId}/lessons/${lessonId}`, data),
  
  updateCourseProgress: (courseId, data) => 
    api.put(`/progress/courses/${courseId}`, data),
  
  getAllProgress: () => api.get('/progress'),
  getQuickProgress: (courseId) => api.get(`/progress/courses/${courseId}/quick`),

};

export const analyticsAPI = {
  // Get instructor overview
  getOverview: () => api.get('/analytics/overview'),
  
  // Get course-specific analytics
  getCourseAnalytics: (courseId) => api.get(`/analytics/course/${courseId}`),
  
  // Get student progress across all courses
  getStudentProgress: () => api.get('/analytics/students/progress'),
  
  // Get revenue data (if applicable)
  getRevenueData: () => api.get('/analytics/revenue')
};

export default api