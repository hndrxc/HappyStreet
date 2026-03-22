/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['100.106.232.95'],
  reactCompiler: true,
  turbopack: {
    root: import.meta.dirname,
  },
};
export default nextConfig;
