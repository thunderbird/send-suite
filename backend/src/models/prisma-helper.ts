/* eslint-disable @typescript-eslint/no-explicit-any */
type PrismaFn = (opts: PrismaOpts) => Promise<any>;
type PrismaOpts = Record<string, any>;
type ErrorCallback = () => never;
import { DAYS_TO_EXPIRY } from '@/config';
import { Prisma } from '@prisma/client';
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

/* 
  This version types the query parameter correclty.
*/
export async function fromPrismaV3<F extends (args: any) => Promise<any>>(
  fn: F,
  options: Parameters<F>[0],
  onError?: string | ErrorCallback
): Promise<ReturnType<F>> {
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

export type PrismaItemsIncludeOptions = {
  items: Prisma.ItemFindFirstOrThrowArgs;
};

export const itemsIncludeOptions: PrismaItemsIncludeOptions = {
  items: {
    where: {
      createdAt: {
        gte: new Date(
          new Date().setDate(new Date().getDate() - DAYS_TO_EXPIRY)
        ),
      },
    },
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

type PrismaChildrenIncludeOptions = { children: Prisma.ContainerDefaultArgs };
export const childrenIncludeOptions: PrismaChildrenIncludeOptions = {
  children: {
    include: itemsIncludeOptions,
  },
};
