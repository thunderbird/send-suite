import jwt from 'jsonwebtoken';
import { getJWTfromToken } from './client';

type Args = {
  jwtToken: string;
  jwtRefreshToken: string;
};

export const validateJWT = ({
  jwtRefreshToken,
  jwtToken,
}: Args): 'valid' | 'shouldRefresh' | null => {
  const token = getJWTfromToken(jwtToken);
  const refreshToken = getJWTfromToken(jwtRefreshToken);

  if (!token && !refreshToken) {
    return null;
  }

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return 'valid';
  } catch (error) {
    // catch error and try to refresh token
    return 'shouldRefresh';
  }
};
