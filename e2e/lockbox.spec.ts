import { expect, firefox, test } from "@playwright/test";
import path from "path";

const storageStatePath = path.resolve(__dirname, "../data/lockboxstate.json");

console.log(storageStatePath);

async function setup() {
  const browser = await firefox.launch();

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: storageStatePath,
  });

  const page = await context.newPage();

  // Check that local cert is trusted
  await page.goto("https://localhost:8088");
  expect(await page.content()).toContain("echo");

  return { context, page };
}

test("App loads", async () => {
  const { context, page } = await setup();

  await page.goto("http://localhost:5173/lockbox");

  await page.waitForSelector("h2");

  // Check that the app opens on my files
  const homeIcon = page.getByText("🏠");
  expect(homeIcon).toBeVisible();

  const profileButton = page.getByRole("link", { name: "Profile" });
  await profileButton.click();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Send alpha2/);

  // Check that we're on the profile page
  const loginButton = page.getByText("Log into Moz Acct");
  expect(loginButton).toBeVisible();

  console.log("saving context");

  await context.storageState({
    path: `./data/lockbox${new Date().toISOString().toString()}.json`,
  });
});
