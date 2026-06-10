import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-gradient)' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." style={{ color: '#fff' }} />
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang Đăng nhập và lưu lại vị trí muốn truy cập ban đầu
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có phân quyền vai trò cụ thể và người dùng không có vai trò phù hợp
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Nếu độc giả cố truy cập trang Admin, chuyển họ về trang xem Sách
    if (user.role === 'READER') {
      return <Navigate to="/books" replace />;
    }
    // Nếu không, quay về trang đăng nhập
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
