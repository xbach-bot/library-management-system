import React, { useState, useEffect } from 'react';
import { FaSwatchbook } from 'react-icons/fa6';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Tag, Popover, Badge, List } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BookOutlined,
  FolderOutlined,
  UserOutlined,
  HistoryOutlined,
  LogoutOutlined,
  ProfileOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State thông báo
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/users/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Không thể tải thông báo:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Tự động làm mới thông báo mỗi 30 giây (polling)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
    }
  };

  // Định nghĩa các phần tử menu dựa trên vai trò của người dùng
  const getMenuItems = () => {
    const isAdminOrLibrarian = user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN');

    const items = [];

    if (isAdminOrLibrarian) {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard Thống kê',
      });
    }

    items.push({
      key: '/books',
      icon: <BookOutlined />,
      label: 'Quản lý Sách',
    });

    if (isAdminOrLibrarian) {
      items.push({
        key: '/categories',
        icon: <FolderOutlined />,
        label: 'Thể loại Sách',
      });
      items.push({
        key: '/readers',
        icon: <UserOutlined />,
        label: 'Quản lý Độc giả',
      });
      items.push({
        key: '/borrow',
        icon: <HistoryOutlined />,
        label: 'Mượn Trả Sách',
      });
    } else {
      // Reader menu
      items.push({
        key: '/borrow', // Đối với reader, chuyển hướng xem lịch sử mượn
        icon: <HistoryOutlined />,
        label: 'Lịch sử mượn sách',
      });
    }

    items.push({
      key: '/profile',
      icon: <ProfileOutlined />,
      label: 'Hồ sơ cá nhân',
    });

    return items;
  };

  const menuItems = getMenuItems();

  const getRoleTagColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'gold';
      case 'LIBRARIAN': return 'blue';
      case 'READER': return 'green';
      default: return 'default';
    }
  };

  const userDropdownItems = [
    {
      key: '/profile',
      icon: <ProfileOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 8 }}>
        <Text strong>Thông báo cá nhân</Text>
        {notifications.length > 0 && (
          <Button type="link" size="small" onClick={() => setNotifications([])} style={{ padding: 0 }}>
            Xóa hiển thị
          </Button>
        )}
      </div>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{ emptyText: 'Bạn không có thông báo nào.' }}
        renderItem={item => (
          <List.Item style={{ padding: '8px 0' }}>
            <List.Item.Meta
              title={<Text strong style={{ fontSize: 13 }}>{item.title}</Text>}
              description={
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-paragraph)', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.content}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
        style={{ maxHeight: 300, overflowY: 'auto' }}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg" onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Title level={4} style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {collapsed ? (
              <FaSwatchbook style={{ fontSize: '20px', color: '#3b82f6' }} />
            ) : (
              <Space size="small">
                <FaSwatchbook style={{ color: '#3b82f6', fontSize: '20px' }} />
                <span>Thư Viện</span>
              </Space>
            )}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ paddingTop: 16 }}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64, color: 'var(--text-title)' }}
          />
          <Space size="large">
            {user && (
              <Popover
                content={notificationContent}
                title={null}
                trigger="click"
                placement="bottomRight"
                overlayClassName="notification-popover"
              >
                <Badge count={notifications.length} size="small" offset={[-2, 4]}>
                  <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 20, color: 'var(--text-title)' }} />}
                    style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                  />
                </Badge>
              </Popover>
            )}
            {user && (
              <Dropdown menu={{ items: userDropdownItems, onClick: handleMenuClick }} placement="bottomRight" arrow>
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                    <Text strong style={{ color: 'var(--text-title)' }}>{user.fullName}</Text>
                    <Tag color={getRoleTagColor(user.role)} style={{ margin: 0, fontSize: '10px', width: 'fit-content' }}>
                      {user.role}
                    </Tag>
                  </div>
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, overflow: 'initial' }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', color: 'var(--text-secondary)', background: 'transparent', padding: '16px 0' }}>
          Library Management System ©{new Date().getFullYear()} - HXB
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
