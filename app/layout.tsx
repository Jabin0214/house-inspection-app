'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              },
              components: {
                Table: {
                  borderRadius: 4,
                  padding: 8,
                },
                Button: {
                  borderRadius: 4,
                },
              },
            }}
          >
            <App>
              {children}
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
