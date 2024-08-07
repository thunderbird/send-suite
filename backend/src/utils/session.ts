import { Request } from 'express';
import { createHash } from 'node:crypto';
import { USER_ERRORS } from '../errors/routes';

export const getUniqueHash = (req: Request) => {
  return req?.session?.user?.uniqueHash;
};

export const getUniqueHashFromAnonId = (anon_id: string): string => {
  const hashedString = createHash('sha256').update(anon_id).digest('hex');

  return `f'anon-${hashedString}`;
};

export const getSessionUserOrThrow = (req: Request) => {
  if (!req?.session?.user) {
    throw new Error(USER_ERRORS.SESSION_NOT_FOUND.message);
  }
  return req.session.user;
};
