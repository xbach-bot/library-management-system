import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Card, Button, Input, Select, Space, Row, Col, Modal, Form, 
  message, Popconfirm, Tag, Typography, Drawer, Badge 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, 
  HistoryOutlined, UserOutlined, MailOutlined 
} from '@ant-design/icons';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const Users = () => {
  const { user: currentUser } = useAuth();
  const isOnlyAdmin = currentUser && currentUser.role === 'ADMIN';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // State Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  // State Drawer Lịch sử mượn
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = useCallback(async (page = currentPage, size = pageSize, kw = keyword, role = selectedRole) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users', {
        params: {
          page: page - 1,
          size: size,
          keyword: kw || undefined,
          role: role || undefined,
          sortBy: 'id',
          sortDir: 'desc'
        }
      });
      setUsers(response.data.content);
      setTotal(response.data.totalElements);
    } catch (error) {
      message.error('Không thể tải danh sách tài khoản!');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, keyword, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, pageSize, keyword, selectedRole);
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedRole(null);
    setCurrentPage(1);
    fetchUsers(1, pageSize, '', null);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchUsers(pagination.current, pagination.pageSize, keyword, selectedRole);
  };

  const handleAddClick = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditClick = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      fullName: record.fullName,
      email: record.email,
      role: record.role,
      password: '' // Không điền sẵn password để bảo mật
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/users/${id}`);
      message.success('Xóa người dùng thành công!');
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa thất bại!');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingId) {
        await apiClient.put(`/users/${editingId}`, values);
        message.success('Cập nhật tài khoản thành công!');
      } else {
        await apiClient.post('/users', values);
        message.success('Tạo tài khoản mới thành công! (Mật khẩu mặc định: 123456 nếu để trống)');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  // Mở Drawer xem lịch sử mượn
  const handleHistoryClick = async (record) => {
    setSelectedUser(record);
    setIsDrawerOpen(true);
    setHistoryLoading(true);
    try {
      const response = await apiClient.get(`/borrow/user/${record.id}`);
      setBorrowHistory(response.data.content);
    } catch (error) {
      message.error('Không thể tải lịch sử mượn sách!');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRoleTagColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'gold';
      case 'LIBRARIAN': return 'blue';
      case 'READER': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text) => <span style={{ fontWeight: 600, color: 'var(--text-title)' }}><UserOutlined /> {text}</span>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span><MailOutlined /> {text}</span>
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={getRoleTagColor(role)}>{role}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<HistoryOutlined style={{ color: 'var(--success-color)' }} />} 
            onClick={() => handleHistoryClick(record)} 
            title="Lịch sử mượn sách"
          />
          <Button type="text" icon={<EditOutlined style={{ color: 'var(--primary-color)' }} />} onClick={() => handleEditClick(record)} />
          {isOnlyAdmin && (
            <Popconfirm
              title="Bạn chắc chắn muốn xóa tài khoản này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'id',
      key: 'id',
      width: 90,
    },
    {
      title: 'Sách mượn',
      dataIndex: 'books',
      key: 'books',
      render: (books) => (
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          {books?.map(b => <li key={b.id}>{b.title}</li>)}
        </ul>
      )
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'borrowDate',
      key: 'borrowDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Hạn trả',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Ngày trả thực tế',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        let label = 'Đang mượn';
        if (status === 'RETURNED') { color = 'green'; label = 'Đã trả'; }
        if (status === 'OVERDUE') { color = 'red'; label = 'Quá hạn'; }
        return <Tag color={color}>{label}</Tag>;
      }
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ color: 'var(--text-title)', margin: 0 }}>👥 Quản Lý Người Dùng & Độc Giả</Title>
          <Paragraph style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Quản lý độc giả thư viện, phân quyền và kiểm tra lịch sử mượn trả sách.
          </Paragraph>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large" style={{ borderRadius: 8 }}>
            Tạo Tài Khoản Mới
          </Button>
        </Col>
      </Row>

      {/* Bộ lọc */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }} className="glass-card">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Tìm theo tên độc giả, email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Lọc theo vai trò"
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: '100%', borderRadius: 8 }}
              allowClear
            >
              <Option value="READER">Độc giả (Reader)</Option>
              <Option value="LIBRARIAN">Thủ thư (Librarian)</Option>
              <Option value="ADMIN">Quản trị viên (Admin)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Space>
              <Button type="primary" onClick={handleSearch} style={{ borderRadius: 8 }}>Tìm kiếm</Button>
              <Button onClick={handleReset} style={{ borderRadius: 8 }}>Làm mới</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      {/* Modal CRUD */}
      <Modal
        title={editingId ? 'Cập Nhật Tài Khoản' : 'Tạo Tài Khoản Mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ và tên người dùng" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input placeholder="example@domain.com" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingId ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
            rules={editingId ? [] : [{ min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}
          >
            <Input.Password placeholder={editingId ? "Để trống nếu không thay đổi" : "Nhập mật khẩu (Mặc định: 123456)"} style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò" style={{ borderRadius: 6 }}>
              <Option value="READER">Độc giả (Reader)</Option>
              <Option value="LIBRARIAN">Thủ thư (Librarian)</Option>
              <Option value="ADMIN">Quản trị viên (Admin)</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 6 }}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ borderRadius: 6 }}>
                Lưu lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer xem lịch sử mượn sách */}
      <Drawer
        title={`Lịch sử mượn sách - ${selectedUser?.fullName}`}
        placement="right"
        width={750}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        destroyOnClose
      >
        <Paragraph style={{ color: 'var(--text-secondary)' }}>
          Danh sách các cuốn sách độc giả **{selectedUser?.fullName}** ({selectedUser?.email}) đã và đang mượn từ thư viện.
        </Paragraph>
        <Table
          columns={historyColumns}
          dataSource={borrowHistory}
          rowKey="id"
          loading={historyLoading}
          pagination={{ pageSize: 5 }}
          style={{ overflow: 'hidden' }}
        />
      </Drawer>
    </div>
  );
};

export default Users;
