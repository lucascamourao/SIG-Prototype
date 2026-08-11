import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem a origem da rede local aqui, o dev server responde 403 sem Content-Type
  // as requisicoes de /_next/*, e os module scripts falham por MIME.
  allowedDevOrigins: ['192.168.0.4', '192.168.18.57', '192.168.18.99'],
};

export default nextConfig;
