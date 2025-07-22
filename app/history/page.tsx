'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, message, Space, Typography, DatePicker, Select, Popconfirm } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import Link from 'next/link';
import type { InspectionTask } from '../../lib/models/InspectionTask';
import { Breakpoint } from 'antd/lib';
import { getInspectionTypeDisplayText } from '../../lib/emailUtils';

const { Title } = Typography;
const { Option } = Select;

export default function HistoryPage() {
    const [tasks, setTasks] = useState<InspectionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState('');

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tasks/completed');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            if (result.success) {
                setTasks(result.data);
            } else {
                throw new Error(result.error || '加载数据失败');
            }
        } catch (error) {
            console.error('加载历史记录失败:', error);
            message.error(error instanceof Error ? error.message : '加载数据失败');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const result = await res.json();
            if (result.success) {
                message.success('删除成功');
                setTasks(prev => prev.filter(task => task.id !== id));
            } else {
                throw new Error(result.error || '删除失败');
            }
        } catch (error) {
            console.error('删除记录失败:', error);
            message.error(error instanceof Error ? error.message : '删除失败');
        }
    };

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                message.success('更新成功');
                if (field === 'status' && value !== '完成') {
                    // 如果状态改为非完成，则从历史记录中移除
                    setTasks(prev => prev.filter(task => task.id !== id));
                } else {
                    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
                }
            } else {
                throw new Error(result.error || '更新失败');
            }
        } catch (error) {
            console.error('更新记录失败:', error);
            message.error(error instanceof Error ? error.message : '更新失败');
        } finally {
            setEditingCell('');
        }
    };

    const inspectionTypes = [
        { value: 'routine', label: '常规检查' },
        { value: 'move-in', label: '入住检查' },
        { value: 'move-out', label: '退房检查' }
    ];

    const statusOptions = [
        { value: '需约时间', label: '需约时间' },
        { value: '已发邮件', label: '已发邮件' },
        { value: '等待检查', label: '等待检查' },
        { value: '完成', label: '完成' }
    ];

    const EditableCell = ({
        record,
        field,
        children,
        type = 'text'
    }: {
        record: InspectionTask;
        field: string;
        children: React.ReactNode;
        type?: 'text' | 'select' | 'datetime';
    }) => {
        const cellKey = `${record.id}-${field}`;
        const isEditing = editingCell === cellKey;
        const [value, setValue] = useState<any>(record[field as keyof InspectionTask] || '');

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
                        format="YYYY-MM-DD HH:mm"
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
            } else if (type === 'select') {
                const options = field === 'inspection_type' ? inspectionTypes : statusOptions;
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
                        {options.map(opt => (
                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                        ))}
                    </Select>
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
            width: '35%',
            responsive: ['md'],
            render: (address: string) => (
                <span style={{ fontSize: '12px' }}>{address}</span>
            ),
        },
        {
            title: '地址',
            dataIndex: 'address',
            key: 'address-mobile',
            responsive: ['xs', 'sm'],
            render: (address: string, record: InspectionTask) => (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                        {address}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span>{getInspectionTypeDisplayText(record.inspection_type)}</span>
                        <span>{record.status}</span>
                    </div>
                </div>
            ),
        },
        {
            title: '检查类型',
            dataIndex: 'inspection_type',
            key: 'inspection_type',
            width: '15%',
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
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: '15%',
            responsive: ['md'],
            render: (status: string, record: InspectionTask) => (
                <EditableCell
                    record={record}
                    field="status"
                    type="select"
                >
                    <span style={{ fontSize: '12px', cursor: 'pointer' }}>{status}</span>
                </EditableCell>
            ),
        },
        {
            title: '完成时间',
            dataIndex: 'scheduled_at',
            key: 'scheduled_at',
            width: '25%',
            responsive: ['md'],
            render: (date: string, record: InspectionTask) => (
                <EditableCell
                    record={record}
                    field="scheduled_at"
                    type="datetime"
                >
                    <span style={{ fontSize: '12px', cursor: 'pointer' }}>
                        {date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'}
                    </span>
                </EditableCell>
            ),
        },
        {
            title: '',
            key: 'action',
            width: '10%',
            render: (_: any, record: InspectionTask) => (
                <Space>
                    <Popconfirm
                        title="确定删除该记录？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="是"
                        cancelText="否"
                    >
                        <Button danger size="small" style={{ fontSize: '11px', padding: '0 4px', height: '20px' }}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    return (
        <div style={{
            padding: '12px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%'
        }}>
            <div style={{
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                <Link href="/">
                    <Button icon={<ArrowLeftOutlined />} size="small">返回</Button>
                </Link>
                <Title level={3} style={{
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: 1.4
                }}>历史记录</Title>
            </div>

            <Table
                columns={columns.map(col => ({
                    ...col,
                    responsive: col.responsive as Breakpoint[]
                }))}
                dataSource={tasks}
                loading={loading}
                rowKey="id"
                pagination={{
                    defaultPageSize: 50,
                    size: 'small',
                    showTotal: (total) => `共 ${total} 条记录`,
                    responsive: true
                }}
                size="small"
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
} 