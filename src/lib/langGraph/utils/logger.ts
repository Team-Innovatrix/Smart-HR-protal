// LangGraph Logger: Structured logging for workflow tracking

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  sessionId: string;
  userId?: string;
  workflow?: string;
  nodeId?: string;
  step?: number;
  timestamp: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  data?: Record<string, unknown>;
  error?: Error;
}

class LangGraphLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LANGGRAPH_LOG_LEVEL as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, context, data, error } = entry;
    const timestamp = new Date().toISOString();
    
    let logLine = `[${timestamp}] [${level.toUpperCase()}] [${context.sessionId}]`;
    
    if (context.userId) logLine += ` [${context.userId}]`;
    if (context.workflow) logLine += ` [${context.workflow}]`;
    if (context.nodeId) logLine += ` [${context.nodeId}]`;
    if (context.step !== undefined) logLine += ` [step:${context.step}]`;
    
    logLine += ` ${message}`;
    
    if (data) logLine += ` | Data: ${JSON.stringify(data)}`;
    if (error) logLine += ` | Error: ${error.message}`;
    
    return logLine;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLog(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }

    // In production, you might want to send logs to external service
    if (!this.isDevelopment && entry.level === 'error') {
      // TODO: Send to external logging service (e.g., Sentry, DataDog)
    }
  }

  // Session lifecycle logging
  sessionStart(sessionId: string, userId?: string, workflow?: string): void {
    this.log({
      level: 'info',
      message: 'Session started',
      context: { sessionId, userId, workflow, timestamp: new Date().toISOString() },
    });
  }

  sessionEnd(sessionId: string, userId?: string, workflow?: string): void {
    this.log({
      level: 'info',
      message: 'Session ended',
      context: { sessionId, userId, workflow, timestamp: new Date().toISOString() },
    });
  }

  // Voice recording logging
  voiceRecordingStart(sessionId: string, userId?: string): void {
    this.log({
      level: 'info',
      message: 'Voice recording started',
      context: { sessionId, userId, timestamp: new Date().toISOString() },
    });
  }

  voiceRecordingEnd(sessionId: string, userId?: string, duration?: number): void {
    this.log({
      level: 'info',
      message: 'Voice recording completed',
      context: { sessionId, userId, timestamp: new Date().toISOString() },
      data: { duration },
    });
  }

  // Text extraction logging
  textExtracted(sessionId: string, text: string, confidence?: number): void {
    this.log({
      level: 'info',
      message: 'Text extracted from audio',
      context: { sessionId, timestamp: new Date().toISOString() },
      data: { textLength: text.length, confidence },
    });
  }

  // Node execution logging
  nodeStart(sessionId: string, nodeId: string, workflow?: string, step?: number, input?: unknown): void {
    // Extract only intent if input is a state object
    let essentialData: Record<string, unknown> | undefined;
    if (input && typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      if ('currentIntent' in obj || ('value' in obj && typeof obj.value === 'object')) {
        const state = ('value' in obj ? obj.value : obj) as Record<string, unknown>;
        essentialData = { intent: state.currentIntent };
      } else if ('text' in obj) {
        essentialData = { text: typeof obj.text === 'string' ? `${obj.text.substring(0, 30)}...` : obj.text };
      }
    }
    
    this.log({
      level: 'info',
      message: `→ ${nodeId}`,
      context: { sessionId, workflow, nodeId, step, timestamp: new Date().toISOString() },
      data: essentialData,
    });
  }

  nodeComplete(sessionId: string, nodeId: string, workflow?: string, step?: number, output?: unknown, duration?: number): void {
    // Extract only essential completion info
    let essentialData: Record<string, unknown> = {};
    if (output && typeof output === 'object') {
      const obj = output as Record<string, unknown>;
      const state = ('value' in obj ? obj.value : obj) as Record<string, unknown>;
      if ('isComplete' in state) essentialData.complete = state.isComplete;
      if ('requiresConfirmation' in state) essentialData.confirmation = state.requiresConfirmation;
      if ('error' in state && state.error) essentialData.error = state.error;
    }
    if (duration) essentialData.duration = `${duration}ms`;
    
    this.log({
      level: 'info',
      message: `✓ ${nodeId}`,
      context: { sessionId, workflow, nodeId, step, timestamp: new Date().toISOString() },
      data: Object.keys(essentialData).length > 0 ? essentialData : undefined,
    });
  }

  nodeError(sessionId: string, nodeId: string, error: Error, workflow?: string, step?: number): void {
    this.log({
      level: 'error',
      message: `Node ${nodeId} failed`,
      context: { sessionId, workflow, nodeId, step, timestamp: new Date().toISOString() },
      error,
    });
  }

  // Workflow logging
  workflowStart(sessionId: string, workflow: string, userId?: string): void {
    this.log({
      level: 'info',
      message: `→ ${workflow} started`,
      context: { sessionId, userId, workflow, timestamp: new Date().toISOString() },
    });
  }

  workflowComplete(sessionId: string, workflow: string, userId?: string, result?: unknown): void {
    // Extract only status from result
    let status: Record<string, unknown> = {};
    if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      const state = ('value' in obj ? obj.value : obj) as Record<string, unknown>;
      if ('currentIntent' in state) status.intent = state.currentIntent;
      if ('isComplete' in state) status.complete = state.isComplete;
      if ('error' in state && state.error) status.error = state.error;
    }
    
    this.log({
      level: 'info',
      message: `✓ ${workflow} completed`,
      context: { sessionId, userId, workflow, timestamp: new Date().toISOString() },
      data: Object.keys(status).length > 0 ? status : undefined,
    });
  }

  workflowError(sessionId: string, workflow: string, error: Error, userId?: string): void {
    this.log({
      level: 'error',
      message: `Workflow ${workflow} failed`,
      context: { sessionId, userId, workflow, timestamp: new Date().toISOString() },
      error,
    });
  }

  // Intent classification logging
  intentExtracted(sessionId: string, intent: string, confidence: number, entities?: Record<string, unknown>): void {
    this.log({
      level: 'info',
      message: 'Intent extracted',
      context: { sessionId, timestamp: new Date().toISOString() },
      data: { intent, confidence, entities },
    });
  }

  intentClassified(sessionId: string, intent: string, domain: string, confidence: number): void {
    this.log({
      level: 'info',
      message: 'Intent classified to domain',
      context: { sessionId, timestamp: new Date().toISOString() },
      data: { intent, domain, confidence },
    });
  }

  // Data collection logging
  dataCollectionStart(sessionId: string, workflow: string, missingFields: string[]): void {
    this.log({
      level: 'debug',
      message: 'Data collection started',
      context: { sessionId, workflow, timestamp: new Date().toISOString() },
      data: { missingFields },
    });
  }

  dataCollectionComplete(sessionId: string, workflow: string, collectedData: Record<string, unknown>): void {
    this.log({
      level: 'debug',
      message: 'Data collection completed',
      context: { sessionId, workflow, timestamp: new Date().toISOString() },
      data: { collectedData },
    });
  }

  // Validation logging
  validationStart(sessionId: string, workflow: string, data: Record<string, unknown>): void {
    this.log({
      level: 'debug',
      message: 'Validation started',
      context: { sessionId, workflow, timestamp: new Date().toISOString() },
      data: { validationData: this.sanitizeData(data) },
    });
  }

  validationResult(sessionId: string, workflow: string, isValid: boolean, errors?: string[]): void {
    this.log({
      level: isValid ? 'debug' : 'warn',
      message: `Validation ${isValid ? 'passed' : 'failed'}`,
      context: { sessionId, workflow, timestamp: new Date().toISOString() },
      data: { isValid, errors },
    });
  }

  // Execution logging
  executionStart(sessionId: string, workflow: string, action: string): void {
    this.log({
      level: 'info',
      message: `Executing ${action}`,
      context: { sessionId, workflow, timestamp: new Date().toISOString() },
      data: { action },
    });
  }

  executionResult(sessionId: string, workflow: string, action: string, success: boolean, result?: unknown): void {
    this.log({
      level: success ? 'info' : 'error',
      message: `Execution ${success ? 'succeeded' : 'failed'}`,
      context: { sessionId, workflow, timestamp: new Date().toISOString() },
      data: { action, success, result: this.sanitizeData(result) },
    });
  }

  // Generic logging methods
  debug(message: string, context: Partial<LogContext>, data?: Record<string, unknown>): void {
    this.log({
      level: 'debug',
      message,
      context: { ...context, timestamp: new Date().toISOString() } as LogContext,
      data,
    });
  }

  info(message: string, context: Partial<LogContext>, data?: Record<string, unknown>): void {
    this.log({
      level: 'info',
      message,
      context: { ...context, timestamp: new Date().toISOString() } as LogContext,
      data,
    });
  }

  warn(message: string, context: Partial<LogContext>, data?: Record<string, unknown>): void {
    this.log({
      level: 'warn',
      message,
      context: { ...context, timestamp: new Date().toISOString() } as LogContext,
      data,
    });
  }

  error(message: string, context: Partial<LogContext>, error?: Error, data?: Record<string, unknown>): void {
    this.log({
      level: 'error',
      message,
      context: { ...context, timestamp: new Date().toISOString() } as LogContext,
      error,
      data,
    });
  }

  // Helper method to extract only essential data for logging
  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) return data;
    
    const obj = data as Record<string, unknown>;
    
    // For VoiceCommandState objects, extract only essential fields
    if ('sessionId' in obj && 'currentIntent' in obj) {
      return {
        intent: obj.currentIntent,
        isComplete: obj.isComplete,
        requiresConfirmation: obj.requiresConfirmation,
        missingParameters: obj.missingParameters,
        error: obj.error
      };
    }
    
    // For result objects, keep it concise
    if ('success' in obj || 'intent' in obj) {
      const result: Record<string, unknown> = {
        success: obj.success,
        intent: obj.intent
      };
      if (obj.error) result.error = obj.error;
      return result;
    }
    
    // Remove or mask sensitive and verbose fields
    const sanitized: Record<string, unknown> = {};
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const excludeFields = ['conversationHistory', 'messages', 'executionResult', 'requiredData', 'contextData'];
    
    for (const [key, value] of Object.entries(obj)) {
      if (excludeFields.includes(key)) {
        // Skip verbose fields entirely
        continue;
      } else if (sensitiveFields.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

export const logger = new LangGraphLogger();
export default logger;
