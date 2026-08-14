import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("kvgce_tap_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("kvgce_tap_token") || null);
  const [role, setRole] = useState(() => localStorage.getItem("kvgce_tap_role") || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem("kvgce_tap_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.user) {
          setUser(res.data.user);
          setRole(res.data.user.role);
          localStorage.setItem("kvgce_tap_user", JSON.stringify(res.data.user));
          localStorage.setItem("kvgce_tap_role", res.data.user.role);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
    setAuthError(null);
    try {
      const res = await api.post("/auth/login", {
        username_or_email: usernameOrEmail,
        password: password,
      });

      const { access_token, role: userRole, user: userData } = res.data;

      setToken(access_token);
      setRole(userRole);
      setUser(userData);

      localStorage.setItem("kvgce_tap_token", access_token);
      localStorage.setItem("kvgce_tap_role", userRole);
      localStorage.setItem("kvgce_tap_user", JSON.stringify(userData));

      return { success: true, role: userRole, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.detail || "Login failed. Please check your credentials.";
      setAuthError(message);
      return { success: false, message };
    }
  };

  const register = async (studentData) => {
    setAuthError(null);
    try {
      const res = await api.post("/auth/register", studentData);
      const { access_token, role: userRole, user: userData } = res.data;

      setToken(access_token);
      setRole(userRole);
      setUser(userData);

      localStorage.setItem("kvgce_tap_token", access_token);
      localStorage.setItem("kvgce_tap_role", userRole);
      localStorage.setItem("kvgce_tap_user", JSON.stringify(userData));

      return { success: true, role: userRole, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.detail || "Registration failed. Please try again.";
      setAuthError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem("kvgce_tap_token");
    localStorage.removeItem("kvgce_tap_role");
    localStorage.removeItem("kvgce_tap_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        authError,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
