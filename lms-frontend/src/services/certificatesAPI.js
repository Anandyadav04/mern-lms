// src/services/certificatesAPI.js
import api from './api'; // Import your existing axios instance

const API_BASE = '/certificates';

export const certificatesAPI = {
  // Generate a new certificate for a course
  generateCertificate: (courseId) => 
    api.post(`${API_BASE}/generate`, { courseId }),

  // Get user's certificate for a specific course
  getUserCertificate: (courseId) => 
    api.get(`${API_BASE}/user/${courseId}`),

  // Download certificate as PDF
  downloadCertificate: (certificateId) => 
    api.get(`${API_BASE}/${certificateId}/download`, { 
      responseType: 'blob' 
    }),

  // View certificate in browser
  viewCertificate: (certificateId) => 
    api.get(`${API_BASE}/${certificateId}/view`, {
      responseType: 'blob'
    }),

  // Get all certificates for the current user
  getUserCertificates: () => 
    api.get(`${API_BASE}/user`),

  // Get certificate by ID
  getCertificateById: (certificateId) => 
    api.get(`${API_BASE}/${certificateId}`),

  // Verify certificate validity
  verifyCertificate: (certificateId) => 
    api.get(`${API_BASE}/${certificateId}/verify`),

  // Share certificate via email
  shareCertificate: (certificateId, email) => 
    api.post(`${API_BASE}/${certificateId}/share`, { email }),

  // Regenerate certificate (admin function)
  regenerateCertificate: (certificateId) => 
    api.post(`${API_BASE}/${certificateId}/regenerate`),
};

// Utility function to handle blob download
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

// Utility function to open blob in new tab
export const openBlobInNewTab = (blob) => {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Don't revoke immediately as the new tab needs to load it
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export default certificatesAPI;