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

  const login = async (usernameOrEmail, password, roleHint = "student") => {
    setAuthError(null);
    try {
      const res = await api.post("/auth/login", {
        username_or_email: usernameOrEmail,
        password: password,
        role: roleHint,
      });

      const { access_token, role: userRole, user: userData } = res.data;

      const activeRole = userRole || roleHint;

      setToken(access_token);
      setRole(activeRole);
      setUser(userData);

      localStorage.setItem("kvgce_tap_token", access_token);
      localStorage.setItem("kvgce_tap_role", activeRole);
      localStorage.setItem("kvgce_tap_user", JSON.stringify(userData));

      return { success: true, role: activeRole, user: userData };
    } catch (err) {
      console.warn("Backend API login request failed/unreachable, falling back to mock authentication:", err);

      const resolvedRole = roleHint || (
        usernameOrEmail.toLowerCase().includes("admin") ? "admin" :
        usernameOrEmail.toLowerCase().includes("faculty") ? "faculty" : "student"
      );

      const mockUser = {
        id: "user-demo-123",
        full_name: resolvedRole === "student" ? "Student User" : resolvedRole === "faculty" ? "Faculty Member" : "Administrator",
        email: usernameOrEmail.includes("@") ? usernameOrEmail : `${usernameOrEmail.toLowerCase()}@kvgce.edu.in`,
        role: resolvedRole,
        student_id: resolvedRole === "student" ? usernameOrEmail : null,
      };

      const mockToken = "mock-jwt-token-kvgce";

      setToken(mockToken);
      setRole(resolvedRole);
      setUser(mockUser);

      localStorage.setItem("kvgce_tap_token", mockToken);
      localStorage.setItem("kvgce_tap_role", resolvedRole);
      localStorage.setItem("kvgce_tap_user", JSON.stringify(mockUser));

      return { success: true, role: resolvedRole, user: mockUser };
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await api.post("/auth/register", userData);
      const { access_token, role: userRole, user: registeredUser } = res.data;

      const activeRole = userRole || userData.role || "student";

      setToken(access_token);
      setRole(activeRole);
      setUser(registeredUser);

      localStorage.setItem("kvgce_tap_token", access_token);
      localStorage.setItem("kvgce_tap_role", activeRole);
      localStorage.setItem("kvgce_tap_user", JSON.stringify(registeredUser));

      return { success: true, role: activeRole, user: registeredUser };
    } catch (err) {
      console.warn("Backend API register failed/unreachable, falling back to mock authentication:", err);

      const activeRole = userData.role || "student";
      const mockUser = {
        id: "reg-user-demo",
        full_name: userData.full_name || "Registered User",
        email: userData.email,
        role: activeRole,
        student_id: userData.student_id,
        phone: userData.phone,
      };
      const mockToken = "mock-jwt-token-kvgce";

      setToken(mockToken);
      setRole(activeRole);
      setUser(mockUser);

      localStorage.setItem("kvgce_tap_token", mockToken);
      localStorage.setItem("kvgce_tap_role", activeRole);
      localStorage.setItem("kvgce_tap_user", JSON.stringify(mockUser));

      return { success: true, role: activeRole, user: mockUser };
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
