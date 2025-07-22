'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, message, Tag, Space, Typography, Input, Modal, DatePicker, Select, Dropdown, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, MoreOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import type { Breakpoint } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import Link from 'next/link';
import type { InspectionTask } from '../lib/models/InspectionTask';
import { getInspectionTypeDisplayText } from '../lib/emailUtils';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 将状态常量移到组件外部
const STATUS_ORDER = [
  '需约时间',
  '已发邮件',
  '等待检查',
  '完成'
] as const;

const ACTIVE_STATUS_ORDER = [
  '需约时间',
  '已发邮件',
  '等待检查'
] as const;

export default function HomePage() {
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState('');
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [editingTaskId, setEditingTaskId] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
      } else {
        message.error('加载数据失败: ' + result.error);
      }
    } catch (error) {
      console.error('加载任务列表失败:', error);
      message.error(error instanceof Error ? `加载失败: ${error.message}` : '网络请求失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAddressOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      if (data.success) {
        setAddressOptions(data.data);
      }
    } catch (error) {
      console.error('加载地址选项失败:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadAddressOptions();
  }, [loadTasks, loadAddressOptions]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        message.success('删除成功');
        loadTasks();
      } else {
        message.error('删除失败: ' + result.error);
      }
    } catch (err) {
      message.error('网络错误');
    }
  };

  const handleNotesEdit = (task: InspectionTask) => {
    setCurrentNotes(task.notes || '');
    setEditingTaskId(task.id);
    setIsNotesModalVisible(true);
  };

  const handleNotesSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${editingTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: currentNotes })
      });

      const result = await response.json();
      if (result.success) {
        message.success('备注已更新');
        setTasks(prev => prev.map(t =>
          t.id === editingTaskId ? { ...t, notes: currentNotes } : t
        ));
      } else {
        message.error('更新失败: ' + result.error);
      }
    } catch (error) {
      message.error('保存失败');
    }
    setIsNotesModalVisible(false);
  };

  const updateTask = async (id: string, field: string, value: any) => {
    try {
      const oldTask = tasks.find(t => t.id === id);
      if (!oldTask || oldTask[field as keyof InspectionTask] === value) {
        setEditingCell('');
        return;
      }
      const updateData = { [field]: value };
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      const result = await response.json();
      if (result.success) {
        message.success('更新成功');
        setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
      } else {
        message.error('更新失败: ' + result.error);
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setEditingCell('');
    }
  };

  const handleSendEmail = async (task: InspectionTask) => {
    if (!task.email) {
      message.error('请先设置收件人邮箱');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/tasks/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: task.id })
      });

      const result = await response.json();

      if (result.success) {
        message.success('邮件发送成功');
        await updateTask(task.id, 'status', '已发邮件');
      } else {
        throw new Error(result.error || '邮件发送失败');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '邮件发送失败');
      console.error('邮件发送失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionItems = (record: InspectionTask) => {
    return [
      {
        key: 'email',
        label: (
          <Button
            type="text"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleSendEmail(record)}
            style={{ fontSize: '12px', width: '100%', textAlign: 'left' }}
            disabled={!record.email}
          >
            {record.email ? '发送邮件' : '请先设置邮箱'}
          </Button>
        )
      },
      {
        key: 'delete',
        label: (
          <Popconfirm
            title="确定删除该记录？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ fontSize: '12px', width: '100%', textAlign: 'left' }}
            >
              删除记录
            </Button>
          </Popconfirm>
        )
      }
    ];
  };

  const getStatusColor = (status: InspectionTask['status']) => {
    const colors = {
      '需约时间': 'default',
      '已发邮件': 'blue',
      '等待检查': 'orange',
      '完成': 'green'
    };
    return colors[status] || 'default';
  };

  const inspectionTypes = [
    { value: 'routine', label: '常规检查' },
    { value: 'move-in', label: '入住检查' },
    { value: 'move-out', label: '退房检查' }
  ];

  const EditableCell = ({
    record,
    field,
    children,
    type = 'text',
    options = []
  }: {
    record: InspectionTask;
    field: string;
    children: React.ReactNode;
    type?: 'text' | 'select' | 'datetime';
    options?: Array<{ value: any; label: string }>;
  }) => {
    const cellKey = `${record.id}-${field}`;
    const isEditing = editingCell === cellKey;
    const [value, setValue] = useState<any>(record[field as keyof InspectionTask] || '');

    if (field === 'address') {
      return <span>{children}</span>;
    }

    const handleSave = () => {
      if (field === 'email' && value && !/^\S+@\S+\.\S+$/.test(value as string)) {
        message.error('请输入有效的邮箱地址');
        return;
      }

      let saveValue = value;
      if (field === 'scheduled_at' && value) {
        saveValue = (value as any).toISOString();
      }

      updateTask(record.id, field, saveValue);
      setEditingCell('');
    };

    const handleClick = () => {
      if (!isEditing) {
        setEditingCell(cellKey);
        setValue(record[field as keyof InspectionTask] || '');
      }
    };

    if (isEditing) {
      if (type === 'datetime') {
        return (
          <DatePicker
            showTime
            size="small"
            style={{ width: '100%' }}
            value={value ? dayjs(value as string) : null}
            format="MM-DD HH:mm"
            placeholder="选择时间"
            allowClear
            onChange={(date: Dayjs | null) => {
              if (date) {
                const isoString = date.toISOString();
                if (isoString !== record.scheduled_at) {
                  setValue(date);
                  updateTask(record.id, field, isoString);
                } else {
                  setEditingCell('');
                }
              } else {
                setValue(null);
                updateTask(record.id, field, null);
              }
            }}
            onOpenChange={(open: boolean) => {
              if (!open) setEditingCell('');
            }}
            autoFocus
          />
        );
      } else if (field === 'status') {
        return (
          <Select
            size="small"
            value={value}
            style={{ width: '100%' }}
            onChange={(val) => {
              if (val !== record[field as keyof InspectionTask]) {
                setValue(val);
                updateTask(record.id, field, val);
                if (val === '完成') {
                  message.success('任务已完成，可在历史记录中查看');
                  loadTasks(); // 重新加载列表以移除已完成的任务
                }
              } else {
                setEditingCell('');
              }
            }}
            onBlur={() => setEditingCell('')}
            autoFocus
          >
            {statusOrder.map(status => (
              <Option key={status} value={status}>{status}</Option>
            ))}
          </Select>
        );
      } else if (field === 'inspection_type') {
        return (
          <Select
            size="small"
            value={value}
            style={{ width: '100%' }}
            onChange={(val) => {
              if (val !== record[field as keyof InspectionTask]) {
                setValue(val);
                updateTask(record.id, field, val);
              } else {
                setEditingCell('');
              }
            }}
            onBlur={() => setEditingCell('')}
            autoFocus
          >
            {inspectionTypes.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        );
      } else {
        return (
          <Input
            size="small"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPressEnter={() => {
              if (value !== record[field as keyof InspectionTask]) {
                handleSave();
              } else {
                setEditingCell('');
              }
            }}
            onBlur={() => {
              if (value !== record[field as keyof InspectionTask]) {
                handleSave();
              } else {
                setEditingCell('');
              }
            }}
            autoFocus
            style={{ width: '100%' }}
          />
        );
      }
    }

    return (
      <div
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          padding: '2px 4px',
          margin: '-2px -4px',
          borderRadius: '2px',
          transition: 'background-color 0.2s',
          fontSize: '12px'
        }}
        onMouseEnter={(e) => {
          if (!isEditing) {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isEditing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {children}
      </div>
    );
  };

  const columns = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: '28%',
      render: (address: string, record: InspectionTask) => {
        const isMobile = window.innerWidth < 768;
        return (
          <EditableCell
            record={record}
            field="address"
            type="text"
          >
            {isMobile ? (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{address}</div>
                <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span>{getInspectionTypeDisplayText(record.inspection_type)}</span>
                  {record.scheduled_at && (
                    <span>{dayjs(record.scheduled_at).format('MM-DD HH:mm')}</span>
                  )}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '12px' }}>{address}</span>
            )}
          </EditableCell>
        );
      },
    },
    {
      title: '计划时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: '18%',
      responsive: ['md'],
      render: (date: string, record: InspectionTask) => (
        <EditableCell
          record={record}
          field="scheduled_at"
          type="datetime"
        >
          <span style={{ fontSize: '12px', color: date ? 'inherit' : '#999', cursor: 'pointer' }}>
            {date ? dayjs(date).format('MM-DD HH:mm') : '点击设置'}
          </span>
        </EditableCell>
      ),
    },
    {
      title: '检查类型',
      dataIndex: 'inspection_type',
      key: 'inspection_type',
      width: '14%',
      responsive: ['md'],
      render: (type: string, record: InspectionTask) => (
        <EditableCell
          record={record}
          field="inspection_type"
          type="select"
        >
          <span style={{ fontSize: '12px', cursor: 'pointer' }}>{getInspectionTypeDisplayText(type)}</span>
        </EditableCell>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      width: '30%',
      render: (_: any, record: InspectionTask) => {
        const isMobile = window.innerWidth < 768;
        return (
          <div style={{
            fontSize: '12px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '8px'
          }}>
            <EditableCell record={record} field="phone">
              <span style={{ color: record.phone ? 'inherit' : '#999' }}>
                {record.phone || '添加电话'}
              </span>
            </EditableCell>
            {!isMobile && <span style={{ color: '#ddd' }}>|</span>}
            <EditableCell record={record} field="email">
              <span style={{ color: record.email ? 'inherit' : '#999' }}>
                {record.email || '添加邮箱'}
              </span>
            </EditableCell>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status: InspectionTask['status'], record: InspectionTask) => (
        <EditableCell
          record={record}
          field="status"
          type="select"
        >
          <Tag color={getStatusColor(status)} style={{ fontSize: '11px', lineHeight: '16px', cursor: 'pointer' }}>{status}</Tag>
        </EditableCell>
      ),
    },
    {
      title: '',
      key: 'action',
      width: '8%',
      render: (_: any, record: InspectionTask) => (
        <Dropdown
          menu={{ items: getActionItems(record) }}
          placement="bottomRight"
          trigger={['click']}
          arrow={{ pointAtCenter: true }}
        >
          <Button
            size="small"
            icon={<MoreOutlined />}
            style={{ border: 'none', padding: '4px 8px' }}
          />
        </Dropdown>
      ),
    }
  ];

  // 使用外部常量替换内部定义
  const statusOrder = STATUS_ORDER;
  const activeStatusOrder = ACTIVE_STATUS_ORDER;

  // 按状态分组并组内排序
  const groupedTasks = activeStatusOrder.map(status => ({
    status,
    tasks: tasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        if (!a.scheduled_at && !b.scheduled_at) return 0;
        if (!a.scheduled_at) return 1;
        if (!b.scheduled_at) return -1;
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      })
  })).filter(group => group.tasks.length > 0);

  return (
    <div style={{
      padding: '8px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <Title level={3} style={{
          margin: 0,
          fontSize: '16px'
        }}>房屋检查安排</Title>
        <Space size="small" wrap>
          <Link href="/add">
            <Button type="primary" size="small" icon={<PlusOutlined />}>添加新安排</Button>
          </Link>
          <Link href="/history">
            <Button size="small">历史记录</Button>
          </Link>
        </Space>
      </div>

      {groupedTasks.length === 0 && !loading ? (
        <div style={{
          textAlign: 'center',
          color: '#999',
          marginTop: 16,
          fontSize: '13px',
          padding: '24px 16px'
        }}>
          暂无数据，请点击"添加新安排"开始使用
        </div>
      ) : (
        groupedTasks.map(group => (
          <div key={group.status} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: 4,
              color: '#666',
              padding: '0 4px'
            }}>
              {group.status}
            </div>
            <Table
              columns={columns.map(col => ({
                ...col,
                responsive: col.responsive as Breakpoint[]
              }))}
              dataSource={group.tasks}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: (record: InspectionTask) => (
                  <div style={{
                    padding: '4px 8px',
                    position: 'relative',
                    marginTop: '-4px',
                    marginBottom: '-4px'
                  }}>
                    <div style={{
                      marginRight: '16px',
                      fontSize: '11px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      lineHeight: '1.2',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'baseline'
                    }}>
                      <span style={{
                        color: '#999',
                        fontSize: '10px',
                        marginRight: '4px',
                        flexShrink: 0
                      }}>备注:</span>
                      <span style={{
                        color: record.notes ? '#666' : '#999',
                        flex: 1
                      }}>
                        {record.notes || '暂无备注'}
                      </span>
                      <Button
                        size="small"
                        icon={<EditOutlined style={{ fontSize: '11px' }} />}
                        onClick={() => handleNotesEdit(record)}
                        style={{
                          border: 'none',
                          padding: 0,
                          height: 'auto',
                          minWidth: '20px',
                          marginLeft: '4px',
                          color: '#999'
                        }}
                      />
                    </div>
                  </div>
                ),
                expandIcon: () => null,
                defaultExpandAllRows: true
              }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        ))
      )}

      <Modal
        title="编辑备注"
        open={isNotesModalVisible}
        onOk={handleNotesSave}
        onCancel={() => setIsNotesModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <TextArea
          value={currentNotes}
          onChange={e => setCurrentNotes(e.target.value)}
          placeholder="请输入备注信息"
          rows={4}
        />
      </Modal>
    </div>
  );
}

