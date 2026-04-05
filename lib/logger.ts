/**
 * Shared error logging module using Winston
 *
 * Provides centralized logging for application errors, warnings, and info.
 * Logs are written to both console and files for debugging and monitoring.
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about the colors
winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'persona-blog' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      level: 'info',
    }),
    // Write all errors to error.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    })
  );
}

/**
 * Log an error message
 * @param message - Error message
 * @param error - Optional error object with stack trace
 * @param meta - Optional metadata to include
 */
export function logError(message: string, error?: Error, meta?: Record<string, any>) {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  });
}

/**
 * Log a warning message
 * @param message - Warning message
 * @param meta - Optional metadata to include
 */
export function logWarn(message: string, meta?: Record<string, any>) {
  logger.warn(message, meta);
}

/**
 * Log an info message
 * @param message - Info message
 * @param meta - Optional metadata to include
 */
export function logInfo(message: string, meta?: Record<string, any>) {
  logger.info(message, meta);
}

/**
 * Log HTTP request
 * @param method - HTTP method
 * @param url - Request URL
 * @param status - Response status code
 * @param responseTime - Response time in ms
 */
export function logHttp(
  method: string,
  url: string,
  status: number,
  responseTime: number
) {
  const message = `${method} ${url} ${status} ${responseTime}ms`;
  const level = status >= 400 ? 'error' : 'http';
  logger.log(level, message, {
    method,
    url,
    status,
    responseTime,
  });
}

/**
 * Log a debug message
 * @param message - Debug message
 * @param meta - Optional metadata to include
 */
export function logDebug(message: string, meta?: Record<string, any>) {
  logger.debug(message, meta);
}

export default logger;
