import fs from "fs/promises";
import path from "path";

const extractKeys = (str: string): string[] => {
  return str
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line.includes("="))
    .map((line) => line.split("=")[0].trim());
};

// Function to read .env files from a directory and return unique keys
async function readEnvs(directoryPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(directoryPath);
    const envFiles = files.filter((file) => file.includes(".env"));

    const keys = await Promise.all(
      envFiles.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const data = await fs.readFile(filePath, "utf8");
        return extractKeys(data);
      })
    );

    // Flatten the array of arrays into a single array of keys
    const allKeys = keys.flat();

    // Use a Map to count occurrences of each key
    const keyCount = new Map<string, number>();
    allKeys.forEach((key) => {
      keyCount.set(key, (keyCount.get(key) || 0) + 1);
    });

    // Filter keys to only include those that appear exactly once
    const uniqueKeys = Array.from(keyCount.entries())
      .filter(([key, count]) => count === 1)
      .map(([key, count]) => key);

    return uniqueKeys;
  } catch (err) {
    console.error("Error processing directory:", err);
    return [];
  }
}

async function main() {
  const backendUniqueKeys = await readEnvs(
    path.resolve(__dirname, "../backend")
  );
  const frontendUniqueKeys = await readEnvs(
    path.resolve(__dirname, "../frontend")
  );

  console.log("👀 Comparing sample and .env files");

  if (backendUniqueKeys.length || frontendUniqueKeys.length) {
    const errorMessage = `
    Found unique keys between your .env and .env.sample files. 
    This may cause issues with your application.
    If this is intentional, ignore this message:\n
    Backend: ${backendUniqueKeys.join(", ")}\n
    Frontend: ${frontendUniqueKeys.join(", ")}`;

    throw new Error(errorMessage);
  }
  console.log("✅ Your env files are in order!");
}

main();
