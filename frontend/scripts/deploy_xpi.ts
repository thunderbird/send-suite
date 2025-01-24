import * as http from 'http';
import * as https from 'https';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
var FormData = require('form-data');

interface PackageJson {
    version: string;
}

function getEnvConfig(): {api_key: string, api_secret: string} {
    let configErrors = false;

    let apiKey = process.env.ATN_API_KEY;
    let apiSecret = process.env.ATN_API_SECRET;

    if (!apiKey) {
        console.error('ATN_API_KEY is unset');
        configErrors = true;
    }

    if (!apiSecret) {
        console.error('ATN_API_SECRET is unset');
        configErrors = true;
    }

    if (configErrors) {
        throw Error('Set all unset environment variables and try again')
    } else {
        return {api_key: apiKey, api_secret: apiSecret};
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

    console.log('apiSecret:', apiSecret);

    // Craft the payload
    return jwt.sign(
        {},
        apiSecret,
        {
            algorithm: 'HS256',
            expiresIn: '1 minute',
            issuer: apiKey,
            jwtid: generateJwtId(),
        }
    );
}

function getXpiPath(): string {
    let xpiPath = process.argv[process.argv.length - 1];
    if (xpiPath.endsWith('.xpi')) {
        return xpiPath;
    } else {
        throw Error(`XPI Path "${xpiPath} is invalid`);
    }
}

function submitXpi(xpiPath: string, version: string, jwt: string): void {
    const reqHost = 'addons.thunderbird.net';
    const reqPathBase = '/api/v3/addons';
    const packageName = 'tb-send';
    const org = 'thunderbird.mozilla.org';
    
    console.log(`Submitting XPI version ${version} in file ${xpiPath}...`)

    // Simulate a request to submit the XPI via the webform
    let form = new FormData();
    form.append('upload', fs.createReadStream(xpiPath));

    // Add our auth header to the form headers
    let headers = form.getHeaders();
    headers.Authorization = `JWT ${jwt}`;

    // Form a request and ship the XPI
    const requestOpts = {
        method: 'PUT',
        host: reqHost,
        path: `${reqPathBase}/${packageName}@${org}/versions/${version}`,
        headers: headers,
    };
    let request = https.request(requestOpts);
    form.pipe(request);

    // React to the response
    request.on('response', function(resp) {
        console.log(`Got response: ${resp.statusCode} ${resp.statusMessage}`);
        if (resp.statusCode == 200) {
            console.log('SUCCESS!');
            process.exit(0)
        } else {
            console.log('FAILURE!');
            process.exit(1)
        }
    });
}

// Pull the file name out of the command
const packageVersion = getPackageVersion();
const jwToken = generateJwt();
const xpiPath = getXpiPath();

submitXpi(xpiPath, packageVersion, jwToken);