import storage from "./storage";

async function download(req, res, next) {
  const id = req.params.id;
  try {
    const metadata = await storage.metadata(id);
    const { nonce, pwd } = metadata;

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
}

export default {
  download,
};
