import React, { useState } from 'react';
import { FaSwatchbook } from 'react-icons/fa6';
import { Card, Form, Input, Button, Typography, Alert, message, Layout } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const userData = await login(values.email, values.password);
      message.success(`Chào mừng ${userData.fullName} quay trở lại!`);
      
      // Định tuyến dựa trên vai trò
      if (userData.role === 'ADMIN' || userData.role === 'LIBRARIAN') {
        navigate('/dashboard');
      } else {
        navigate('/books'); // Độc giả chuyển đến trang xem sách
      }
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-layout)' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
        <Card className="glass-card hover-scale" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ color: 'var(--text-title)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FaSwatchbook style={{ color: '#3b82f6' }} />
              <span>Thư Viện</span>
            </Title>
            <Text style={{ color: 'var(--text-secondary)' }}>Đăng nhập để quản lý tài khoản & mượn sách</Text>
          </div>

          {errorMsg && (
            <Alert
              message={errorMsg}
              type="error"
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />} 
                placeholder="Email của bạn" 
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="Mật khẩu"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 8, height: 45, fontWeight: 600 }}>
                Đăng Nhập
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: 'var(--text-secondary)' }}>Chưa có tài khoản? </Text>
            <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Đăng ký ngay</Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
