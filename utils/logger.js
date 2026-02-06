/**
 * Logger Utility
 * Production-ready logging system
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  TRACE: '\x1b[90m', // Gray
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor(name = 'App') {
    this.name = name;
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      logger: this.name,
      message,
      ...data
    };
  }

  writeLog(level, message, data = {}) {
    const logEntry = this.formatMessage(level, message, data);
    
    // Console output
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;
    console.log(
      `${color}[${logEntry.timestamp}] [${level}] [${this.name}]${reset}`,
      message,
      Object.keys(data).length > 0 ? data : ''
    );

    // File output (only in production or if LOG_FILE is set)
    if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
      const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', { encoding: 'utf-8' });
    }
  }

  error(message, data = {}) {
    this.writeLog(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = {}) {
    this.writeLog(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = {}) {
    this.writeLog(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog(LOG_LEVELS.DEBUG, message, data);
    }
  }

  trace(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog(LOG_LEVELS.TRACE, message, data);
    }
  }
}

// Export singleton instance
module.exports = Logger;
