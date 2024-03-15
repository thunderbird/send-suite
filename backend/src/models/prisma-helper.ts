
type ErrorCallback = () => never;

export async function fromPrisma(fn, options, onError?: ErrorCallback) {
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
