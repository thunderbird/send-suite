import { Page } from "@playwright/test";

export const fileLocators = (page: Page) => {
  const folderRowSelector = `[data-testid="folder-row"]`;
  const folderRowTestID = "folder-row";
  const linkWithPasswordID = "link-with-password";

  const createdShareLinkWithPassword = page.getByTestId("access-link-item-1");
  const sharelinkButton = page.getByTestId("create-share-link");
  const createdShareLink = page.getByTestId("access-link-item-0");
  const passwordInput = page.getByTestId("password-input");
  const firstLink = createdShareLink.getByTestId("link-0");
  const uploadButton = page.getByTestId("upload-button");
  const downloadButton = page.getByTestId("download-button-0");
  const confirmDownload = page.getByTestId("confirm-download");
  return {
    folderRowSelector,
    folderRowTestID,
    createdShareLinkWithPassword,
    sharelinkButton,
    createdShareLink,
    passwordInput,
    firstLink,
    linkWithPasswordID,
    uploadButton,
    downloadButton,
    confirmDownload,
  };
};

export const dashboardLocators = (page: Page) => {
  const registerButton = page.getByTestId("register-button");
  const emailField = page.getByTestId("email");
  const passwordField = page.getByTestId("password");
  const confirmPasswordField = page.getByTestId("confirm-password");
  const submitButton = page.getByTestId("submit-button");
  const logOutButton = page.getByTestId("log-out-button");
  const submitLogin = page.getByTestId("login-submit-button");
  const backupKeysButton = page.getByTestId("encrypt-keys-button");
  return {
    registerButton,
    emailField,
    passwordField,
    confirmPasswordField,
    submitButton,
    logOutButton,
    submitLogin,
    backupKeysButton,
  };
};
