// Adaptive environment configuration for Postgres (Railway or local)
// Automatically detects Railway deployment vs local development

const isRailway = !!process.env.DATABASE_URL;
const isDev = process.env.NODE_ENV !== 'production';

const railwayConfig = {
  environment: process.env.NODE_ENV || 'production',
  protocol: process.env.PROTOCOL || 'https',
  host: process.env.RAILWAY_SERVICE_DOMAIN || process.env.HOST || 'localhost',
  exposedPort: Number(process.env.PORT) || 8080,
  port: Number(process.env.PORT) || 8080,
  database: {
    url: process.env.DATABASE_URL || '',
  },
};

const localConfig = {
  environment: 'development',
  protocol: 'http',
  host: 'localhost',
  exposedPort: 8081,
  port: 8081,
  database: {
    url: 'postgresql://postgres:postgres@localhost:5432/ami_dev',
  },
};

export const config = isRailway ? railwayConfig : localConfig;

/**
 * Indicates whether process is in production mode
 */
export function isProd(): boolean {
  return config.environment === 'production';
}

/**
 * Get the full domain/URL for the service
 */
export function getHostDomain(): string {
  return `${config.protocol}://${config.host}${config.exposedPort !== 80 && config.exposedPort !== 443 ? `:${config.exposedPort}` : ''}`;
}
