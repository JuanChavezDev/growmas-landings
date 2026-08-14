import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
  async rewrites() {
    return [
      { source: '/mas-pacientes', destination: '/mas-pacientes/index.html' },
    ]
  },
}

export default nextConfig
