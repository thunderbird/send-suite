import winston from 'winston';
const { combine, errors, prettyPrint, timestamp } = winston.format;
const { File, Console } = winston.transports;

const ERROR_LOG = 'logs/error.log';
const COMBINED_LOG = 'logs/combined.log';

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), prettyPrint()),
  defaultMeta: { service: 'user-service' },
  transports: [
    new File({
      filename: ERROR_LOG,
      level: 'error',
    }),
    new File({ filename: COMBINED_LOG }),
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

if (process.env.APP_ENV !== 'production') {
  logger.add(
    new Console({
      // format: combine(timestamp(), prettyPrint()),
      format: winston.format.printf(consoleFormat),
    })
  );
}

export default logger;
