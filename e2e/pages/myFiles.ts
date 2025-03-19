import { expect } from "@playwright/test";
import { fileLocators } from "../locators";
import { PlaywrightProps } from "../send.spec";
import {
  downloadFirstFile,
  dragAndDropFile,
  playwrightConfig,
  saveClipboardItem,
} from "../testUtils";

const { email, password, timeout, shareLinks } = playwrightConfig;

export async function upload_workflow({ page, context }: PlaywrightProps) {
  const {
    folderRowSelector,
    folderRowTestID,
    createdShareLinkWithPassword,
    sharelinkButton,
    createdShareLink,
    fileCountID,
    linkWithPasswordID,
    passwordInput,
    firstLink,
    uploadButton,
    submitButtonID,
    passwordInputID,
    deleteFileButton,
    homeButton,
    dropZone,
    tableCellID,
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

  expect(await firstLink.inputValue()).toContain("/share/");
  await saveClipboardItem(page);

  linksResponse = page.waitForResponse((response) =>
    response.request().url().includes("/links")
  );

  // Create share link with password
  await passwordInput.fill(password);
  await sharelinkButton.click();
  await linksResponse;
  await saveClipboardItem(page);

  // Check that the password badge renders properly
  expect(
    await createdShareLinkWithPassword
      .getByTestId(linkWithPasswordID)
      .textContent()
  ).toContain("Password");

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

  // Download file without password
  let otherPage = await context.newPage();
  await otherPage.goto(shareLinks.shift()!);
  await downloadFirstFile(otherPage);
  await otherPage.close();

  // Download file with password
  otherPage = await context.newPage();
  await otherPage.goto(shareLinks.shift()!);
  await otherPage.getByTestId(passwordInputID).fill(password);
  await otherPage.getByTestId(submitButtonID).click();
  await downloadFirstFile(otherPage);
  await otherPage.close();

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
