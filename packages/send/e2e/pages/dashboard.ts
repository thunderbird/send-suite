import { dashboardLocators, fileLocators } from "../locators";
import { PlaywrightProps } from "../send.spec";
import { playwrightConfig, saveStorage, setup_browser } from "../testUtils";

const { email, password, shareLinks } = playwrightConfig;

export async function register_and_login({ page, context }: PlaywrightProps) {
  const {
    registerButton,
    emailField,
    passwordField,
    confirmPasswordField,
    submitButton,
    backupKeysButton,
    passphraseInput,
  } = dashboardLocators(page);

  const { folderRowSelector, folderRowTestID } = fileLocators(page);

  await registerButton.click();

  await emailField.fill(email);
  await passwordField.fill(password);
  await confirmPasswordField.fill(password);
  await submitButton.click();

  page.on("dialog", (dialog) => dialog.accept());

  const passPhrase = await passphraseInput.inputValue();
  if (!passPhrase) throw new Error("Passphrase not found");
  shareLinks.push(passPhrase!);

  await backupKeysButton.click();

  // look for folder
  const profileButton = page.getByRole("link", { name: "My Files" });
  await profileButton.click();

  // Check that default folder exists
  await page.waitForSelector(folderRowSelector);
  let folder = page.getByTestId(folderRowTestID);
  await folder.click();

  await saveStorage(context);
}

export async function log_out_restore_keys({ page }: PlaywrightProps) {
  const {
    emailField,
    passwordField,
    logOutButton,
    submitLogin,
    restoreKeysButton,
    restorekeyInput,
  } = dashboardLocators(page);
  const { folderRowSelector, folderRowTestID } = fileLocators(page);

  await logOutButton.click();

  const { page: secondPage } = await setup_browser();

  // log back in
  await emailField.fill(email);
  await passwordField.fill(password);
  await submitLogin.click();

  // restore keys
  secondPage.on("dialog", (dialog) => dialog.accept());
  const passphrase = shareLinks.shift();
  await secondPage.goto("/send/profile");
  await restorekeyInput.fill(passphrase!);
  await restoreKeysButton.click();

  // look for folder (only shows when keys are restored)
  await secondPage.goto("/send");

  // Check that default folder exists
  await secondPage.waitForSelector(folderRowSelector);
  let folder = secondPage.getByTestId(folderRowTestID);
  await folder.click();
}
