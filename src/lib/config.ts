/**
 * Environment Configuration
 * Centralized configuration for different environments
 */

export interface AppConfig {
  api: {
    baseUrl: string;
    cors: {
      allowedOrigins: (string | RegExp)[];
      allowedMethods: string[];
      allowedHeaders: string[];
    };
  };
  environment: 'development' | 'staging' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
}

// Environment detection
const environment = (process.env.NODE_ENV || 'development') as AppConfig['environment'];

// Configuration based on environment
const configs: Record<AppConfig['environment'], AppConfig> = {
  development: {
    api: {
      baseUrl: 'http://localhost:3000',
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['*'],
      },
    },
    environment: 'development',
    isProduction: false,
    isDevelopment: true,
  },
  staging: {
    api: {
      baseUrl: 'https://api.portal.inovatrix.io',
      cors: {
        allowedOrigins: [
          'https://staging.portal.inovatrix.io',
          'https://staging.portal.inovatrix.io',
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-API-Key',
        ],
      },
    },
    environment: 'staging',
    isProduction: false,
    isDevelopment: false,
  },
  production: {
    api: {
      baseUrl: 'https://api.portal.inovatrix.io',
      cors: {
        allowedOrigins: [
          'https://portal.inovatrix.io',
          'https://www.portal.inovatrix.io',
          'https://portal.inovatrix.io',
          'https://portal.inovatrix.io',
          'https://portal.inovatrix.io',
          'https://portal.inovatrix.io',
          // Add Vercel preview URLs for testing
          /^https:\/\/.*\.vercel\.app$/,
          /^https:\/\/.*\.vercel\.dev$/,
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-API-Key',
          'X-Session-ID',
          'X-Forwarded-For',
        ],
      },
    },
    environment: 'production',
    isProduction: true,
    isDevelopment: false,
  },
};

// Export the current environment's configuration
export const config: AppConfig = configs[environment];

// Helper functions
export function getApiUrl(endpoint: string): string {
  const baseUrl = config.api.baseUrl;
  return `${baseUrl}${endpoint}`;
}

export function isAllowedOrigin(origin: string): boolean {
  // Handle regex patterns for Vercel URLs
  return config.api.cors.allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin || allowed === '*';
    }
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return false;
  });
}

// Environment variables with validation
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'hr',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'innovatrix-hr-assets-2026',
} as const;

// Validate required environment variables
export function validateEnvironment(): void {
  const requiredVars = ['MONGODB_URI', 'CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY'];
  const missing = requiredVars.filter(varName => !env[varName as keyof typeof env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Environment check:', {
      NODE_ENV: env.NODE_ENV,
      MONGODB_URI_EXISTS: !!env.MONGODB_URI,
      CLERK_SECRET_KEY_EXISTS: !!env.CLERK_SECRET_KEY,
      CLERK_PUBLISHABLE_KEY_EXISTS: !!env.CLERK_PUBLISHABLE_KEY,
    });
    
    if (env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Export CORS options for Next.js config
export const corsOptions = {
  origin: config.api.cors.allowedOrigins,
  methods: config.api.cors.allowedMethods,
  allowedHeaders: config.api.cors.allowedHeaders,
  credentials: config.isProduction,
  maxAge: 86400,
};
