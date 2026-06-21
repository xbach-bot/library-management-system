import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Space, message, Badge } from 'antd';
import {
  BookOutlined, UserOutlined, HistoryOutlined,
  WarningOutlined, TrophyOutlined, AreaChartOutlined
} from '@ant-design/icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import apiClient from '../services/api';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        message.error('Không thể tải dữ liệu thống kê Dashboard!');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cardStyle = {
    borderRadius: 16,
    border: '1px solid var(--border-color)',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
  };

  const topBooksColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 80,
      render: (_, __, index) => {
        let medal = index + 1;
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        return <span style={{ fontSize: 16 }}>{medal}</span>;
      }
    },
    {
      title: 'Tên sách',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 600, color: 'var(--text-title)' }}><BookOutlined /> {text}</span>
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Lượt mượn',
      dataIndex: 'borrowCount',
      key: 'borrowCount',
      width: 120,
      render: (count) => <Badge count={count} style={{ backgroundColor: 'var(--primary-color)' }} />
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: 'var(--text-title)', margin: 0 }}>Dashboard Thống Kê</Title>
      </div>

      {/* 4 Cards Số Liệu */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card hover-scale" style={cardStyle} loading={loading}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Tổng đầu sách</span>}
              value={stats?.totalBooks || 0}
              prefix={<BookOutlined style={{ color: 'var(--primary-color)', marginRight: 12, fontSize: 24 }} />}
              valueStyle={{ color: 'var(--text-title)', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card hover-scale" style={cardStyle} loading={loading}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Độc giả đăng ký</span>}
              value={stats?.totalReaders || 0}
              prefix={<UserOutlined style={{ color: 'var(--success-color)', marginRight: 12, fontSize: 24 }} />}
              valueStyle={{ color: 'var(--text-title)', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card hover-scale" style={cardStyle} loading={loading}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Sách đang được mượn</span>}
              value={stats?.borrowedBooks || 0}
              prefix={<HistoryOutlined style={{ color: 'var(--warning-color)', marginRight: 12, fontSize: 24 }} />}
              valueStyle={{ color: 'var(--text-title)', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card hover-scale" style={cardStyle} loading={loading}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Sách quá hạn trả</span>}
              value={stats?.overdueBooks || 0}
              prefix={<WarningOutlined style={{ color: 'var(--danger-color)', marginRight: 12, fontSize: 24 }} />}
              valueStyle={{ color: 'var(--text-title)', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Biểu đồ số lượt mượn */}
        <Col xs={24} lg={14}>
          <Card
            className="glass-card"
            style={cardStyle}
            title={<span style={{ color: 'var(--text-title)' }}><AreaChartOutlined /> Lượt mượn sách theo tháng</span>}
            loading={loading}
          >
            <div style={{ width: '100%', height: 320 }}>
              {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.monthlyStats}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--text-title)' }}
                      itemStyle={{ color: 'var(--primary-color)' }}
                    />
                    <Legend />
                    <Area type="monotone" name="Lượt mượn" dataKey="count" stroke="var(--primary-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  Không có dữ liệu thống kê tháng
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Top 10 sách mượn nhiều nhất */}
        <Col xs={24} lg={10}>
          <Card
            className="glass-card"
            style={cardStyle}
            title={<span style={{ color: 'var(--text-title)' }}><TrophyOutlined style={{ color: '#eab308' }} /> Top 10 sách mượn nhiều nhất</span>}
            loading={loading}
          >
            <Table
              columns={topBooksColumns}
              dataSource={stats?.topBooks || []}
              rowKey="bookId"
              pagination={false}
              size="small"
              style={{ overflow: 'hidden' }}
              locale={{ emptyText: 'Chưa có sách nào được mượn' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
