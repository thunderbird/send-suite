import { Page } from "@playwright/test";

export const fileLocators = (page: Page) => {
  const folderRowSelector = `[data-testid="folder-row"]`;
  const folderRowTestID = "folder-row";
  const linkWithPasswordID = "link-with-password";
  const fileCountID = "file-count";
  const passwordInputID = "password-input";
  const submitButtonID = "submit-button";
  const tableCellID = `[data-testid="folder-table-row-cell"]`;

  const createdShareLinkWithPassword = page.getByTestId("access-link-item-1");
  const sharelinkButton = page.getByTestId("create-share-link");
  const submitButton = page.getByTestId(submitButtonID);
  const createdShareLink = page.getByTestId("access-link-item-0");
  const passwordInput = page.getByTestId(passwordInputID);
  const firstLink = createdShareLink.getByTestId("link-0");
  const uploadButton = page.getByTestId("upload-button");
  const downloadButton = page.getByTestId("download-button-0");
  const confirmDownload = page.getByTestId("confirm-download");
  const deleteFileButton = page.getByTestId("delete-file");
  const homeButton = page.getByTestId("home-button");
  const dropZone = page.getByTestId("drop-zone");
  return {
    folderRowSelector,
    folderRowTestID,
    createdShareLinkWithPassword,
    sharelinkButton,
    createdShareLink,
    passwordInput,
    passwordInputID,
    firstLink,
    deleteFileButton,
    submitButton,
    submitButtonID,
    linkWithPasswordID,
    uploadButton,
    downloadButton,
    tableCellID,
    confirmDownload,
    fileCountID,
    homeButton,
    dropZone,
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
  const restoreKeysButton = page.getByTestId("restore-keys-button");
  const passphraseInput = page.getByTestId("passphrase-input");
  const restorekeyInput = page.getByTestId("restore-key-input");
  return {
    registerButton,
    emailField,
    passwordField,
    confirmPasswordField,
    submitButton,
    logOutButton,
    submitLogin,
    backupKeysButton,
    restoreKeysButton,
    passphraseInput,
    restorekeyInput,
  };
};
