export const getHashedEmail = (req): string | undefined => {
  return req?.session?.user?.hashedEmail;
};
