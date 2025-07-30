import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://51.21.196.9";
  axios.defaults.baseURL = API_BASE_URL;

  // Configure axios interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          toast.error("Session expired. Please login again.");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.error("Error parsing user data:", error);
        logout();
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setUser(userData);
      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Login failed";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await axios.post("/auth/register", userData);
      const { access_token, user: newUser } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(newUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setUser(newUser);
      toast.success(
        "Registration successful! Please check your email for verification."
      );
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Registration failed";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const googleAuth = useCallback(async (token) => {
    try {
      const response = await axios.post("/auth/google", { token });
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setUser(userData);
      toast.success("Google authentication successful!");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Google authentication failed";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      await axios.post("/auth/forgot-password", { email });
      toast.success("Password reset link sent to your email!");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Failed to send reset email";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      await axios.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      toast.success("Password reset successful!");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Failed to reset password";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const verifyEmail = useCallback(
    async (token) => {
      try {
        await axios.post("/auth/verify-email", { token });
        toast.success("Email verified successfully!");
        // Update user data to reflect verification
        if (user) {
          const updatedUser = { ...user, is_verified: true };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        return { success: true };
      } catch (error) {
        const errorMessage =
          error.response?.data?.detail || "Email verification failed";
        toast.error(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [user]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    toast.success("Logged out successfully!");
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      googleAuth,
      forgotPassword,
      resetPassword,
      verifyEmail,
      logout,
      loading,
    }),
    [
      user,
      login,
      register,
      googleAuth,
      forgotPassword,
      resetPassword,
      verifyEmail,
      logout,
      loading,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
