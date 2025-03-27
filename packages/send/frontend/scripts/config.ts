import dotenv from 'dotenv';
dotenv.config();

export const ID_FOR_PROD = `"id": "tb-send@thunderbird.net"`;
export const ID_FOR_STAGE = ` "id": "send@thunderbird.net"`;

export const NAME_FOR_PROD = `"name": "Thunderbird Send"`;
export const NAME_FOR_STAGE = `"name": "Thunderbird Send [STAGE]"`;

export const PACKAGE_NAME = {
  production: 'tb-send',
  stage: 'send',
};

export const getIsEnvProd = () => {
  return process.env.BASE_URL.includes('https://send.tb.pro');
};
