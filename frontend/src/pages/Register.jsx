import React, { useState } from 'react';
import { FaSwatchbook } from 'react-icons/fa6';
import { Card, Form, Input, Button, Typography, Alert, Select, message, Layout } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await register(values.fullName, values.email, values.password, 'READER');
      message.success('Đăng ký tài khoản thành công! Hãy đăng nhập.');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-layout)' }}>
      <div style={{ width: '100%', maxWidth: 450, padding: '0 16px' }}>
        <Card className="glass-card hover-scale" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ color: 'var(--text-title)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FaSwatchbook style={{ color: '#3b82f6' }} />
              <span>Đăng Ký</span>
            </Title>
            <Text style={{ color: 'var(--text-secondary)' }}>Tạo tài khoản mới để tham gia hệ thống thư viện</Text>
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
            name="register_form"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            initialValues={{ role: 'READER' }}
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập Họ và tên!' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="Họ và tên"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="Địa chỉ Email"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập Mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>



            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 8, height: 45, fontWeight: 600 }}>
                Đăng Ký Tài Khoản
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: 'var(--text-secondary)' }}>Đã có tài khoản? </Text>
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Đăng nhập</Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
