import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const idForProduction = `"id": "tb-send@thunderbird.net"`;
const idForStaging = ` "id": "send@thunderbird.net"`;

async function updateManifestConfig(): Promise<void> {
  try {
    // Define relative paths from current directory
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');

    // Read the Manifest file as string
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    // Replace the id in the image line
    const updateManifestID = manifestContent.replace(
      idForStaging,
      idForProduction
    );

    // When building for prod, replace the manifest ID
    console.log(process.env.BASE_URL);
    if (process.env.BASE_URL.includes('send-backend.tb.pro')) {
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
