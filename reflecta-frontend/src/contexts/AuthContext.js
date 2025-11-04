import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

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

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 로그인 상태 확인
    const checkAuthStatus = () => {
      try {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("currentUser");
        apiService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      console.log("AuthContext - login response:", response);
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role || "student",
      };
      console.log("AuthContext - userData to set:", userData);
      setUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      const user = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role || "student",
      };
      setUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  const registerCounselor = async (userData) => {
    try {
      const response = await apiService.registerCounselor(userData);
      const user = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role || "counselor",
      };
      setUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      console.error("Counselor registration error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    apiService.logout();
  };

  const loginAsDemo = async () => {
    try {
      const response = await apiService.login({
        email: "demo@reflecta.com",
        password: "demo123",
      });
      console.log("AuthContext - demo login response:", response);
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role || "student",
      };
      setUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error("Demo login error:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    login,
    register,
    registerCounselor,
    logout,
    loginAsDemo,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
