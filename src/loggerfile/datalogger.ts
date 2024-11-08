import { format, createLogger } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
    format.printf(info => `${info.timestamp} [${info.level}] > ${info.message}`),
);

const levels = {
    error: 1,
    info: 2,
    debug: 3,
    warn: 4,
    data: 0,
    alert: 5,
}
const datalogger = createLogger({
    levels,
    format: logFormat,
    transports: [
        new DailyRotateFile({
            level: 'error',
            filename: 'logs/data/datarotate-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '10d',
            maxSize: '30mb',
        }),
    ],
});

export default datalogger;
