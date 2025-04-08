type LogLevel = 'info' | 'error' | 'warn' | 'debug';

const formatMessage = (prefix: string, message: string) => {
  return `[${prefix}] ${message}`;
};

export const logger = {
  info: (prefix: string, message: string) => {
    console.log(formatMessage(prefix, message));
  },
  error: (prefix: string, message: string) => {
    console.error(formatMessage(prefix, message));
  },
  warn: (prefix: string, message: string) => {
    console.warn(formatMessage(prefix, message));
  },
  debug: (prefix: string, message: string) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(formatMessage(prefix, message));
    }
  },
};
