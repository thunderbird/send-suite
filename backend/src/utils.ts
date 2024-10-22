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
