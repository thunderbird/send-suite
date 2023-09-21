console.log('hello from the extension');

async function init() {
  const fname = `${new Date().getTime()}.txt`;
  const data = crypto.randomUUID();
  console.log(`> can write a file`);
  await browser.FileSystem.writeFile(fname, data);
  console.log(`\t✅`);
  console.log(`> can read a file`);
  let dataFromFile = await browser.FileSystem.readFile(fname);
  if (dataFromFile === data) {
    console.log(`\t✅`);
  }

  console.log(`> can stat a file`);
  await browser.FileSystem.stat(fname);
  // const fileInfo = await browser.FileSystem.stat(fname);
  // console.log(fileInfo);
  /*
    lastAccessed: 1695236432682
    ​
    lastModified: 1695236432677
    ​
    path: "/home/chris_aquino/.thunderbird/44m3sls4.default-beta/tb-lockbox/lockbox@services.thunderbird.net/1695236432669.txt"
    ​
    permissions: 420
    ​
    size: 14
    ​
    type: "regular"
  */

  console.log(`> can list the root dir`);
  const contents = await browser.FileSystem.listContents('/');
  if (Array.isArray(contents)) {
    console.log(`\t✅`);
  }
  // for (let f of contents) {
  //   console.log(f);
  // }
}
init();
