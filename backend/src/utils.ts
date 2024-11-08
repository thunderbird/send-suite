import { Upload } from '@prisma/client';
import { DAYS_TO_EXPIRY } from './config';

// Time constants
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_MINUTE: 60_000,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

export function base64url(source) {
  // Encode in classical base64
  let encodedSource = Buffer.from(source).toString('base64');

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');

  return encodedSource;
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const getCookie = (
  cookieStr: string | undefined,
  name: string
): string | null => {
  if (!cookieStr || !name) return null;

  const cookies = cookieStr.split(';').map((cookie) => cookie.trim());
  const authCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!authCookie) return null;

  const [, value] = authCookie.split('=');
  return value ? decodeURIComponent(value) : null;
};

type RoundNumber = number;

function isRoundNumber(num: number): num is RoundNumber {
  return Number.isInteger(num);
}
export const getTokenExpiration = (days: number) => {
  if (!isRoundNumber(days)) {
    throw new Error(
      'Token expiration should be a round number specifying days'
    );
  }

  const milliseconds =
    TIME_CONSTANTS.MILLISECONDS_PER_MINUTE *
    TIME_CONSTANTS.MINUTES_PER_HOUR *
    TIME_CONSTANTS.HOURS_PER_DAY *
    days;

  const stringified = `${days}d`;

  return { milliseconds, stringified };
};

export const formatDaysToExpiry = (days: number): number => {
  return Math.max(0, days);
};

export const addExpiryToContainer = ({ createdAt, ...upload }: Upload) => {
  const daysToExpiry =
    DAYS_TO_EXPIRY -
    Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) /
        TIME_CONSTANTS.MILLISECONDS_PER_DAY
    );

  const formattedDays = formatDaysToExpiry(daysToExpiry);

  return {
    ...upload,
    daysToExpiry: formattedDays,
    expired: daysToExpiry <= 0,
  };
};
