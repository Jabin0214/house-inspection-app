import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
              },
            }}
          >
            <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {children}
            </div>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
