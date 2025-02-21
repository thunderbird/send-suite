import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { getIsEnvProd } from '../src/lib/config';
import {
  ID_FOR_PROD,
  ID_FOR_STAGING,
  NAME_FOR_PROD,
  NAME_FOR_STAGING,
} from './config';
dotenv.config();

export async function updateManifestConfig(): Promise<void> {
  const isProd = getIsEnvProd(process.env);
  console.log(`Updating manifest.json for ${isProd ? 'PROD' : 'STAGING'}`);
  try {
    // Define relative paths from current directory
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');
    // Read the Manifest file as string
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');

    // PROD VALUES
    if (isProd) {
      // Replace the id in the image line
      manifestContent = manifestContent.replace(ID_FOR_STAGING, ID_FOR_PROD);
    } else {
      // Replace name to tag staging
      manifestContent = manifestContent.replace(
        NAME_FOR_PROD,
        NAME_FOR_STAGING
      );
      manifestContent = manifestContent.replace(ID_FOR_PROD, ID_FOR_STAGING);
      // Replace icons with dev versions
      manifestContent = manifestContent.replace(
        /icons\/(\d+)\.png/g,
        'icons/$1-dev.png'
      );
    }

    // Write the updated content back to the file
    fs.writeFileSync(manifestPath, manifestContent, 'utf8');
  } catch (error) {
    console.error('Error updating Manifest config:', error);
    throw error;
  }
}

// Execute the update function
updateManifestConfig()
  .then(() => {
    console.log(`Finished setting up manifest.json`);
  })
  .catch((error) => {
    console.error('Failed to update Manifest config:', error);
    process.exit(1);
  });
