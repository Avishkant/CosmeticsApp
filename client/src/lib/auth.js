import api from "./api";

export function saveTokens(access, refresh) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function getAccess() {
  return localStorage.getItem("access");
}

export function getRefresh() {
  return localStorage.getItem("refresh");
}

export function isAuthenticated() {
  return !!getAccess();
}

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  // server returns { data: { user, access, refresh } }
  return (res.data && res.data.data) || res.data;
}

export async function register(name, email, password) {
  const res = await api.post("/auth/register", { name, email, password });
  return (res.data && res.data.data) || res.data;
}

export async function refreshToken(refresh) {
  const res = await api.post("/auth/refresh", { token: refresh });
  return (res.data && res.data.data) || res.data;
}

export function saveUser(user) {
  try {
    localStorage.setItem("user", JSON.stringify(user || null));
  } catch {
    /* ignore */
  }
}

export function getUser() {
  try {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function isAdmin() {
  const u = getUser();
  return !!(u && u.role === "admin");
}

// enhance clearTokens to remove stored user
export function clearAllAuth() {
  clearTokens();
  try {
    localStorage.removeItem("user");
  } catch {
    /* ignore */
  }
}

// logout: call server to revoke refresh token, then clear local storage
export async function logout() {
  try {
    const refresh = getRefresh();
    if (refresh) {
      // best-effort server call to invalidate refresh token
      await api.post("/auth/logout", { token: refresh }).catch(() => {});
    }
  } catch {
    // ignore
  }
  clearAllAuth();
}
