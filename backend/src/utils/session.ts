import { createHash } from 'node:crypto';

export const getuniqueHash = (req): string | undefined => {
  return req?.session?.user?.uniqueHash;
};

export const getUniqueHashFromAnonId = (anon_id: string): string => {
  const hashedString = createHash('sha256').update(anon_id).digest('hex');

  return `f'anon-${hashedString}`;
};
