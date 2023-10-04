console.log('hello from the extension');

browser.cloudFile.onFileUpload.addListener(
  async (account, { id, name, data }) => {
    console.log(`🐈 here are account, id, name, and data`);
    console.log(account);
    console.log(id);
    console.log(name);
    console.log(data);
    console.log('------------------------');

    const window = await browser.windows.create({
      url: browser.runtime.getURL('index.extension.html'),
      type: 'popup',
      // Should not be needed: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/create#parameters
      allowScriptsToClose: true,
    });
    console.log(window);
    // for my next trick, I'll open the extension as a popup
    return {
      url: 'https://fakeaddress.comi&thing=' + password.value,
      aborted: false,
    };
  }
);
