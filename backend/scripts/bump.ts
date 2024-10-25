import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  version: string;
}

async function updateYamlConfig(): Promise<void> {
  try {
    // Define relative paths from current directory
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const yamlConfigPath = path.resolve(
      __dirname,
      '../../pulumi/config.staging.yaml'
    );

    // Read and parse package.json
    const packageJsonContent = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8')
    ) as PackageJson;
    const version = packageJsonContent.version;

    console.log('using version', version);

    // Read the YAML file as string
    const yamlContent = fs.readFileSync(yamlConfigPath, 'utf8');

    // Regular expression to match the Docker image line
    // This assumes the image is defined in a format like: "image: registry/name:version"
    const imageLineRegex = /(^\s*image:\s*[^:]+:)([^\s#]+)/gm;

    // Replace the version in the image line
    const updatedYamlContent = yamlContent.replace(
      imageLineRegex,
      (match, prefix) => `${prefix}${version}`
    );

    // Only write if there were actual changes
    if (yamlContent !== updatedYamlContent) {
      fs.writeFileSync(yamlConfigPath, updatedYamlContent, 'utf8');
      console.log(`Successfully updated YAML config with version ${version}`);
    } else {
      console.log('No updates were necessary in the YAML config');
    }
  } catch (error) {
    console.error('Error updating YAML config:', error);
    throw error;
  }
}

// Execute the update function
updateYamlConfig().catch((error) => {
  console.error('Failed to update YAML config:', error);
  process.exit(1);
});
