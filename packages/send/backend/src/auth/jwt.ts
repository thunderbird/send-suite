import jwt from 'jsonwebtoken';
import { getJWTfromToken } from './client';

type Args = {
  jwtToken: string;
  jwtRefreshToken: string;
};

/**
 * The output is either 'valid' or 'shouldRefresh' or null. No other string is possible.
 **/
type ValidationResult = 'valid' | 'shouldRefresh' | null;

/**
 * This function validates the JWT token and returns a string indicating whether the token is valid or not.
 * If the token is invalid, it will try to refresh the token.
 * @param jwtToken - JWT token
 * @param jwtRefreshToken - JWT refresh token
 * @returns 'valid' if the token is valid, 'shouldRefresh' if the token needs to be refreshed, or null if the token is missing
 **/
export const validateJWT = ({
  jwtRefreshToken,
  jwtToken,
}: Args): ValidationResult => {
  const token = getJWTfromToken(jwtToken);
  const refreshToken = getJWTfromToken(jwtRefreshToken);

  if (!token && !refreshToken) {
    return null;
  }

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return 'valid';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // catch error and try to refresh token
    return 'shouldRefresh';
  }
};
