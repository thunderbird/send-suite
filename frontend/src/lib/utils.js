export function delay(delay = 100) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function arrayToB64(array) {
  return b64
    .fromByteArray(array)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
