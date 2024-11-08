import { format, createLogger, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
  format.printf(info => `${info.timestamp} [${info.level}] > ${info.message}`),
);

const levels = {
  error: 0,
  info: 1,
  debug: 2,
  alert: 3, 
  warn: 4,
  data: 5,
};

const logger = createLogger({
  levels,
  format: logFormat,
  
  transports: [
    new DailyRotateFile({
      level: 'alert',
      filename: 'logs/rotate-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '20d',
      maxSize: '30m',
    }),
  ],
});

export default logger;
