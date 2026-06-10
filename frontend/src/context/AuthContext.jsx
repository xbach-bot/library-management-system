import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser && token) {
        // Tạm thời khôi phục từ localStorage để tránh chớp nháy UI
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        try {
          // Lấy thông tin cá nhân mới nhất để đồng bộ và cập nhật lỗi font chữ (nếu có)
          const response = await apiClient.get('/users/profile');
          const freshUser = {
            id: response.data.id,
            email: response.data.email,
            fullName: response.data.fullName,
            role: response.data.role
          };
          localStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
        } catch (error) {
          console.error("Không thể cập nhật thông tin cá nhân mới nhất:", error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, id, fullName, role } = response.data;
      
      const userData = { id, email, fullName, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản, mật khẩu!';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (fullName, email, password, role) => {
    try {
      await apiClient.post('/auth/register', { fullName, email, password, role });
    } catch (error) {
      throw error.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!';
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
