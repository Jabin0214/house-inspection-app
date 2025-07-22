/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/cssinjs', 'rc-util', 'rc-pagination', 'rc-picker'],
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig