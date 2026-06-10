import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Row, Col, Modal, Form, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import apiClient from '../services/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách thể loại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddClick = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditClick = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      message.success('Xóa thể loại thành công!');
      fetchCategories();
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa thất bại!');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingId) {
        await apiClient.put(`/categories/${editingId}`, values);
        message.success('Cập nhật thể loại thành công!');
      } else {
        await apiClient.post('/categories', values);
        message.success('Thêm thể loại mới thành công!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên thể loại',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 600, color: 'var(--text-title)' }}><FolderOutlined /> {text}</span>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined style={{ color: 'var(--primary-color)' }} />} onClick={() => handleEditClick(record)} />
          <Popconfirm
            title="Bạn chắc chắn muốn xóa thể loại này? Tất cả sách thuộc thể loại này cũng sẽ bị xóa!"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ color: 'var(--text-title)', margin: 0 }}>📂 Quản Lý Thể Loại Sách</Title>
          <Paragraph style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Phân loại sách giúp độc giả dễ dàng tìm kiếm và hệ thống khoa học hơn.
          </Paragraph>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large" style={{ borderRadius: 8 }}>
            Thêm Thể Loại Mới
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      <Modal
        title={editingId ? 'Cập Nhật Thể Loại' : 'Thêm Thể Loại Mới'}
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
            name="name"
            label="Tên thể loại"
            rules={[{ required: true, message: 'Vui lòng nhập tên thể loại!' }]}
          >
            <Input placeholder="Ví dụ: Công nghệ thông tin, Văn học..." style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả thể loại"
          >
            <TextArea rows={4} placeholder="Mô tả ngắn gọn về thể loại sách này..." style={{ borderRadius: 6 }} />
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

export default Categories;
