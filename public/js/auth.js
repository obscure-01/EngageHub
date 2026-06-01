// Authentication Helper Script for EngageHub

const AUTH_TOKEN_KEY = 'engagehub_token';
const AUTH_USER_KEY = 'engagehub_user';

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getUser() {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function saveAuth(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function logout() {
  clearAuth();
  window.location.href = '/';
}

function checkAuth(requiredRole) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    clearAuth();
    window.location.href = '/';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert(`Access denied: Requires '${requiredRole}' role.`);
    if (user.role === 'Admin') {
      window.location.href = '/admin.html';
    } else if (user.role === 'Student') {
      window.location.href = '/student.html';
    } else {
      window.location.href = '/';
    }
    return null;
  }

  return user;
}
