import { expect } from "@playwright/test";
import { PlaywrightProps } from "../send.spec";
import {
  downloadFirstFile,
  dragAndDropFile,
  playwrightConfig,
  saveClipboardItem,
} from "../testUtils";

const { email, password, timeout, shareLinks } = playwrightConfig;

export async function upload_workflow({ page, context }: PlaywrightProps) {
  const profileButton = page.getByRole("link", { name: "My Files" });
  await page.waitForSelector(`[data-testid="folder-row"]`);

  await profileButton.click({ delay: 1000 });

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

  const linkPromise = page.waitForResponse((response) =>
    response.request().url().includes("/links")
  );

  await linkPromise;
  await linkPromise;

  // Wait for the share link to populate the clipboard
  await new Promise((resolve) => setTimeout(resolve, timeout));
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

  expect(await dropzoneBox.textContent({ timeout })).toContain(
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
