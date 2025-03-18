import { PlaywrightProps } from "../send.spec";
import { playwrightConfig, saveStorage } from "../testUtils";

const { email, password } = playwrightConfig;

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
