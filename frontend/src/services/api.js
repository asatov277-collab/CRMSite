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
  getUsers: (roleFilter, branchId = null) => {
    let url = `/users?`;
    if (roleFilter) url += `role_filter=${roleFilter}&`;
    if (branchId) url += `branch_id=${branchId}&`;
    return request(url);
  },
  createUser: (userData) => request('/users', { method: 'POST', body: userData }),
  updateUserProfile: (userId, formData) => request(`/users/${userId}`, { method: 'PUT', body: formData }),
  adminEditUser: (userId, data) => request(`/users/${userId}/admin-edit`, { method: 'PUT', body: data }),
  offboardTeacher: (teacherId, data) => request(`/teachers/${teacherId}/offboard`, { method: 'POST', body: data }),

  // Groups
  getGroups: (teacherId = null, branchId = null) => {
    let url = `/groups?`;
    if (teacherId) url += `teacher_id=${teacherId}&`;
    if (branchId) url += `branch_id=${branchId}&`;
    return request(url);
  },
  createGroup: (groupData) => request('/groups', { method: 'POST', body: groupData }),
  deleteGroup: (groupId, userId) => request(`/groups/${groupId}${userId ? `?user_id=${userId}` : ''}`, { method: 'DELETE' }),
  deleteUncollectedGroups: (userId) => request(`/groups/cleanup/uncollected?user_id=${userId}`, { method: 'DELETE' }),

  // Students
  getStudents: (groupId = null, archived = 0, teacherId = null, branchId = null) => {
    let url = `/students?archived=${archived}`;
    if (groupId) url += `&group_id=${groupId}`;
    if (teacherId) url += `&teacher_id=${teacherId}`;
    if (branchId) url += `&branch_id=${branchId}`;
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
  getChatMessages: (branchId = null) => request(`/chat${branchId ? `?branch_id=${branchId}` : ''}`),
  sendChatMessage: (formData) => request('/chat', { method: 'POST', body: formData }),
  deleteChatMessage: (messageId, userId, role) => 
    request(`/chat/${messageId}?user_id=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`, { method: 'DELETE' }),

  // Branches (Filiallar)
  getBranches: () => request('/branches'),
  createBranch: (data) => request('/branches', { method: 'POST', body: data }),
  updateBranch: (branchId, data) => request(`/branches/${branchId}`, { method: 'PUT', body: data }),
  deleteBranch: (branchId) => request(`/branches/${branchId}`, { method: 'DELETE' }),

  // Managers (Filial Menejerlari)
  getManagers: (branchId = null) => request(`/managers${branchId ? `?branch_id=${branchId}` : ''}`),
  createManager: (data) => request('/managers', { method: 'POST', body: data }),
  deleteManager: (managerId) => request(`/managers/${managerId}`, { method: 'DELETE' }),

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
