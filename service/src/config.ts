import { randomBytes } from "crypto";
import { tmpdir } from "os";
import path from "path";

const appConfig = {
  file_dir: `${tmpdir()}${path.sep}send-${randomBytes(4).toString("hex")}`,
  default_expire_seconds: 86400,
  default_downloads: 1,
  base_url: "https://localhost:8088",
  detect_base_url: false,
  max_file_size: 1024 * 1024 * 1024 * 2.5,
};

export const deriveBaseUrl = (req) => {
  if (!appConfig.detect_base_url) {
    console.log(
      `deriveBaseUrl(): not supposed to detect base URL, just using static one from config.ts`
    );
    return appConfig.base_url;
  }

  console.log(`deriveBaseUrl(): detecting base url`);
  const protocol = req.secure ? "https://" : "http://";
  return `${protocol}${req.headers.host}`;
};

export default appConfig;
