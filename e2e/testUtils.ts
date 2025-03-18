import { BrowserContext, expect, firefox, Page } from "@playwright/test";
import { readFileSync } from "fs";
import { storageStatePath } from "./send.spec";

export const playwrightConfig = {
  password: `qghp392784rq3rgqp329r@$`,
  email: `myemail${Date.now()}@tb.pro`,
  timeout: 3_000,
  shareLinks: [] as string[],
};

export async function downloadFirstFile(page: Page) {
  await page.getByTestId("download-button-0").click();
  await page.getByTestId("confirm-download").click();
  await page.waitForEvent("download");
  page.on("download", async (download) => {
    expect(download.suggestedFilename()).toBe("test.txt");
  });
}

export async function saveClipboardItem(page: Page) {
  const handle = await page.evaluateHandle(() =>
    navigator.clipboard.readText()
  );
  const clipboardContent = await handle.jsonValue();
  playwrightConfig.shareLinks.push(clipboardContent);
}

export async function setup_browser() {
  const browser = await firefox.launch();

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: storageStatePath,
  });

  const page = await context.newPage();

  return { context, page };
}

export const dragAndDropFile = async (
  page: Page,
  selector: string,
  filePath: string,
  fileName: string,
  fileType = ""
) => {
  // print current path
  console.log("current path: ", __dirname);
  const buffer = readFileSync(__dirname + filePath).toString("base64");

  const dataTransfer = await page.evaluateHandle(
    async ({ bufferData, localFileName, localFileType }) => {
      const dt = new DataTransfer();

      const blobData = await fetch(bufferData).then((res) => res.blob());

      const file = new File([blobData], localFileName, { type: localFileType });
      dt.items.add(file);
      return dt;
    },
    {
      bufferData: `data:application/octet-stream;base64,${buffer}`,
      localFileName: fileName,
      localFileType: fileType,
    }
  );

  await page.dispatchEvent(selector, "drop", { dataTransfer });
};

export async function saveStorage(context: BrowserContext) {
  await context.storageState({
    path: `./data/lockboxstate.json`,
  });
}
