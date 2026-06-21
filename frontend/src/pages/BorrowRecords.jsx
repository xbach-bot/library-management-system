import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Button, Input, Select, Space, Row, Col, Modal, Form,
  message, Tag, Typography, Badge, InputNumber
} from 'antd';
import {
  PlusOutlined, SearchOutlined, CheckCircleOutlined,
  HistoryOutlined, BookOutlined, UserOutlined
} from '@ant-design/icons';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const BorrowRecords = () => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN');

  // State phiếu mượn
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  // State danh sách độc giả và sách để điền vào Form tạo phiếu
  const [readers, setReaders] = useState([]);
  const [booksList, setBooksList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Lấy danh sách phiếu mượn (nếu là Admin/Librarian thì lấy tất cả, Reader chỉ lấy lịch sử cá nhân)
  const fetchRecords = useCallback(async (page = 1, size = 10, kw = '', status = null) => {
    setLoading(true);
    try {
      let response;
      if (isAdminOrLibrarian) {
        response = await apiClient.get('/borrow', {
          params: {
            page: page - 1,
            size: size,
            keyword: kw || undefined,
            status: status || undefined,
            sortBy: 'id',
            sortDir: 'desc'
          }
        });
      } else {
        // Độc giả tự xem lịch sử
        response = await apiClient.get('/borrow/my-history', {
          params: {
            page: page - 1,
            size: size,
            sortBy: 'id',
            sortDir: 'desc'
          }
        });
      }
      setRecords(response.data.content);
      setTotal(response.data.totalElements);
    } catch (error) {
      message.error('Không thể tải danh sách phiếu mượn!');
    } finally {
      setLoading(false);
    }
  }, [isAdminOrLibrarian]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Load danh sách độc giả và sách có sẵn để tạo phiếu
  const loadFormData = async () => {
    try {
      const [readersRes, booksRes] = await Promise.all([
        apiClient.get('/users', { params: { role: 'READER', size: 100 } }),
        apiClient.get('/books', { params: { size: 100 } })
      ]);
      setReaders(readersRes.data.content);
      // Chỉ cho phép chọn các sách còn trong kho
      setBooksList(booksRes.data.content.filter(b => b.availableQuantity > 0));
    } catch (error) {
      message.error('Không thể tải thông tin độc giả hoặc sách để tạo phiếu!');
    }
  };

  const handleOpenAddModal = () => {
    loadFormData();
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords(1, pageSize, keyword, statusFilter);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter(null);
    setCurrentPage(1);
    fetchRecords(1, pageSize, '', null);
  };

  // Xử lý Lọc theo trạng thái
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchRecords(1, pageSize, keyword, status);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchRecords(pagination.current, pagination.pageSize, keyword, statusFilter);
  };

  // Trả sách
  const handleReturnBook = async (recordId) => {
    try {
      await apiClient.post(`/borrow/${recordId}/return`);
      message.success(`Đã xác nhận trả sách cho phiếu mượn #${recordId} thành công!`);
      fetchRecords(currentPage, pageSize, keyword, statusFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  // Yêu cầu gia hạn (Độc giả)
  const handleRequestExtension = async (recordId) => {
    try {
      await apiClient.post(`/borrow/${recordId}/request-extension`);
      message.success('Đã gửi yêu cầu gia hạn sách thành công! Đang chờ thủ thư phê duyệt.');
      fetchRecords(currentPage, pageSize, keyword, statusFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Yêu cầu gia hạn thất bại!');
    }
  };

  // Phê duyệt gia hạn (Thủ thư/Admin)
  const handleApproveExtension = async (recordId) => {
    try {
      await apiClient.post(`/borrow/${recordId}/approve-extension`);
      message.success('Đã duyệt gia hạn phiếu mượn thêm 7 ngày thành công!');
      fetchRecords(currentPage, pageSize, keyword, statusFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  // Từ chối gia hạn (Thủ thư/Admin)
  const handleRejectExtension = async (recordId) => {
    try {
      await apiClient.post(`/borrow/${recordId}/reject-extension`);
      message.success('Đã từ chối yêu cầu gia hạn sách.');
      fetchRecords(currentPage, pageSize, keyword, statusFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  // Tạo phiếu mượn mới
  const handleCreateRecord = async (values) => {
    setSubmitLoading(true);
    try {
      await apiClient.post('/borrow', values);
      message.success('Tạo phiếu mượn sách thành công!');
      setIsModalOpen(false);
      fetchRecords(currentPage, pageSize, keyword, statusFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Tạo phiếu mượn thất bại!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusTag = (record) => {
    const status = record.status;
    let tag = null;
    switch (status) {
      case 'BORROWED':
        tag = <Tag color="blue" style={{ borderRadius: 4 }}>Đang mượn</Tag>;
        break;
      case 'RETURNED':
        tag = <Tag color="green" style={{ borderRadius: 4 }}>Đã trả</Tag>;
        break;
      case 'OVERDUE':
        tag = <Tag color="red" style={{ borderRadius: 4 }}>Quá hạn</Tag>;
        break;
      default:
        tag = <Tag style={{ borderRadius: 4 }}>{status}</Tag>;
    }
    return (
      <Space direction="vertical" size={2} style={{ display: 'flex' }}>
        {tag}
        {record.extensionRequested && <Tag color="warning" style={{ borderRadius: 4 }}>Chờ gia hạn</Tag>}
        {record.extensionCount >= 1 && <Tag color="purple" style={{ borderRadius: 4 }}>Đã gia hạn (+7d)</Tag>}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id) => <span style={{ fontWeight: 600 }}>#{id}</span>
    },
    ...(isAdminOrLibrarian ? [{
      title: 'Độc giả',
      key: 'user',
      render: (_, record) => (
        <div>
          <span style={{ fontWeight: 500, color: 'var(--text-title)' }}><UserOutlined /> {record.userFullName}</span>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{record.userEmail}</div>
        </div>
      )
    }] : []),
    {
      title: 'Sách mượn',
      dataIndex: 'books',
      key: 'books',
      render: (books) => (
        <Space direction="vertical" size="small">
          {books.map(b => (
            <div key={b.id}>
              <Badge status="processing" />
              <span style={{ color: 'var(--text-paragraph)' }}><BookOutlined /> {b.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}> ({b.author})</span>
            </div>
          ))}
        </Space>
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
      render: (date, record) => {
        const isOverdue = new Date(date) < new Date() && record.status !== 'RETURNED';
        return <span style={{ color: isOverdue ? 'var(--danger-color)' : 'var(--text-paragraph)', fontWeight: isOverdue ? 600 : 'normal' }}>{new Date(date).toLocaleDateString()}</span>;
      }
    },
    {
      title: 'Ngày trả',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => getStatusTag(record)
    },
    ...(isAdminOrLibrarian ? [{
      title: 'Hành động',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space size="middle">
          {record.status !== 'RETURNED' && (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleReturnBook(record.id)}
              style={{ 
                borderRadius: 6,
                backgroundColor: 'var(--success-color)',
                borderColor: 'var(--success-color)',
                color: '#ffffff'
              }}
            >
              Trả sách
            </Button>
          )}
          {record.extensionRequested && (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                onClick={() => handleApproveExtension(record.id)}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Duyệt gia hạn
              </Button>
              <Button
                type="primary"
                danger
                size="small"
                onClick={() => handleRejectExtension(record.id)}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Từ chối
              </Button>
            </Space>
          )}
        </Space>
      )
    }] : []),
    ...(!isAdminOrLibrarian ? [{
      title: 'Yêu cầu gia hạn',
      key: 'request_extension',
      width: 150,
      render: (_, record) => {
        if (record.status !== 'BORROWED') return '-';
        if (record.extensionRequested) {
          return <Tag color="warning">Chờ duyệt...</Tag>;
        }
        if (record.extensionCount >= 1) {
          return <Tag color="default">Đã gia hạn (1/1)</Tag>;
        }
        return (
          <Button
            type="primary"
            size="small"
            onClick={() => handleRequestExtension(record.id)}
            style={{ borderRadius: 6, fontSize: 12 }}
          >
            Xin gia hạn
          </Button>
        );
      }
    }] : []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ color: 'var(--text-title)', margin: 0 }}> {isAdminOrLibrarian ? 'Quản Lý Phiếu Mượn Trả Sách' : 'Lịch Sử Mượn Trả Sách'}</Title>
        </Col>
        {isAdminOrLibrarian && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal} size="large" style={{ borderRadius: 8 }}>
              Tạo Phiếu Mượn Mới
            </Button>
          </Col>
        )}
      </Row>

      {/* Bộ lọc (Chỉ hiển thị cho Admin/Librarian) */}
      {isAdminOrLibrarian && (
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
                placeholder="Lọc theo trạng thái phiếu"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ width: '100%', borderRadius: 8 }}
                allowClear
              >
                <Option value="BORROWED">Đang mượn (Borrowed)</Option>
                <Option value="RETURNED">Đã trả (Returned)</Option>
                <Option value="OVERDUE">Quá hạn (Overdue)</Option>
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
      )}

      <Table
        columns={columns}
        dataSource={records}
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

      {/* Modal Tạo Phiếu Mượn */}
      <Modal
        title="Tạo Phiếu Mượn Sách Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRecord}
          initialValues={{ borrowDays: 14 }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="userId"
            label="Chọn độc giả mượn"
            rules={[{ required: true, message: 'Vui lòng chọn độc giả!' }]}
          >
            <Select
              showSearch
              placeholder="Nhập tên hoặc email độc giả"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const label = Array.isArray(option.children)
                  ? option.children.join('')
                  : option.children || '';
                return label.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
              }}
              style={{ borderRadius: 6 }}
            >
              {readers.map(reader => (
                <Option key={reader.id} value={reader.id}>
                  {reader.fullName} ({reader.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="bookIds"
            label="Chọn sách mượn (Có thể chọn nhiều cuốn)"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một cuốn sách!' }]}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Chọn sách (Chỉ hiển thị sách còn trong kho)"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const label = Array.isArray(option.children)
                  ? option.children.join('')
                  : option.children || '';
                return label.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
              }}
              style={{ width: '100%', borderRadius: 6 }}
            >
              {booksList.map(book => (
                <Option key={book.id} value={book.id}>
                  {book.title} (Có sẵn: {book.availableQuantity} cuốn)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="borrowDays"
            label="Số ngày mượn tối đa"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={90} style={{ width: '100%', borderRadius: 6 }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)} style={{ borderRadius: 6 }}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitLoading} style={{ borderRadius: 6 }}>
                Tạo phiếu mượn
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BorrowRecords;
