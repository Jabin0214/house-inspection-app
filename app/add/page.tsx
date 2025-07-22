'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, message, Space, Typography, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import type { InspectionTaskInsert } from '../../lib/models/InspectionTask';

const { Title } = Typography;
const { Option } = Select;

export default function AddPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressOptions, setAddressOptions] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        // 获取所有property地址
        const loadAddresses = async () => {
            try {
                setAddressLoading(true);
                const response = await fetch('/api/properties');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.success) {
                    const addresses = data.data.map((addr: string) => addr);
                    setAddressOptions(addresses);
                } else {
                    throw new Error(data.error || '加载地址列表失败');
                }
            } catch (error) {
                console.error('加载地址列表失败:', error);
                message.error(error instanceof Error ? error.message : '加载地址列表失败');
            } finally {
                setAddressLoading(false);
            }
        };

        loadAddresses();
    }, []);

    const validateEmail = (_: any, value: string) => {
        if (!value) {
            return Promise.resolve();
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
            return Promise.reject('请输入有效的邮箱地址');
        }
        return Promise.resolve();
    };

    const validatePhone = (_: any, value: string) => {
        if (!value) {
            return Promise.resolve();
        }
        // 支持国内手机号和座机号
        const phoneRegex = /^((\+86|0086)?\s?)?(1[3-9]\d{9}|(\d{3,4}-)?\d{7,8})$/;
        if (!phoneRegex.test(value)) {
            return Promise.reject('请输入有效的电话号码');
        }
        return Promise.resolve();
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const task: InspectionTaskInsert = {
                address: values.address,
                inspection_type: values.inspection_type,
                phone: values.phone || '',
                email: values.email || '',
                scheduled_at: values.scheduled_at ? values.scheduled_at.toISOString() : undefined,
                status: '需约时间',
                notes: ''
            };

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task)
            });

            const result = await response.json();

            if (result.success) {
                message.success('安排添加成功');
                router.push('/');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            message.error('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.back()}
                    >
                        返回
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>添加新的检查安排</Title>
                </Space>
            </div>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        status: '需约时间',
                    }}
                >
                    <Form.Item
                        label="物业地址"
                        name="address"
                        rules={[{ required: true, message: '请选择物业地址' }]}
                    >
                        <Select
                            showSearch
                            placeholder={addressLoading ? "加载中..." : "请选择物业地址"}
                            optionFilterProp="children"
                            filterOption={(input, option) => {
                                if (!option?.value) return false;
                                return option.value.toString().toLowerCase().includes(input.toLowerCase());
                            }}
                            disabled={addressLoading || addressOptions.length === 0}
                            allowClear
                            loading={addressLoading}
                        >
                            {addressOptions.map(addr => (
                                <Option key={addr} value={addr}>{addr}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="检查类型"
                        name="inspection_type"
                        rules={[{ required: true, message: '请选择检查类型' }]}
                    >
                        <Select placeholder="请选择检查类型">
                            <Option value="routine">常规检查</Option>
                            <Option value="move-in">入住检查</Option>
                            <Option value="move-out">退房检查</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="计划检查时间"
                        name="scheduled_at"
                        help="可以留空，表示需约时间"
                    >
                        <DatePicker
                            showTime
                            style={{ width: '100%' }}
                            placeholder="选择检查时间（可选）"
                            format="YYYY-MM-DD HH:mm"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Divider orientation="left">联系方式（可选）</Divider>

                    <Form.Item
                        label="联系电话"
                        name="phone"
                        rules={[{ validator: validatePhone }]}
                        help="支持手机号和座机号"
                    >
                        <Input placeholder="请输入联系电话（可选）" />
                    </Form.Item>

                    <Form.Item
                        label="邮箱地址"
                        name="email"
                        rules={[{ validator: validateEmail }]}
                        help="用于发送检查通知"
                    >
                        <Input placeholder="请输入邮箱地址（可选）" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '32px' }}>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SaveOutlined />}
                                size="large"
                                disabled={addressLoading || addressOptions.length === 0}
                            >
                                保存安排
                            </Button>
                            <Button
                                onClick={() => form.resetFields()}
                                size="large"
                            >
                                重置表单
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
} 