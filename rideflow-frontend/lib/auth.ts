export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rideflow_token");
};

export const getUser = (): any | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("rideflow_user");
  return user ? JSON.parse(user) : null;
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const logout = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("rideflow_token");
  localStorage.removeItem("rideflow_user");
};

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === "admin";
};

export const isDriver = (): boolean => {
  const user = getUser();
  return user?.role === "driver";
};

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
