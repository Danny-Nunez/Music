type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = (globalThis as any)?.process?.env?.NODE_ENV === 'development';
  private isTest = (globalThis as any)?.process?.env?.NODE_ENV === 'test';

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment && !this.isTest) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
    };
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      return sanitized;
    }
    
    return data;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, data);
    
    switch (level) {
      case 'debug':
        console.debug(`[DEBUG] ${logEntry.message}`, logEntry.data || '');
        break;
      case 'info':
        console.info(`[INFO] ${logEntry.message}`, logEntry.data || '');
        break;
      case 'warn':
        console.warn(`[WARN] ${logEntry.message}`, logEntry.data || '');
        break;
      case 'error':
        console.error(`[ERROR] ${logEntry.message}`, logEntry.data || '');
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger();