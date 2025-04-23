import { expect } from "@playwright/test";
import { fileLocators } from "../locators";
import { PlaywrightProps } from "../send.spec";
import {
  create_incognito_context,
  downloadFirstFile,
  dragAndDropFile,
  playwrightConfig,
  saveClipboardItem,
} from "../testUtils";

const { password, timeout, shareLinks } = playwrightConfig;

export async function upload_workflow({ page }: PlaywrightProps) {
  const {
    folderRowSelector,
    folderRowTestID,
    fileCountID,
    uploadButton,
    dropZone,
    tableCellID,
  } = fileLocators(page);

  const profileButton = page.getByRole("link", { name: "My Files" });
  await page.waitForSelector(folderRowSelector);
  await profileButton.click();

  // Select folder
  let folder = page.getByTestId(folderRowTestID);
  await folder.click();

  // Open folder page
  folder = page.getByTestId(folderRowTestID);
  await folder.click();

  // Find upload box and upload the file
  expect(await dropZone.textContent({ timeout })).toContain(
    "files here to upload"
  );
  await dragAndDropFile(page, "#drop-zone", "/test.txt", "test.txt");
  await uploadButton.click();
  await page.waitForSelector(tableCellID);

  // Check if the file count has updated
  expect(await page.getByTestId(fileCountID).textContent()).toBe("1");
}

export async function share_links({ page }: PlaywrightProps) {
  const {
    folderRowSelector,
    folderRowTestID,
    createdShareLinkWithPassword,
    sharelinkButton,
    linkWithPasswordID,
    passwordInput,
    firstLink,
  } = fileLocators(page);

  const profileButton = page.getByRole("link", { name: "My Files" });
  await page.waitForSelector(folderRowSelector);
  await profileButton.click();

  // Select folder
  let folder = page.getByTestId(folderRowTestID);
  await folder.click();

  let linksResponse = page.waitForResponse((response) =>
    response.request().url().includes("/links")
  );

  // Create share link without password
  await sharelinkButton.click();
  await linksResponse;
  await page.waitForLoadState("networkidle");

  expect(await firstLink.inputValue()).toContain("/share/");
  await saveClipboardItem(page);

  linksResponse = page.waitForResponse((response) =>
    response.request().url().includes("/links")
  );

  // Create share link with password
  await passwordInput.fill(password);
  await sharelinkButton.click();
  await linksResponse;
  await page.waitForLoadState("networkidle");
  await saveClipboardItem(page);

  // Wait for the password badge to be visible and check its content
  await createdShareLinkWithPassword.waitFor({ state: "visible" });
  const passwordBadge =
    createdShareLinkWithPassword.getByTestId(linkWithPasswordID);
  await passwordBadge.waitFor({ state: "visible" });
  expect(await passwordBadge.textContent()).toContain("Password");
}

export async function download_workflow({ page, context }: PlaywrightProps) {
  const { submitButtonID, passwordInputID } = fileLocators(page);

  // Store URLs before using them
  const [regularUrl, passwordUrl] = [shareLinks[0], shareLinks[1]];

  // Regular window downloads
  let otherPage = await context.newPage();
  await otherPage.goto(regularUrl);
  await downloadFirstFile(otherPage);
  await otherPage.close();

  otherPage = await context.newPage();
  await otherPage.goto(passwordUrl);
  await otherPage.getByTestId(passwordInputID).fill(password);
  await otherPage.getByTestId(submitButtonID).click();
  await downloadFirstFile(otherPage);
  await otherPage.close();

  // Incognito window downloads
  const browser = context.browser();
  if (!browser) {
    throw new Error("Browser context is not available");
  }

  try {
    // Create a new incognito context
    const incognitoContext = await create_incognito_context(browser);

    // Test downloads in incognito context
    otherPage = await incognitoContext.newPage();
    await otherPage.goto(regularUrl);
    await otherPage.waitForLoadState("networkidle");
    await downloadFirstFile(otherPage);
    await otherPage.close();

    otherPage = await incognitoContext.newPage();
    await otherPage.goto(passwordUrl);
    await otherPage.waitForLoadState("networkidle");
    await otherPage.getByTestId(passwordInputID).fill(password);
    await otherPage.getByTestId(submitButtonID).click();
    await otherPage.waitForLoadState("networkidle");
    await downloadFirstFile(otherPage);
    await otherPage.close();

    await incognitoContext.close();
  } catch (error) {
    console.error("Error in incognito testing:", error);
    throw error;
  }
}

export async function delete_file({ page }: PlaywrightProps) {
  const { folderRowTestID, fileCountID, deleteFileButton, homeButton } =
    fileLocators(page);

  let folder = page.getByTestId(folderRowTestID);

  // Select folder
  await folder.click();
  // Open folder
  await folder.click();

  // Delete file
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "DELETE"
  );
  await deleteFileButton.click({ force: true });

  // Wait for DELETE request to complete
  await responsePromise;

  expect((await responsePromise).status()).toBe(200);
  expect(await page.getByTestId(fileCountID).isVisible()).toBeFalsy();

  // Go to the root
  await homeButton.click();

  await folder.click();
  await folder.click();

  expect(await page.getByTestId(fileCountID).isVisible()).toBeFalsy();

  page.getByRole("link", { name: "Profile" }).click();

  await page.waitForURL("**/send/profile");

  expect(await page.getByText("Recovery Key").textContent()).toBe(
    "Recovery Key"
  );
}
