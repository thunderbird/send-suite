import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { getIsEnvProd, ID_FOR_PROD, ID_FOR_STAGING } from './config';
dotenv.config();

async function updateManifestConfig(): Promise<void> {
  try {
    // Define relative paths from current directory
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');

    // Read the Manifest file as string
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    // Replace the id in the image line
    const updateManifestID = manifestContent.replace(
      ID_FOR_STAGING,
      ID_FOR_PROD
    );

    // When building for prod, replace the manifest ID
    const isProd = getIsEnvProd();
    if (isProd) {
      fs.writeFileSync(manifestPath, updateManifestID, 'utf8');
    }
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
