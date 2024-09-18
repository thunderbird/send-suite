/* eslint-disable @typescript-eslint/no-explicit-any */
type PrismaFn = (opts: PrismaOpts) => Promise<any>;
type PrismaOpts = Record<string, any>;
type ErrorCallback = () => never;
import { BaseError } from '../errors/models';

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
    console.error(err);
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

export async function fromPrismaV2<T, U>(
  fn: (opts: U) => Promise<T>,
  options: U,
  onError?: string | ErrorCallback
) {
  try {
    const result = await fn(options);
    return result;
  } catch (err) {
    console.error(err);
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
