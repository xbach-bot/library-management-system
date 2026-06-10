import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Tag, List, Timeline, Space, Badge, message } from 'antd';
import { UserOutlined, MailOutlined, KeyOutlined, BellOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const { Title, Text, Paragraph } = Typography;

const Profile = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/users/notifications');
        setNotifications(response.data);
      } catch (error) {
        message.error('Không thể tải danh sách thông báo!');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getRoleTagColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'gold';
      case 'LIBRARIAN': return 'blue';
      case 'READER': return 'green';
      default: return 'default';
    }
  };

  const getNotificationIcon = (title) => {
    if (title.includes('Mượn')) return <Badge status="processing" />;
    if (title.includes('Trả')) return <Badge status="success" />;
    if (title.includes('hạn') || title.includes('cảnh báo')) return <Badge status="error" />;
    return <Badge status="default" />;
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* Cột thông tin cá nhân */}
        <Col xs={24} md={10}>
          <Card className="glass-card hover-scale" style={{ textAlign: 'center', borderRadius: 16 }}>
            <Avatar 
              size={110} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: 'var(--primary-color)', marginBottom: 16, border: '4px solid var(--border-color)' }}
            />
            <Title level={3} style={{ color: 'var(--text-title)', margin: '8px 0' }}>{user?.fullName}</Title>
            <Tag color={getRoleTagColor(user?.role)} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12, marginBottom: 24 }}>
              {user?.role}
            </Tag>

            <div style={{ textAlign: 'left', marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 12 }}>ĐỊA CHỈ EMAIL</Text>
                  <Text strong style={{ color: 'var(--text-paragraph)', fontSize: 16 }}><MailOutlined /> {user?.email}</Text>
                </div>
                <div>
                  <Text style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 12 }}>MÃ ĐỘC GIẢ / THỦ THƯ</Text>
                  <Text strong style={{ color: 'var(--text-paragraph)', fontSize: 16 }}><KeyOutlined /> #{user?.id}</Text>
                </div>
                <div>
                  <Text style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 12 }}>TRẠNG THÁI TÀI KHOẢN</Text>
                  <Tag color="cyan">Đang hoạt động</Tag>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Cột thông báo cá nhân */}
        <Col xs={24} md={14}>
          <Card 
            className="glass-card" 
            title={<span style={{ color: 'var(--text-title)' }}><BellOutlined /> Thông báo & Lịch sử hoạt động gần đây</span>} 
            style={{ borderRadius: 16, minHeight: 400 }}
          >
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <ClockCircleOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                <p>Không có thông báo mới nào dành cho bạn.</p>
              </div>
            ) : (
              <Timeline 
                mode="left" 
                pending={loading && "Đang tải thông báo..."}
                style={{ marginTop: 16 }}
              >
                {notifications.map(noti => (
                  <Timeline.Item 
                    key={noti.id}
                    dot={getNotificationIcon(noti.title)}
                  >
                    <div style={{ backgroundColor: 'var(--bg-layout)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ color: 'var(--text-title)' }}>{noti.title}</Text>
                        <Text style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                          {new Date(noti.createdAt).toLocaleString()}
                        </Text>
                      </div>
                      <Paragraph style={{ color: 'var(--text-paragraph)', margin: 0, fontSize: 13 }}>
                        {noti.content}
                      </Paragraph>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
