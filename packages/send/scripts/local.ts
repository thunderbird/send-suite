import { readFile, writeFile } from "fs/promises";
import { join } from "path";

/**
 * This script modifies the .env files to enable public login functionality for local development.
 */
async function addPublicLoginFlags() {
  const rootDir = process.cwd();

  // Modify backend environment configuration
  const backendEnvPath = join(rootDir, "backend", ".env");
  let backendEnv = await readFile(backendEnvPath, "utf-8");
  // Enable public login for backend by changing env variable
  backendEnv = backendEnv.replace(
    "ALLOW_PUBLIC_LOGIN=false",
    "ALLOW_PUBLIC_LOGIN=true"
  );

  await writeFile(backendEnvPath, backendEnv);

  // Modify frontend environment configuration
  const frontendEnvPath = join(rootDir, "frontend", ".env");
  let frontendEnv = await readFile(frontendEnvPath, "utf-8");
  // Enable public login for frontend by changing Vite env variable
  frontendEnv = frontendEnv.replace(
    "VITE_ALLOW_PUBLIC_LOGIN=false",
    "VITE_ALLOW_PUBLIC_LOGIN=true"
  );
  await writeFile(frontendEnvPath, frontendEnv);
}

// Execute the script and log any errors that occur
addPublicLoginFlags().catch(console.error);
