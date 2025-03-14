import { BrowserContext, expect, firefox, Page, test } from "@playwright/test";
import fs, { readFileSync } from "fs";
import path from "path";

const storageStatePath = path.resolve(__dirname, "../data/state.json");
const TIMEOUT = 3_000;

const password = `qghp392784rq3rgqp329r@$`;
const email = `myemail${Date.now()}@tb.pro`;

type Props = {
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
    fs.writeFileSync(
      storageStatePath,
      JSON.stringify({
        cookies: [],
        origins: [],
      })
    );
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

async function upload_workflow({ page }: Props) {
  const profileButton = page.getByRole("link", { name: "My Files" });

  await new Promise((resolve) => setTimeout(resolve, TIMEOUT));

  await profileButton.click();

  // Select folder
  let folder = page.getByTestId("folder-row");
  await folder.click();

  const sharelinkButton = page.getByTestId("create-share-link");
  sharelinkButton.click();

  const createdShareLink = page.getByTestId("link-0");
  expect(await createdShareLink.inputValue()).toContain("/share/");

  // Open folder
  folder = page.getByTestId("folder-row");

  await folder.click();

  // Find upload box
  const dropzoneBox = page.getByTestId("drop-zone");

  expect(await dropzoneBox.textContent({ timeout: TIMEOUT })).toContain(
    "files here to upload"
  );

  await dragAndDropFile(page, "#drop-zone", "/test.txt", "test.txt");

  await page.getByTestId("upload-button").click();

  await page.waitForSelector(`[data-testid="folder-table-row-cell"]`);

  expect(await page.getByTestId("file-count").textContent()).toBe("1");

  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "DELETE"
  );

  // Delete file
  await page.getByTestId("delete-file").click({ force: true });

  // Wait for DELETE request to complete
  await responsePromise;

  expect((await responsePromise).status()).toBe(200);

  expect(await page.getByTestId("file-count").isVisible()).toBeFalsy();

  // Go to the root
  await page.getByTestId("home-button").click();

  await folder.click();
  await folder.click();

  expect(await page.getByTestId("file-count").isVisible()).toBeFalsy();

  page.getByRole("link", { name: "Profile" }).click();

  await page.waitForURL("**/send/profile");

  expect(await page.getByText("Tier: FREE").textContent()).toBe("Tier: FREE");
}

async function register_and_login({ page, context }: Props) {
  const registerButton = await page.getByTestId("register-button");

  await registerButton.click();

  const emailField = await page.getByTestId("email");
  const passwordField = await page.getByTestId("password");
  const confirmPasswordField = await page.getByTestId("confirm-password");

  await emailField.fill(email);
  await passwordField.fill(password);
  await confirmPasswordField.fill(password);

  const submitButton = await page.getByTestId("submit-button");
  await submitButton.click();

  const logOutButton = await page.getByTestId("log-out-button");
  await logOutButton.click();

  page.on("dialog", (dialog) => dialog.accept());

  // log back in
  await emailField.fill(email);
  await passwordField.fill(password);
  const submitLogin = await page.getByTestId("login-submit-button");
  await submitLogin.click();

  const backupKeysButton = await page.getByTestId("encrypt-keys-button");
  await backupKeysButton.click();

  await saveStorage(context);
}

async function setup_browser() {
  const browser = await firefox.launch();

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: storageStatePath,
  });

  const page = await context.newPage();

  return { context, page };
}

const dragAndDropFile = async (
  page: Page,
  selector: string,
  filePath: string,
  fileName: string,
  fileType = ""
) => {
  // print current path
  console.log("current path: ", __dirname);
  const buffer = readFileSync(__dirname + filePath).toString("base64");

  const dataTransfer = await page.evaluateHandle(
    async ({ bufferData, localFileName, localFileType }) => {
      const dt = new DataTransfer();

      const blobData = await fetch(bufferData).then((res) => res.blob());

      const file = new File([blobData], localFileName, { type: localFileType });
      dt.items.add(file);
      return dt;
    },
    {
      bufferData: `data:application/octet-stream;base64,${buffer}`,
      localFileName: fileName,
      localFileType: fileType,
    }
  );

  await page.dispatchEvent(selector, "drop", { dataTransfer });
};

async function saveStorage(context: BrowserContext) {
  await context.storageState({
    path: `./data/state.json`,
  });
}
