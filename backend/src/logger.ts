import winston from 'winston';
import { IS_ENV_PROD } from './config';
const { combine, errors, prettyPrint, timestamp } = winston.format;
const { File, Console } = winston.transports;

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), prettyPrint()),
  defaultMeta: { service: 'user-service' },
  transports: [
    new File({
      filename: process.env.ERROR_LOG,
      level: 'error',
    }),
    new File({ filename: process.env.COMBINED_LOG }),
  ],
});

function consoleFormat(info) {
  return `${new Date(info.timestamp).toLocaleDateString('us-EN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: process.env.DEVELOPER_TIMEZONE ?? 'UTC',
  })} ${info.level.toLocaleUpperCase()}: ${info.message}`;
}

if (!IS_ENV_PROD) {
  logger.add(
    new Console({
      // format: combine(timestamp(), prettyPrint()),
      format: winston.format.printf(consoleFormat),
    })
  );
}

export default logger;
