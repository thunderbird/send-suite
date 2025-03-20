import { dashboardLocators } from "../locators";
import { PlaywrightProps } from "../send.spec";
import { playwrightConfig, saveStorage } from "../testUtils";

const { email, password } = playwrightConfig;

export async function register_and_login({ page, context }: PlaywrightProps) {
  const {
    registerButton,
    emailField,
    passwordField,
    confirmPasswordField,
    submitButton,
    logOutButton,
    submitLogin,
    backupKeysButton,
  } = dashboardLocators(page);

  await registerButton.click();

  await emailField.fill(email);
  await passwordField.fill(password);
  await confirmPasswordField.fill(password);
  await submitButton.click();
  await logOutButton.click();

  page.on("dialog", (dialog) => dialog.accept());

  // log back in
  await emailField.fill(email);
  await passwordField.fill(password);
  await submitLogin.click();
  await backupKeysButton.click();

  await saveStorage(context);
}
