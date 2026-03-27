// Adaptive environment configuration.
// Falls back to verbose (local dev) settings when required Docker env vars are missing.

// Consider we're in Docker when DB_HOST is provided (DB_PORT may be omitted; default to 27017)
const hasDockerEnv = !!process.env.DB_HOST;

const dockerConfig = {
  environment: process.env.ENVIRONMENT || 'production',
  protocol: process.env.PROTOCOL || 'http',
  host: process.env.HOST || 'localhost',
  exposedPort: Number(process.env.EXPOSED_PORT) || 8080,
  port: Number(process.env.PORT) || 8080,
  mongo: {
    uri: `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT || 27017}/?authSource=admin`,
    options: {
      dbName: process.env.DB_NAME,
      // Only include credentials if both are provided
      ...(process.env.DB_ROOT_USERNAME && process.env.DB_ROOT_PASSWORD
        ? { user: process.env.DB_ROOT_USERNAME, pass: process.env.DB_ROOT_PASSWORD }
        : {}),
    }
  },
};

const verboseConfig = {
  environment: 'dev',
  protocol: 'http',
  host: 'localhost',
  exposedPort: Number(process.env.PORT) || 8081,
  port: Number(process.env.PORT) || 8081,
  mongo: {
    uri: 'mongodb://localhost:27017/?authSource=admin',
    options: {
      dbName: 'ami-fullstack-database',
    }
  },
};

export const config = hasDockerEnv ? dockerConfig : verboseConfig;


/**
 * Indicates whether process is in production mode
 *
 * @export
 * @returns {boolean}
 */
export function isProd(): boolean {
  return config.environment === 'production';
}

/**
 * Indicates whether process is in development mode
 *
 * @export
 * @returns {boolean}
 */
export function isDev(): boolean {
  return config.environment === 'development';
}

/**
 * Get full host domain
 * e.g. http://localhost:8080
 *
 * @export
 * @returns {string}
 */
export function getHostDomain(): string {
  return `${config.protocol}://${config.host}:${config.exposedPort}`;
}
