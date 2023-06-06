import assert from "assert";
import crypto from "crypto";
import storage from "../storage";
// import config from "../config";
// import fxa from "../fxa";

export default {
  hmac: async function (req, res, next) {
    const id = req.params.id;
    console.log(
      `🚀 ${new Date().getTime()}  auth.js: hmac - Reading the Authorization from header`
    );
    const authHeader = req.header("Authorization");
    if (id && authHeader) {
      try {
        const auth = authHeader.split(" ")[1];
        const meta = await storage.metadata(id);
        if (!meta) {
          return res.sendStatus(404);
        }
        const hmac = crypto.createHmac(
          "sha256",
          Buffer.from(meta.auth, "base64")
        );
        hmac.update(Buffer.from(meta.nonce, "base64"));
        const verifyHash = hmac.digest();
        if (crypto.timingSafeEqual(verifyHash, Buffer.from(auth, "base64"))) {
          req.nonce = crypto.randomBytes(16).toString("base64");
          await storage.setField(id, "nonce", req.nonce);
          console.log(
            `🚀 ${new Date().getTime()}  auth.js: hmac - (passed timingSafeEqual challenge) Setting the nonce in WWW-Authenticate header`
          );
          res.set("WWW-Authenticate", `send-v1 ${req.nonce}`);
          req.authorized = true;
          req.meta = meta;
        } else {
          console.log(
            `🚀 ${new Date().getTime()}  auth.js: hmac - (failed timingSafeEqual challenge) Setting the nonce in WWW-Authenticate header`
          );
          res.set("WWW-Authenticate", `send-v1 ${meta.nonce}`);
          req.authorized = false;
        }
      } catch (e) {
        req.authorized = false;
      }
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  owner: async function (req, res, next) {
    const id = req.params.id;
    const ownerToken = req.body.owner_token;
    if (id && ownerToken) {
      try {
        req.meta = await storage.metadata(id);
        if (!req.meta) {
          return res.sendStatus(404);
        }
        const metaOwner = Buffer.from(req.meta.owner, "utf8");
        const owner = Buffer.from(ownerToken, "utf8");
        assert(metaOwner.length > 0);
        assert(metaOwner.length === owner.length);
        req.authorized = crypto.timingSafeEqual(metaOwner, owner);
      } catch (e) {
        req.authorized = false;
      }
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  //   fxa: async function (req, res, next) {
  //     console.log(
  //       `🚀 ${new Date().getTime()}  auth.js: fxa - Reading the Authorization from header`
  //     );

  //     const authHeader = req.header("Authorization");
  //     if (authHeader && /^Bearer\s/i.test(authHeader)) {
  //       const token = authHeader.split(" ")[1];
  //       req.user = await fxa.verify(token);
  //     }

  //     if (config.fxa_required && !req.user) {
  //       res.sendStatus(401);
  //     } else {
  //       next();
  //     }
  //   },
};
