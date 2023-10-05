console.log('hello from the extension');

function receiveFileLinkDetails() {
  return {
    url: 'https://fakeaddress.com',
    aborted: false,
  };
}

browser.cloudFile.onFileUpload.addListener(
  async (account, { id, name, data }) => {
    console.log(`🐈 here are account, id, name, and data`);
    console.log(account);
    console.log(id);
    console.log(name);
    console.log(data);
    console.log('------------------------');

    // for my next trick, I'll open the extension as a popup
    const window = await browser.windows.create({
      url: browser.runtime.getURL('index.extension.html'),
      type: 'popup',
      // Should not be needed: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/create#parameters
      allowScriptsToClose: true,
    });

    return new Promise((resolve, reject) => {
      // Listen for initial message
      browser.runtime.onMessage.addListener(async (message, sender) => {
        console.log(`sending message from background.js to Popup`);
        const { type } = message;
        console.log(`background.js saw message of type ${type}`);
        switch (type) {
          case 'EXTENSION_READY':
            console.log(`extension is ready, sending the file info`);
            browser.runtime.sendMessage({
              id,
              name,
              data,
            });
            break;
          case 'UPLOAD_COMPLETE':
            console.log(`need to resolve a promise here...`);
            resolve({
              url: 'https://fake.com',
              aborted: false,
            });
            break;
          default:
            console.log(`did not recognize type`);
            break;
        }
      });
    });
  }
);
