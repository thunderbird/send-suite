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

export type PlaywrightProps = {
  context: BrowserContext;
  page: Page;
};

export const storageStatePath = path.resolve(
  __dirname,
  "../data/lockboxstate.json"
);
const emptyState = {
  cookies: [],
  origins: [],
};

// Configure tests to run serially with retries
test.describe.configure({ mode: "serial", retries: 3 });

// Cleanup storage state after all tests
test.afterAll(async () => {
  fs.writeFileSync(storageStatePath, JSON.stringify(emptyState));
});

// Authentication-related tests
const authTests = [
  { title: "Register and log in", path: "/send", action: register_and_login },
  {
    title: "Restores keys",
    path: "/send/profile",
    action: log_out_restore_keys,
  },
];

test.describe("Authentication", () => {
  authTests.forEach(({ title, path, action }) => {
    test(title, async () => {
      const { context, page } = await setup_browser();
      await page.goto(path);
      await action({ context, page });
    });
  });
});

// File workflow tests with shared setup
test.describe("File workflows", () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async () => {
    ({ page, context } = await setup_browser());
    await page.goto("/send");
    await expect(page).toHaveTitle(/Thunderbird Send/);
  });

  const workflows = [
    { title: "Share links", action: share_links },
    { title: "Upload workflow", action: upload_workflow },
    { title: "Download workflow", action: download_workflow },
    { title: "Delete files", action: delete_file },
  ];

  workflows.forEach(({ title, action }) => {
    test(title, async () => await action({ page, context }));
  });
});
