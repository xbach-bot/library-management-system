import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Import các trang
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Categories from './pages/Categories';
import Users from './pages/Users';
import BorrowRecords from './pages/BorrowRecords';
import Profile from './pages/Profile';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563EB',
          colorSuccess: '#22C55E',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#3B82F6',
          borderRadius: 8,
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <HashRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes inside MainLayout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Admin & Librarian Routes */}
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="categories" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                    <Categories />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="readers" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
                    <Users />
                  </ProtectedRoute>
                } 
              />

              {/* Shared Protected Routes */}
              <Route path="books" element={<Books />} />
              <Route path="borrow" element={<BorrowRecords />} />
              <Route path="profile" element={<Profile />} />

              {/* Mặc định chuyển hướng khi vào trang chủ */}
              <Route index element={<Navigate to="/books" replace />} />
            </Route>

            {/* Bất kỳ route nào khác không khớp */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;
