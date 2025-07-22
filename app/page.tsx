'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, message, Tag, Space, Typography, Input, Modal, DatePicker, Select, Dropdown, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, MoreOutlined, DeleteOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import Link from 'next/link';
import type { InspectionTask } from '../lib/models/InspectionTask';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function HomePage() {
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState('');
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [editingTaskId, setEditingTaskId] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
      } else {
        message.error('加载数据失败: ' + result.error);
      }
    } catch (error) {
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadTasks();
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAddressOptions(data.data);
      });
  }, []);

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

    const scheduledTime = task.scheduled_at
      ? new Date(task.scheduled_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      : '待定';

    const emailBody = `
尊敬的业主：

您好！

我们计划对以下房屋进行检查：

地址：${task.address}
检查类型：${getInspectionTypeText(task.inspection_type)}
计划时间：${scheduledTime}
${task.notes ? `\n备注：${task.notes}` : ''}

如果您对检查时间有任何问题，请及时与我们联系。

谢谢！

ST International Ltd
    `.trim();

    const mailtoLink = `mailto:${task.email}?subject=${encodeURIComponent(`房屋检查通知 - ${task.address}`)}&body=${encodeURIComponent(emailBody)}`;

    // 打开邮件客户端
    window.location.href = mailtoLink;

    // 更新状态为已发邮件
    try {
      await updateTask(task.id, 'status', '已发邮件');
      message.success('邮件窗口已打开，请在邮件客户端中发送邮件');
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleDirectSend = async (task: InspectionTask) => {
    if (!task.email) {
      message.error('请先设置收件人邮箱');
      return;
    }

    try {
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
        // 自动更新状态为"已发邮件"
        await updateTask(task.id, 'status', '已发邮件');
      } else {
        message.error(result.error || '邮件发送失败');
      }
    } catch (error) {
      message.error('邮件发送失败');
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
            icon={<MailOutlined />}
            onClick={() => handleSendEmail(record)}
            style={{ fontSize: '12px', width: '100%', textAlign: 'left' }}
            disabled={!record.email}
          >
            {record.email ? '用邮件客户端发送' : '请先设置邮箱'}
          </Button>
        )
      },
      {
        key: 'direct-send',
        label: (
          <Button
            type="text"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleDirectSend(record)}
            style={{ fontSize: '12px', width: '100%', textAlign: 'left' }}
            disabled={!record.email}
          >
            直接发送邮件
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

  const getInspectionTypeText = (type: string) => {
    const typeMap = {
      'routine': '常规检查',
      'move-in': '入住检查',
      'move-out': '退房检查'
    };
    return typeMap[type as keyof typeof typeMap] || type;
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
      render: (address: string, record: InspectionTask) => (
        <EditableCell
          record={record}
          field="address"
          type="text"
        >
          <span style={{ fontSize: '12px' }}>{address}</span>
        </EditableCell>
      ),
    },
    {
      title: '计划时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: '18%',
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
      render: (type: string, record: InspectionTask) => (
        <EditableCell
          record={record}
          field="inspection_type"
          type="select"
        >
          <span style={{ fontSize: '12px', cursor: 'pointer' }}>{getInspectionTypeText(type)}</span>
        </EditableCell>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: '14%',
      render: (phone: string, record: InspectionTask) => (
        <EditableCell
          record={record}
          field="phone"
        >
          <span style={{ fontSize: '12px', color: phone ? 'inherit' : '#999' }}>
            {phone || '点击填写'}
          </span>
        </EditableCell>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: '16%',
      render: (email: string, record: InspectionTask) => (
        <EditableCell
          record={record}
          field="email"
        >
          <span style={{ fontSize: '12px', color: email ? 'inherit' : '#999' }}>
            {email || '点击填写'}
          </span>
        </EditableCell>
      ),
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

  // 按状态分组顺序
  const statusOrder = [
    '需约时间',
    '已发邮件',
    '等待检查',
    '完成'
  ];

  // 首页显示的状态（不包括已完成的任务）
  const activeStatusOrder = [
    '需约时间',
    '已发邮件',
    '等待检查'
  ];

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
    <div style={{ padding: '12px' }}>
      <div style={{
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ margin: 0, fontSize: '18px' }}>房屋检查安排</Title>
        <Space size="small">
          <Link href="/add">
            <Button type="primary" size="small" icon={<PlusOutlined />}>添加新安排</Button>
          </Link>
          <Link href="/history">
            <Button size="small">历史记录</Button>
          </Link>
        </Space>
      </div>

      {groupedTasks.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', color: '#999', marginTop: 24, fontSize: '13px' }}>
          暂无数据，请点击"添加新安排"开始使用
        </div>
      ) : (
        groupedTasks.map(group => (
          <div key={group.status} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 8,
              color: '#666'
            }}>
              {group.status}
            </div>
            <Table
              columns={columns}
              dataSource={group.tasks}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: (record: InspectionTask) => (
                  <div style={{
                    padding: '0 12px',
                    position: 'relative',
                    marginTop: '-6px',
                    marginBottom: '-6px'
                  }}>
                    <div style={{
                      marginRight: '24px',
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
                          marginLeft: '8px',
                          color: '#999'
                        }}
                      />
                    </div>
                  </div>
                ),
                expandIcon: () => null,
                defaultExpandAllRows: true
              }}
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

