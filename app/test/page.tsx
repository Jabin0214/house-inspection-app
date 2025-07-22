'use client';

import React, { useState } from 'react';
import { Button, Card, Typography, Space, Divider, Alert } from 'antd';
import { PlayCircleOutlined, DatabaseOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function TestPage() {
    const [testResult, setTestResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sampleLoading, setSampleLoading] = useState(false);
    const [sampleResult, setSampleResult] = useState<any>(null);

    const runTest = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/test-connection');
            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({ connected: false, error: { message: '网络请求失败' } });
        } finally {
            setLoading(false);
        }
    };

    const createSamples = async () => {
        setSampleLoading(true);
        try {
            const response = await fetch('/api/test-connection', {
                method: 'POST'
            });
            const result = await response.json();
            setSampleResult(result);

            if (result.success) {
                setTimeout(() => {
                    runTest();
                }, 1000);
            }
        } catch (error) {
            setSampleResult({ success: false, error: { message: '网络请求失败' } });
        } finally {
            setSampleLoading(false);
        }
    };

    const renderResult = () => {
        if (!testResult) return null;

        return (
            <Card title="测试结果" style={{ marginTop: 20 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Text strong>连接状态：</Text>
                        {testResult.connected ? (
                            <Text type="success">✅ 已连接</Text>
                        ) : (
                            <Text type="danger">❌ 连接失败</Text>
                        )}
                    </div>

                    <div>
                        <Text strong>数据集合状态：</Text>
                        {testResult.collectionExists ? (
                            <Text type="success">✅ 集合存在</Text>
                        ) : (
                            <Text type="warning">⚠️ 集合不存在或无数据</Text>
                        )}
                    </div>

                    {testResult.documentCount !== undefined && (
                        <div>
                            <Text strong>文档数量：</Text>
                            <Text>{testResult.documentCount} 条记录</Text>
                        </div>
                    )}

                    {testResult.error && (
                        <Alert
                            message="错误详情"
                            description={
                                <pre style={{ whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(testResult.error, null, 2)}
                                </pre>
                            }
                            type="error"
                            showIcon
                        />
                    )}
                </Space>
            </Card>
        );
    };

    const renderSampleResult = () => {
        if (!sampleResult) return null;

        return (
            <Card title="示例数据创建结果" style={{ marginTop: 20 }}>
                {sampleResult.success ? (
                    <Alert
                        message="成功"
                        description={sampleResult.message}
                        type="success"
                        showIcon
                    />
                ) : (
                    <Alert
                        message="失败"
                        description={
                            <pre style={{ whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(sampleResult.error, null, 2)}
                            </pre>
                        }
                        type="error"
                        showIcon
                    />
                )}
            </Card>
        );
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2}>
                <DatabaseOutlined /> MongoDB 连接测试
            </Title>

            <Card>
                <Paragraph>
                    数据库连接测试和示例数据创建工具。如果首页显示为空，请使用此工具创建示例数据。
                </Paragraph>

                <Space>
                    <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        loading={loading}
                        onClick={runTest}
                        size="large"
                    >
                        运行连接测试
                    </Button>

                    <Button
                        type="default"
                        icon={<PlusOutlined />}
                        loading={sampleLoading}
                        onClick={createSamples}
                        size="large"
                    >
                        创建示例数据
                    </Button>
                </Space>

                {renderResult()}
                {renderSampleResult()}

                <Divider />

                <Title level={4}>使用说明：</Title>
                <ol>
                    <li><strong>运行连接测试</strong>：检查MongoDB连接状态和数据库中的文档数量</li>
                    <li><strong>创建示例数据</strong>：如果数据库为空，点击此按钮添加3条示例检查任务</li>
                    <li>创建示例数据后，返回首页即可看到数据</li>
                </ol>

                <Alert
                    message="数据库配置信息"
                    description={
                        <div>
                            <p><strong>当前配置：</strong></p>
                            <ul>
                                <li>数据库：MongoDB Atlas</li>
                                <li>集合：inspection_tasks</li>
                                <li>连接状态：从服务器端日志查看</li>
                            </ul>

                            <p><strong>故障排除：</strong></p>
                            <ul>
                                <li>如果连接失败，检查网络和MongoDB Atlas配置</li>
                                <li>确保IP地址已加入MongoDB Atlas白名单</li>
                                <li>检查环境变量配置是否正确</li>
                            </ul>
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 20 }}
                />
            </Card>
        </div>
    );
} 