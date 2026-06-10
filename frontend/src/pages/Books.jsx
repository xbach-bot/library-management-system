import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Card, Button, Input, Select, Space, Row, Col, Modal, Form, 
  InputNumber, Upload, message, Popconfirm, Tag, Typography, Badge, Image 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, BookOutlined, UserOutlined, FileTextOutlined 
} from '@ant-design/icons';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Books = () => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN');

  // State quản lý danh sách sách và bộ lọc
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State cho Modal Form thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingBookId, setEditingBookId] = useState(null);
  const [coverBase64, setCoverBase64] = useState('');
  const [fileList, setFileList] = useState([]);

  // Lấy danh sách thể loại sách để điền vào Select dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách thể loại!');
    }
  }, []);

  // Lấy danh sách sách có tìm kiếm, lọc, phân trang
  const fetchBooks = useCallback(async (page = currentPage, size = pageSize, kw = keyword, catId = selectedCategory) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/books', {
        params: {
          page: page - 1, // Spring Boot sử dụng 0-indexed page
          size: size,
          keyword: kw || undefined,
          categoryId: catId || undefined,
          sortBy: 'id',
          sortDir: 'desc'
        }
      });
      setBooks(response.data.content);
      setTotal(response.data.totalElements);
    } catch (error) {
      message.error('Không thể tải danh sách sách!');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, keyword, selectedCategory]);

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, [fetchCategories, fetchBooks]);

  // Xử lý Tìm kiếm
  const handleSearch = () => {
    setCurrentPage(1);
    fetchBooks(1, pageSize, keyword, selectedCategory);
  };

  // Xử lý Reset bộ lọc
  const handleReset = () => {
    setKeyword('');
    setSelectedCategory(null);
    setCurrentPage(1);
    fetchBooks(1, pageSize, '', null);
  };

  // Thay đổi phân trang
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchBooks(pagination.current, pagination.pageSize, keyword, selectedCategory);
  };

  // Convert file ảnh sang Base64 string để lưu trực tiếp trong MySQL
  const handleCoverUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverBase64(e.target.result);
    };
    reader.readAsDataURL(file);
    return false; // Ngăn chặn upload tự động lên server
  };

  // Mở Modal để Thêm sách mới
  const handleAddClick = () => {
    setEditingBookId(null);
    setCoverBase64('');
    setFileList([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Mở Modal để Sửa sách
  const handleEditClick = (record) => {
    setEditingBookId(record.id);
    setCoverBase64(record.coverImage || '');
    setFileList(record.coverImage ? [{
      uid: '-1',
      name: 'cover_image.png',
      status: 'done',
      url: record.coverImage,
    }] : []);
    
    form.setFieldsValue({
      title: record.title,
      author: record.author,
      isbn: record.isbn,
      publisher: record.publisher,
      categoryId: record.categoryId,
      quantity: record.quantity,
      description: record.description,
    });
    setIsModalOpen(true);
  };

  // Xóa sách
  const handleDeleteBook = async (id) => {
    try {
      await apiClient.delete(`/books/${id}`);
      message.success('Xóa sách thành công!');
      fetchBooks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa sách thất bại!');
    }
  };

  // Gửi Form dữ liệu Thêm/Sửa lên Backend
  const handleFormSubmit = async (values) => {
    const bookPayload = {
      ...values,
      coverImage: coverBase64,
    };

    try {
      if (editingBookId) {
        await apiClient.put(`/books/${editingBookId}`, bookPayload);
        message.success('Cập nhật thông tin sách thành công!');
      } else {
        await apiClient.post('/books', bookPayload);
        message.success('Thêm sách mới thành công!');
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  // Định nghĩa cột hiển thị trong Bảng Sách (dành cho Admin/Librarian)
  const columns = [
    {
      title: 'Ảnh bìa',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 80,
      render: (text) => text ? (
        <Image src={text} alt="Cover" style={{ width: 45, height: 60, objectFit: 'cover', borderRadius: 4 }} />
      ) : (
        <div style={{ width: 45, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 4 }}>
          <BookOutlined style={{ fontSize: 20, color: 'var(--text-secondary)' }} />
        </div>
      )
    },
    {
      title: 'Tên sách',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (text, record) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{text}</span>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ISBN: {record.isbn}</div>
        </div>
      )
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Thể loại',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Nhà xuất bản',
      dataIndex: 'publisher',
      key: 'publisher',
    },
    {
      title: 'Tổng số',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Sẵn có',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      render: (qty) => {
        const color = qty > 0 ? 'green' : 'red';
        return <Badge count={qty} style={{ backgroundColor: color === 'green' ? 'var(--success-color)' : 'var(--danger-color)' }} />;
      }
    },
    ...(isAdminOrLibrarian ? [{
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined style={{ color: 'var(--primary-color)' }} />} onClick={() => handleEditClick(record)} />
          <Popconfirm
            title="Bạn chắc chắn muốn xóa cuốn sách này?"
            onConfirm={() => handleDeleteBook(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ color: 'var(--text-title)', margin: 0 }}>📚 Quản Lý Sách Thư Viện</Title>
          <Paragraph style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {isAdminOrLibrarian ? 'Thêm mới, cập nhật thông tin và quản lý sách trong thư viện.' : 'Tìm kiếm và khám phá kho sách đa dạng của thư viện.'}
          </Paragraph>
        </Col>
        {isAdminOrLibrarian && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large" style={{ borderRadius: 8 }}>
              Thêm Sách Mới
            </Button>
          </Col>
        )}
      </Row>

      {/* Thanh bộ lọc */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }} className="glass-card">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Tìm theo tên sách, tác giả, ISBN..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Lọc theo thể loại"
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%', borderRadius: 8 }}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
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

      {/* Hiển thị Sách: Nếu là Reader, hiển thị Grid cards, nếu là Admin/Librarian hiển thị Table */}
      {isAdminOrLibrarian ? (
        <Table
          columns={columns}
          dataSource={books}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
          }}
          onChange={handleTableChange}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      ) : (
        <div style={{ minHeight: 400 }}>
          <Row gutter={[16, 16]}>
            {books.map(book => (
              <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                <Card
                  hoverable
                  className="hover-scale glass-card"
                  cover={
                    book.coverImage ? (
                      <img alt={book.title} src={book.coverImage} style={{ height: 260, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                    ) : (
                      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '12px 12px 0 0' }}>
                        <BookOutlined style={{ fontSize: 60, color: 'var(--text-secondary)' }} />
                      </div>
                    )
                  }
                  style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 12 }}
                >
                  <div>
                    <Tag color="blue" style={{ marginBottom: 8 }}>{book.categoryName}</Tag>
                    <h3 style={{ margin: '4px 0', fontSize: 16, color: 'var(--text-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h3>
                    <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: 13 }}><UserOutlined /> {book.author}</p>
                    <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: 12 }}><FileTextOutlined /> NXB: {book.publisher}</p>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Còn lại: <Badge count={book.availableQuantity} style={{ backgroundColor: book.availableQuantity > 0 ? 'var(--success-color)' : 'var(--danger-color)' }} />
                    </span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Modal Thêm/Sửa Sách */}
      <Modal
        title={editingBookId ? 'Cập Nhật Thông Tin Sách' : 'Thêm Sách Mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tên sách"
                rules={[{ required: true, message: 'Vui lòng nhập tên sách!' }]}
              >
                <Input placeholder="Nhập tên sách" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="author"
                label="Tác giả"
                rules={[{ required: true, message: 'Vui lòng nhập tên tác giả!' }]}
              >
                <Input placeholder="Nhập tên tác giả" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isbn"
                label="Mã ISBN"
                rules={[{ required: true, message: 'Vui lòng nhập mã ISBN!' }]}
              >
                <Input placeholder="Nhập mã ISBN" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="publisher"
                label="Nhà xuất bản"
                rules={[{ required: true, message: 'Vui lòng nhập nhà xuất bản!' }]}
              >
                <Input placeholder="Nhập nhà xuất bản" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Thể loại"
                rules={[{ required: true, message: 'Vui lòng chọn thể loại!' }]}
              >
                <Select placeholder="Chọn thể loại" style={{ borderRadius: 6 }}>
                  {categories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Số lượng sách"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng!' },
                  { type: 'number', min: 0, message: 'Số lượng phải lớn hơn hoặc bằng 0!' }
                ]}
              >
                <InputNumber style={{ width: '100%', borderRadius: 6 }} placeholder="Nhập số lượng" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả sách"
          >
            <TextArea rows={3} placeholder="Mô tả ngắn gọn về nội dung sách..." style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            label="Ảnh bìa sách"
          >
            <Upload
              listType="picture"
              maxCount={1}
              fileList={fileList}
              beforeUpload={handleCoverUpload}
              onRemove={() => {
                setCoverBase64('');
                setFileList([]);
              }}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />} style={{ borderRadius: 6 }}>Chọn ảnh tải lên</Button>
            </Upload>
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
    </div>
  );
};

export default Books;
