type PrismaFn = (opts: PrismaOpts) => Promise<any>;
type PrismaOpts = Record<string, any>;
type ErrorCallback = () => never;

export async function fromPrisma(
  fn: PrismaFn,
  options: PrismaOpts,
  onError?: ErrorCallback
) {
  try {
    return fn(options);
  } catch (err) {
    // TODO: send original `err` to Sentry, once that's set up
    if (onError) {
      onError();
    } else {
      throw new Error(err.message);
    }
  }
}
