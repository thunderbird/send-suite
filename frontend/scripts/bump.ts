import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  version: string;
}

async function updateManifestConfig(): Promise<void> {
  try {
    // Define relative paths from current directory
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');

    // Read and parse package.json
    const packageJsonContent = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8')
    ) as PackageJson;
    const version = packageJsonContent.version;

    console.log('using version', version);

    // Read the Manifest file as string
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    // Regular expression to match the Docker image line
    // This assumes the image is defined in a format like: "image: registry/name:version"
    const versionRegex = /"version":\s*"([^"]+)"/;

    // Replace the version in the image line
    const updatedManifestContent = manifestContent.replace(
      versionRegex,
      () => `"version": "${version}"`
    );

    // Only write if there were actual changes
    if (manifestContent !== updatedManifestContent) {
      fs.writeFileSync(manifestPath, updatedManifestContent, 'utf8');
      console.log(
        `Successfully updated Manifest config with version ${version}`
      );
    } else {
      console.log('No updates were necessary in the Manifest config');
    }
  } catch (error) {
    console.error('Error updating Manifest config:', error);
    throw error;
  }
}

// Execute the update function
updateManifestConfig().catch((error) => {
  console.error('Failed to update Manifest config:', error);
  process.exit(1);
});
