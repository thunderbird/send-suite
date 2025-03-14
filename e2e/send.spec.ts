import { BrowserContext, expect, Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
  register_and_login,
  setup_browser,
  upload_workflow,
} from "./testUtils";

export const storageStatePath = path.resolve(__dirname, "../data/state.json");
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
  test.beforeAll(async () => {
    const { context, page } = await setup_browser();
    // Go to main page
    await page.goto("http://localhost:5173/send");
    await register_and_login({ context, page });
  });

  test.afterAll(async () => {
    fs.writeFileSync(storageStatePath, JSON.stringify(emptyState));
  });

  test.beforeEach(async () => {
    await setup_browser();
  });

  test("Renders files page", async () => {
    const { page } = await setup_browser();

    await page.goto("https://localhost:8088");
    expect(await page.content()).toContain("echo");

    // Go to main page
    await page.goto("http://localhost:5173/send");

    expect(
      await page.getByRole("heading", { name: "Your Files" }).textContent()
    ).toBe("Your Files");
  });

  test("Upload workflow", async () => {
    const { page, context } = await setup_browser();

    // Go to main page
    await page.goto("http://localhost:5173/send");

    await expect(page).toHaveTitle(/Thunderbird Send/);

    await upload_workflow({ page, context });
  });
})();
