import { BrowserContext, expect, firefox, Page } from "@playwright/test";
import { readFileSync } from "fs";
import { PlaywrightProps, storageStatePath } from "./send.spec";

const TIMEOUT = 3_000;
const password = `qghp392784rq3rgqp329r@$`;
const email = `myemail${Date.now()}@tb.pro`;

const shareLinks: string[] = [];

async function downloadFirstFile(page: Page) {
  await page.getByTestId("download-button-0").click();
  await page.getByTestId("confirm-download").click();
  await page.waitForEvent("download");
  page.on("download", async (download) => {
    expect(download.suggestedFilename()).toBe("test.txt");
  });
}

async function saveClipboardItem(page: Page) {
  const handle = await page.evaluateHandle(() =>
    navigator.clipboard.readText()
  );
  const clipboardContent = await handle.jsonValue();
  shareLinks.push(clipboardContent);
}

export async function upload_workflow({ page, context }: PlaywrightProps) {
  const profileButton = page.getByRole("link", { name: "My Files" });

  await new Promise((resolve) => setTimeout(resolve, TIMEOUT));

  await profileButton.click();

  // Select folder
  let folder = page.getByTestId("folder-row");
  await folder.click();

  // Create share link without password
  const sharelinkButton = page.getByTestId("create-share-link");
  await sharelinkButton.click();

  // Check if share link with password is created
  const createdShareLink = page.getByTestId("access-link-item-0");
  expect(await createdShareLink.getByTestId("link-0").inputValue()).toContain(
    "/share/"
  );

  await saveClipboardItem(page);

  // Create share link with password
  await page.getByTestId("password-input").fill(password);
  await sharelinkButton.click();

  // Wait for the share link to populate the clipboard
  await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
  await saveClipboardItem(page);

  const createdShareLinkWithPassword = page.getByTestId("access-link-item-1");
  expect(
    await createdShareLinkWithPassword
      .getByTestId("link-with-password")
      .textContent()
  ).toContain("Password");

  // Open folder page
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

  // Download file without password
  let otherPage = await context.newPage();
  await otherPage.goto(shareLinks.shift()!);
  await downloadFirstFile(otherPage);
  await otherPage.close();

  // Download file with password
  otherPage = await context.newPage();
  await otherPage.goto(shareLinks.shift()!);
  await otherPage.getByTestId("password-input").fill(password);
  await otherPage.getByTestId("submit-button").click();
  await downloadFirstFile(otherPage);
  await otherPage.close();

  // Delete file
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "DELETE"
  );
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

  expect(await page.getByText("Recovery Key").textContent()).toBe(
    "Recovery Key"
  );
}

export async function register_and_login({ page, context }: PlaywrightProps) {
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

export async function setup_browser() {
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

export async function saveStorage(context: BrowserContext) {
  await context.storageState({
    path: `./data/lockboxstate.json`,
  });
}
