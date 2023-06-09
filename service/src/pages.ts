import storage from "./storage";

async function download(req, res, next) {
  const id = req.params.id;
  const isAjaxRequest = req.headers["x-requested-with"] === "XMLHttpRequest";
  const metadata = await storage.metadata(id);
  const { nonce, pwd } = metadata;

  console.log(`
  🤡 hey... is this what you wanted?
  ${nonce}
  `);

  if (isAjaxRequest) {
    try {
      console.log(
        `🚀 ${new Date().getTime()}  pages.js: download - Setting the nonce in WWW-Authenticate header`
      );
      res.set("WWW-Authenticate", `send-v1 ${nonce}`);

      res.status(200).json({
        metadata: {
          nonce,
          pwd,
        },
      });
    } catch (e) {
      next();
    }
  } else {
    res.status(200).redirect(`/index.service-page.html?id=${id}`);
  }
}

export default {
  download,
};
