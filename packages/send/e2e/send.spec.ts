import { BrowserContext, expect, Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { log_out_restore_keys, register_and_login } from "./pages/dashboard";
import {
  delete_file,
  download_workflow,
  share_links,
  upload_workflow,
} from "./pages/myFiles";
import { setup_browser } from "./testUtils";

export const storageStatePath = path.resolve(
  __dirname,
  "../data/lockboxstate.json"
);
const emptyState = {
  cookies: [],
  origins: [],
};

export type PlaywrightProps = {
  context: BrowserContext;
  page: Page;
};

(async () => {
  test.describe.configure({ mode: "serial", retries: 3 });

  test.afterAll(async () => {
    fs.writeFileSync(storageStatePath, JSON.stringify(emptyState));
  });

  test("Register and log in", async () => {
    const { context, page } = await setup_browser();
    // Go to main page
    await page.goto("http://localhost:5173/send");
    await register_and_login({ context, page });
  });

  test("Restores keys", async () => {
    const { page, context } = await setup_browser();
    // Go to main page
    await page.goto("http://localhost:5173/send/profile");
    await log_out_restore_keys({ page, context });
  });

  test("Share links", async () => {
    const { page, context } = await setup_browser();

    // Go to main page
    await page.goto("http://localhost:5173/send");

    await expect(page).toHaveTitle(/Thunderbird Send/);

    await share_links({ page, context });
  });

  test("Upload workflow", async () => {
    const { page, context } = await setup_browser();

    // Go to main page
    await page.goto("http://localhost:5173/send");

    await expect(page).toHaveTitle(/Thunderbird Send/);

    await upload_workflow({ page, context });
  });

  test("Download workflow", async () => {
    const { page, context } = await setup_browser();

    // Go to main page
    await page.goto("http://localhost:5173/send");

    await expect(page).toHaveTitle(/Thunderbird Send/);

    await download_workflow({ page, context });
  });

  test("Delete files", async () => {
    const { page, context } = await setup_browser();

    // Go to main page
    await page.goto("http://localhost:5173/send");

    await expect(page).toHaveTitle(/Thunderbird Send/);

    await delete_file({ page, context });
  });
})();
