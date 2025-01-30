import dotenv from 'dotenv';
dotenv.config();

export const ID_FOR_PROD = `"id": "tb-send@thunderbird.net"`;
export const ID_FOR_STAGING = ` "id": "send@thunderbird.net"`;

export const PACKAGE_NAME = {
  production: 'tb-send',
  staging: 'send',
};

export const getIsEnvProd = () => {
  return process.env.BASE_URL.includes('https://send.tb.pro');
};
