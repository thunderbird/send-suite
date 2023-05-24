const DEBUG = true;
const SERVER = `server`;
const TOKEN = `oauth_token`;
let input = document.querySelector(`input[name="${SERVER}"]`);
let submitBtn = document.querySelector(`button[type="submit"]`);

// This specifies the id of the provider chosen in the
// "Composition > Attachments" window.
// This is necessary only for the management page.
let accountId = new URL(location.href).searchParams.get("accountId");

function setAccountConfigured(accountId) {
  browser.cloudFile.updateAccount(accountId, {
    configured: true,
  });
}

// Initialize the settings
browser.storage.local.get([accountId]).then((accountInfo) => {
  if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
    input.value = accountInfo[accountId][SERVER];
    setAccountConfigured(accountId);
  }
});

submitBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  input.disabled = true;
  submitBtn.disabled = true;

  await browser.storage.local
    .set({
      [accountId]: {
        [SERVER]: input.value,
      },
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      console.log("enabling input and submitBtn");
      input.disabled = false;
      submitBtn.disabled = false;
      setAccountConfigured(accountId);
      DEBUG &&
        browser.storage.local.get([accountId]).then((accountInfo) => {
          if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
            const isSame = input.value == accountInfo[accountId][SERVER];
            console.log(
              `Saved is same as current?? e.g., did we update? ${isSame}`
            );
          } else {
            console.log(`You probably need to wait longer`);
          }
        });
    });
});
