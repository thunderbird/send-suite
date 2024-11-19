/// <reference types="thunderbird-webext-browser" />

console.log('hello from the extension!', new Date().getTime());

// ==============================================
// Account initialization
(async () => {
  const allAccounts = await browser.cloudFile.getAllAccounts();
  for (let { id } of allAccounts) {
    console.log(`found an account with id ${id}`);
    setAccountConfigured(id);
  }
})();

function setAccountConfigured(accountId) {
  try {
    browser.cloudFile.updateAccount(accountId, {
      configured: true,
    });
    console.log(`Set ${accountId} as configured:true`);
  } catch (e) {
    console.log(
      `setAccountConfigured: You're probably running this outside of Thundebird`
    );
  }
}
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    let requestHeaders = details.requestHeaders;
    // Remove the Origin header from requests to backblazeb2
    const hostName = requestHeaders.find(
      (header) => header.name.toLowerCase() === 'host'
    ).value;

    // Filter out the Origin header
    requestHeaders = requestHeaders.filter(
      (header) => header.name.toLowerCase() !== 'origin'
    );

    console.log(`altered a request for host ${hostName}`, requestHeaders);
    return { requestHeaders };
  },
  { urls: ['https://*.backblazeb2.com/*'] },
  ['blocking', 'requestHeaders']
);

console.log('webRequest listeners have been set up.');

// ==============================================

// ==============================================
// Handle cloudFile attachments
browser.cloudFile.onFileUpload.addListener(
  async (account, { id, name, data }) => {
    console.log(`🐈 here are account, id, name, and data`);
    console.log(account);
    console.log(id);
    console.log(name);
    console.log(data);
    console.log('------------------------');

    await browser.windows.create({
      url: browser.runtime.getURL('index.extension.html'),
      type: 'popup',
      allowScriptsToClose: true,
    });

    return createMessageHandler(account, id, name, data);
  }
);

function createMessageHandler(account, id, name, data) {
  return new Promise((resolve, reject) => {
    async function handleMessage(message) {
      const { type, url, aborted } = message;

      switch (type) {
        case 'EXTENSION_READY':
          console.log(`extension is ready, sending the file info`);
          browser.runtime.sendMessage({
            id,
            name,
            data,
          });
          break;
        case 'SHARE_COMPLETE':
          browser.runtime.onMessage.removeListener(handleMessage);
          resolve({
            url,
            aborted,
          });
          break;
        case 'SHARE_ABORTED':
          browser.runtime.onMessage.removeListener(handleMessage);
          // Or do I need to resolve?
          reject({
            url,
            aborted,
          });
          break;
        default:
          browser.runtime.onMessage.removeListener(handleMessage);
          console.log(`did not recognize type`);
          reject();
          break;
      }
    }
    // Listen for initial message
    browser.runtime.onMessage.addListener(handleMessage);
  });
}
