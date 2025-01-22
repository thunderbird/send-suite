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

  await page.goto("http://localhost:5173/send");

  const loginPromptTImeout = setTimeout(() => {
    console.log(`
👀 👀 👀 👀 👀 
🙀
Log into Moz Account and click 'My Files' when you're done
🙀
👀 👀 👀 👀 👀 
`);
  }, 5_000);

  await page.waitForSelector("h2");

  clearTimeout(loginPromptTImeout);

  return { context, page };
}

test("App loads", async () => {
  const { context, page } = await setup();

  // Check that the app opens on my files
  const loginButton = page.getByTestId("login-button");
  expect(loginButton).toBeVisible();

  const profileButton = page.getByRole("link", { name: "Profile" });
  await profileButton.click();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Thunderbird Send/);

  // Check that we're on the profile page

  console.log("saving context");

  await context.storageState({
    path: `./data/lockbox${new Date().toISOString().toString()}.json`,
  });
});
