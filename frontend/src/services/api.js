const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = options.headers || {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData, don't set Content-Type header
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Server bilan aloqa yo'q! Kompyuteringizda 'ISHGA_TUSHIRISH.bat' (Python server) ochiqligini tekshiring.");
  }

  if (!response.ok) {
    let errorMsg = 'Xatolik yuz berdi';
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  forgotPassword: (phone) => request('/auth/forgot-password', { method: 'POST', body: { phone } }),
  verifyResetPassword: (data) => request('/auth/verify-reset-password', { method: 'POST', body: data }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: data }),

  // Dashboard
  getDashboardStats: (role, teacherId) => 
    request(`/dashboard?role=${role}${teacherId ? `&teacher_id=${teacherId}` : ''}`),

  // Users & Teachers
  getUsers: (roleFilter) => request(`/users${roleFilter ? `?role_filter=${roleFilter}` : ''}`),
  createUser: (userData) => request('/users', { method: 'POST', body: userData }),
  updateUserProfile: (userId, formData) => request(`/users/${userId}`, { method: 'PUT', body: formData }),
  offboardTeacher: (teacherId, data) => request(`/teachers/${teacherId}/offboard`, { method: 'POST', body: data }),

  // Groups
  getGroups: (teacherId) => request(`/groups${teacherId ? `?teacher_id=${teacherId}` : ''}`),
  createGroup: (groupData) => request('/groups', { method: 'POST', body: groupData }),
  deleteGroup: (groupId, userId) => request(`/groups/${groupId}${userId ? `?user_id=${userId}` : ''}`, { method: 'DELETE' }),
  deleteUncollectedGroups: (userId) => request(`/groups/cleanup/uncollected?user_id=${userId}`, { method: 'DELETE' }),

  // Students
  getStudents: (groupId, archived = 0, teacherId = null) => {
    let url = `/students?archived=${archived}`;
    if (groupId) url += `&group_id=${groupId}`;
    if (teacherId) url += `&teacher_id=${teacherId}`;
    return request(url);
  },
  createStudent: (studentData) => request('/students', { method: 'POST', body: studentData }),
  archiveStudent: (studentId, archive = true) => 
    request(`/students/${studentId}/archive?archive=${archive}`, { method: 'PUT' }),
  transferStudent: (studentId, data) => request(`/students/${studentId}/transfer`, { method: 'POST', body: data }),

  // Attendance
  getAttendance: (groupId, date) => request(`/attendance?group_id=${groupId}&date=${date}`),
  saveAttendanceBatch: (data) => request('/attendance/batch', { method: 'POST', body: data }),

  // Payments
  getPayments: (month, groupId, teacherId) => {
    let url = `/payments?month=${month}`;
    if (groupId) url += `&group_id=${groupId}`;
    if (teacherId) url += `&teacher_id=${teacherId}`;
    return request(url);
  },
  recordPayment: (formData) => request('/payments/record', { method: 'POST', body: formData }),
  getPaymentShareReport: (month, groupId, teacherId) => {
    let url = `/payments/share-report?month=${month}`;
    if (groupId) url += `&group_id=${groupId}`;
    if (teacherId) url += `&teacher_id=${teacherId}`;
    return request(url);
  },

  // Chat
  getChatMessages: () => request('/chat'),
  sendChatMessage: (formData) => request('/chat', { method: 'POST', body: formData }),

  // Materials
  getMaterials: (teacherId) => request(`/materials${teacherId ? `?teacher_id=${teacherId}` : ''}`),
  uploadMaterial: (formData) => request('/materials', { method: 'POST', body: formData }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (formData) => request('/settings', { method: 'PUT', body: formData }),

  // Global Search
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  // Backup
  createBackup: () => request('/backup/create', { method: 'POST' }),
  getBackups: () => request('/backup/list'),
};
