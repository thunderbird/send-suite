type PrismaFn = (opts: PrismaOpts) => Promise<any>;
type PrismaOpts = Record<string, any>;
type ErrorCallback = () => never;
import { BaseError } from '../errors/models';
import logger from '../logger';

export async function fromPrisma(
  fn: PrismaFn,
  options: PrismaOpts,
  onError?: string | ErrorCallback
) {
  try {
    const result = await fn(options);
    return result;
  } catch (err) {
    // TODO: send original `err` to Sentry, once that's set up
    if (onError) {
      if (typeof onError === 'string') {
        throw new BaseError(onError);
      } else {
        onError();
      }
    } else {
      throw new Error(err.name);
    }
  }
}

export const itemsIncludeOptions = {
  items: {
    include: {
      upload: {
        include: {
          owner: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  },
};
export const childrenIncludeOptions = {
  children: {
    include: itemsIncludeOptions,
  },
};
