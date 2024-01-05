console.log('hello from the extension!', new Date().getTime());
// ==============================================
// GLOBALS
// which have been copied over from other files.
const SERVER = `server`;
const DEBUG = true;

// ==============================================
// Account initialization
(async () => {
  const allAccounts = await browser.cloudFile.getAllAccounts();
  for (let { id } of allAccounts) {
    console.log(id);
    if (await checkAccountStorage(id)) {
      setAccountConfigured(id);
    }
  }
})();

async function checkAccountStorage(accountId) {
  const accountInfo = await browser.storage.local.get([accountId]);
  return accountInfo[accountId] && SERVER in accountInfo[accountId];
}

function setAccountConfigured(accountId) {
  try {
    browser.cloudFile.updateAccount(accountId, {
      configured: true,
    });
    console.log(`Set ${accountId} as configured:true`);
  } catch (e) {
    console.log(`setAccountConfigured: You're probably running this outside of Thundebird`);
  }
}

// ==============================================

// ==============================================
// Handle cloudFile attachments
browser.cloudFile.onFileUpload.addListener(async (account, { id, name, data }) => {
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
});

function createMessageHandler(account, id, name, data) {
  return new Promise((resolve, reject) => {
    async function handleMessage(message, sender) {
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

// ==============================================
// Handle composeAction
// (flow for browsing Lockbox and inserting link into email)
async function insertLink(tab, href = 'https://some.share.link/hash-goes-here', text = 'file-name-goes-here.md') {
  // Get the existing message.
  let details = await browser.compose.getComposeDetails(tab.id);
  console.log(details);

  if (details.isPlainText) {
    // The message is being composed in plain text mode.
    let body = details.plainTextBody;
    console.log(body);

    // Make direct modifications to the message text, and send it back to the editor.
    // body += "\n\nSent from my Thunderbird";
    body += '\n\n' + href;
    console.log(body);
    browser.compose.setComposeDetails(tab.id, { plainTextBody: body });
  } else {
    // The message is being composed in HTML mode. Parse the message into an HTML document.
    let document = new DOMParser().parseFromString(details.body, 'text/html');
    console.log(document);

    // Use normal DOM manipulation to modify the message.
    let link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    document.body.appendChild(link);
    document.body.appendChild(document.createElement('br'));

    // Serialize the document back to HTML, and send it back to the editor.
    let html = new XMLSerializer().serializeToString(document);
    console.log(html);
    browser.compose.setComposeDetails(tab.id, { body: html });
  }
}
// async function handleComposeActionMessage(message, sender) {
//   const { type, fileId } = message;
//   switch (type) {
//     case 'FILE_SELECTED':
//       console.log(`🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`);
//       console.log(type);
//       console.log(fileId);
//       break;
//     default:
//       break;
//   }
// }

// browser.composeAction.onClicked.addListener(async (tab) => {
//   // onFileUpload needs a promise.
//   // would I benefit from one here?
//   browser.runtime.onMessage.addListener(async (message, sender) => {
//     const { type, url } = message;
//     switch (type) {
//       case 'SELECTION_COMPLETE':
//         console.log(type);
//         console.log(url);

//         // might need to do all my encryption and whatnot from...
//         // another component.
//         // Can Share do the thing?
//         // Right now, it can share a single item
//         // theoretically, it can share multiple
//         // but also, it's made for rendering

//         insertLink(tab, url, 'download from lockbox');
//         break;
//       default:
//         break;
//     }
//   });
//   console.log(`Added the composeAction listener`);

//   console.log(`Opening the Lockbox UI in a popup`);
//   // insertLink(tab);
//   const popup = await browser.windows.create({
//     url: browser.runtime.getURL('index.extension.html'),
//     type: 'popup',
//     allowScriptsToClose: true,
//   });
// });

// ==============================================
