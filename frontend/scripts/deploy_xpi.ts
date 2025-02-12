import FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { getIsEnvProd, PACKAGE_NAME } from './config';

interface PackageJson {
  version: string;
}

function getEnvConfig(): { api_key: string; api_secret: string } {
  let configErrors = false;

  const apiKey = process.env.ATN_API_KEY;
  const apiSecret = process.env.ATN_API_SECRET;

  if (!apiKey) {
    console.error('ATN_API_KEY is unset');
    configErrors = true;
  }

  if (!apiSecret) {
    console.error('ATN_API_SECRET is unset');
    configErrors = true;
  }

  if (configErrors) {
    throw Error('Set all unset environment variables and try again');
  } else {
    return { api_key: apiKey, api_secret: apiSecret };
  }
}

function getPackageVersion(): string {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJsonContent = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf8')
  ) as PackageJson;
  return packageJsonContent.version;
}

function generateJwtId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const idLength = 64;
  let jwtId = '';

  for (let i = 0; i < idLength; i++) {
    jwtId += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return jwtId;
}

function generateJwt(): string {
  // Gather the data we need for the PWT payload
  const config = getEnvConfig();
  const apiKey = config.api_key;
  const apiSecret = config.api_secret;

  // Craft the payload
  return jwt.sign({}, apiSecret, {
    algorithm: 'HS256',
    expiresIn: '1 minute',
    issuer: apiKey,
    jwtid: generateJwtId(),
  });
}

function getXpiPath(): string {
  const xpiPath = process.argv[process.argv.length - 1];
  if (xpiPath.endsWith('.xpi')) {
    return xpiPath;
  } else {
    throw Error(`XPI Path "${xpiPath} is invalid`);
  }
}

function submitXpi(xpiPath: string, version: string, jwt: string): void {
  const isProd = getIsEnvProd();
  const reqHost = 'addons.thunderbird.net';
  const reqPathBase = '/api/v3/addons';
  const packageName = isProd ? PACKAGE_NAME.production : PACKAGE_NAME.staging;
  const org = 'thunderbird.net';

  console.log(`Submitting XPI version ${version} in file ${xpiPath}...`);

  // Simulate a request to submit the XPI via the webform
  const form = new FormData();
  form.append('upload', fs.createReadStream(xpiPath));

  // Add our auth header to the form headers
  const headers = form.getHeaders();
  headers.Authorization = `JWT ${jwt}`;

  // Form a request and ship the XPI
  const requestOpts = {
    method: 'PUT',
    host: reqHost,
    path: `${reqPathBase}/${packageName}@${org}/versions/${version}/`,
    headers: headers,
  };

  const request = https.request(requestOpts);
  form.pipe(request);

  // React to the response
  request.on('response', function (resp) {
    if (resp.statusCode == 202) {
      console.log('SUCCESS!');
      process.exit(0);
    }
    if (resp.statusCode === 409) {
      console.warn('XPI version already exists');
      process.exit(0);
    }
    //  Any other status code is a failure
    else {
      console.error('FAILURE! With status code: ', resp.statusCode);
      process.exit(1);
    }
  });
}

const packageVersion = getPackageVersion();
const jwToken = generateJwt();
const xpiPath = getXpiPath();

submitXpi(xpiPath, packageVersion, jwToken);
