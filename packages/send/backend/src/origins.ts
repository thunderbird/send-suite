import { NextFunction, Request, Response } from 'express';
import { getAllowedOrigins } from './auth/client';
import cors from 'cors';

const allowedOrigins = getAllowedOrigins();

export const originsHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const origin = req.headers.origin;

  // Check if it's a Thunderbird extension origin
  if (origin && origin.startsWith('moz-extension://')) {
    allowedOrigins.push(origin);
  }

  // Allow any matching origin
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  })(req, res, next);
};
