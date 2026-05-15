/**
 * Production-safe logging utility
 * Works in both development and Vercel production environments
 */

interface LogContext {
  [key: string]: any;
}


class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private shouldLog(): boolean {
    // Always log in development
    if (this.isDevelopment) return true;
    
    // In production, log by default (can be disabled with DISABLE_PRODUCTION_LOGS=true)
    return process.env.DISABLE_PRODUCTION_LOGS !== 'true';
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog()) return;
    
    const formattedMessage = this.formatMessage('INFO', message, context);
    console.log(formattedMessage);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog()) return;
    
    const formattedMessage = this.formatMessage('WARN', message, context);
    console.warn(formattedMessage);
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog()) return;
    
    const formattedMessage = this.formatMessage('ERROR', message, context);
    console.error(formattedMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog()) return;
    
    const formattedMessage = this.formatMessage('DEBUG', message, context);
    console.log(formattedMessage);
  }

  // Specialized logging for timezone operations
  timezone(operation: string, context?: LogContext): void {
    this.info(`🌍 [Timezone] ${operation}`, context);
  }


  attendance(action: string, context?: LogContext): void {
    this.info(`📊 [Attendance] ${action}`, context);
  }

  api(endpoint: string, action: string, context?: LogContext): void {
    this.info(`🔌 [API] ${endpoint} - ${action}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { info, warn, error, debug, timezone, attendance, api } = logger;
