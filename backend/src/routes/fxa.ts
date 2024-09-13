import axios from 'axios';
import { createHash } from 'crypto';
import { Request, Router } from 'express';
import {
  checkAllowList,
  generateState,
  getClient,
  getIssuer,
} from '../auth/client';
import { ENVIRONMENT } from '../config';
import {
  addErrorHandling,
  AUTH_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';
import logger from '../logger';
import { findOrCreateUserProfileByMozillaId } from '../models/users';

const FXA_STATE = 'fxa_state';

const router: Router = Router();

// Route for obtaining an authorization URL for Mozilla account.
router.get(
  '/login',
  addErrorHandling(AUTH_ERRORS.LOG_IN_FAILED),
  wrapAsyncHandler(async (req: Request, res) => {
    // Params to include when we request an authorization url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let additionalParams: Record<string, any> = {
      access_type: 'offline',
      action: 'email',
      // email: options.email, // Where should this come from?
    };

    // Set up Metrics Flow
    try {
      const utm_campaign = `${process.env.FXA_ENTRYPOINT}_${ENVIRONMENT}`;
      const utm_source = 'login';

      // Fetch the flowValues before requesting the auth url
      console.log(
        'Evaluating FXA_METRICS_FLOW_URL =>',
        process.env.FXA_METRICS_FLOW_URL
      );
      console.log('Calling metrics for 5s');
      const flow_values = await axios
        .get(process.env.FXA_METRICS_FLOW_URL, {
          timeout: 5000,
          params: {
            entrypoint: process.env.FXA_ENTRYPOINT,
            form_type: 'email',
            utm_campaign,
            utm_source,
          },
        })
        .then((response) => response.data);

      additionalParams = {
        ...additionalParams,
        entrypoint: process.env.FXA_ENTRYPOINT,
        flow_begin_time: flow_values.flowBeginTime,
        flow_id: flow_values.flowId,
        utm_campaign,
        utm_source,
      };
    } catch (err) {
      // Log the error, but continue with OIDC auth
      logger.error(`Could not initialize metrics flow.`);
      logger.error(err);
    }

    console.log('Evaluating FXA_MOZ_ISSUER', process.env.FXA_MOZ_ISSUER);
    console.log('getting moz issuer');
    // Set up client
    const mozIssuer = await getIssuer();
    const client = getClient(mozIssuer);
    const state = generateState();

    // Obtain auth URL
    const url = client.authorizationUrl({
      ...additionalParams,
      scope: 'openid email profile',
      state,
    });

    // First time logins should skip checking the allowlist
    const shouldCheckAllowlist = !!req?.session?.user?.email;

    if (shouldCheckAllowlist) {
      try {
        await checkAllowList(req.session?.user?.email);
      } catch (error) {
        res.status(403).json({
          msg: 'User not in allow list',
        });
        return;
      }
    }

    // Add state code to session.
    // We'll attempt to match this in the callback.
    console.log('evaluating FXA_STATE', state);
    req.session[FXA_STATE] = state;

    // Save session and send the auth url to the front end
    // so they can do the redirect.
    console.log('saving session... last step');
    req.session.save((err) => {
      if (err) {
        logger.error('Could not save session in /login.');
        logger.error(err);
        res.status(500).json(err);
        return;
      }

      /* TODO: We have to replace send for lockbox because fxa isn't enabled for send
      We should remove this and return the actual url once fxa is enabled 
      https://github.com/thunderbird/send-suite/issues/216
       */
      const responseURL = url.replace('send', 'lockbox');

      res.status(200).json({
        url: responseURL,
      });
    });
  })
);

// Mozilla account OIDC callback handler
router.get(
  '/',
  addErrorHandling(AUTH_ERRORS.LOG_IN_FAILED),
  wrapAsyncHandler(async (req, res) => {
    // If provider sends an error, immediately redirect
    // to error page.
    if (req.query.error) {
      return res.redirect('/?error=' + req.query.error);
    }

    // Confirm that we received a state code and compare
    // it to the original we set in `/login`
    const { code, state } = req.query;
    const originalState = req.session[FXA_STATE];

    if (!code || (state as string) !== originalState) {
      res.status(403).json({
        msg: 'Could not authenticate',
      });
      return;
    }

    // Clean up session and continue
    delete req.session[FXA_STATE];
    req.session.save(async (err) => {
      if (err) {
        logger.error('Could not save session in / callback.');
        logger.error(err);
        res.status(500).json(err);
        return;
      }

      const mozIssuer = await getIssuer();
      const client = getClient(mozIssuer);

      // The `params` contains the string equivalents of req.query.*
      // Here, params == { code, state }
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(
        process.env.FXA_REDIRECT_URI,
        params,
        { state: params.state }
      );
      const { access_token: accessToken, refresh_token: refreshToken } =
        tokenSet;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userinfo: Record<string, any> = await client.userinfo(accessToken);

      try {
        await checkAllowList(userinfo.email);
        const { uid, avatar, email } = userinfo;
        const user = await findOrCreateUserProfileByMozillaId(
          uid,
          avatar,
          email,
          accessToken,
          refreshToken
        );

        req.session['user'] = user;
        user.uniqueHash = createHash('sha256').update(uid).digest('hex');

        req.session.save((err) => {
          if (err) {
            logger.error('Could not save session in / callback.');
            logger.error(err);
            throw Error(`Could not save session in fxa callback`);
          }

          res.redirect('/login-success.html');
        });
      } catch (error) {
        res.redirect('/login-failed.html');
      }
    });
  })
);

router.get(
  '/allowlist',
  addErrorHandling(AUTH_ERRORS.ALLOW_LIST_FAILED),
  wrapAsyncHandler(async (req, res) => {
    try {
      await checkAllowList(req.session?.user?.email);
    } catch (error) {
      return res.status(200).json({
        msg: 'No email in session, cannot check allow list',
      });
    }
    return res.status(200).json({
      msg: 'User in allow list',
    });
  })
);

router.get(
  '/logout',
  addErrorHandling(AUTH_ERRORS.LOG_OUT_FAILED),
  wrapAsyncHandler(async (req, res) => {
    /*

Needs to:
- destroy token
- destroy session
- redirect user to login page
- front end is responsible for removing keys from client storage

TODO:
- use access or refresh token from session
- get destroyUrl from issuer
- handle errors
  */

    const destroyUrl = `https://oauth.stage.mozaws.net/v1/destroy`;
    const accessToken = `${req.session?.user?.profile?.accessToken}`;
    if (accessToken) {
      const body = {
        token: accessToken,
        client_id: process.env.FXA_CLIENT_ID,
        client_secret: process.env.FXA_CLIENT_SECRET,
      };
      const { data } = await axios.post(destroyUrl, body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return res.status(200).json({
        data,
      });
    } else {
      return res.redirect('./login');
    }
  })
);

export default router;
// "https://accounts.stage.mozaws.net/authorization?client_id=e26781120ec9677a&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Flockbox.thunderbird.dev%2Flockbox%2Ffxa&access_type=offline&action=email&entrypoint=tblockbox&flow_begin_time=1726077258350&flow_id=6918661adac5978b61e5e400f689147c9ea83e32c7e2c260e93a5a504c0e6a2f&utm_campaign=tblockbox_development&utm_source=login&state=RDUcGXsrlWMrxZo7E3HqzzDZPyK9HWBLIstUlZ0gMec"
// "https://accounts.stage.mozaws.net/authorization?client_id=e26781120ec9677a&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Flockbox.thunderbird.dev%2Flockbox%2Ffxa&access_type=offline&action=email&entrypoint=tblockbox&flow_begin_time=1726077258350&flow_id=6918661adac5978b61e5e400f689147c9ea83e32c7e2c260e93a5a504c0e6a2f&utm_campaign=tblockbox_development&utm_source=login&state=RDUcGXsrlWMrxZo7E3HqzzDZPyK9HWBLIstUlZ0gMec"
// "https://accounts.stage.mozaws.net/authorization?client_id=e26781120ec9677a&scope=openid%20email%20profile&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Flockbox%2Ffxa&access_type=offline&action=email&entrypoint=tblockbox&flow_begin_time=1726077547294&flow_id=e83ed5bd44d9e51133a5e2e298788c4c0ad6209ab0e3d90791ec97db91764c35&utm_campaign=tblockbox_development&utm_source=login&state=BM9d28O80w-LBYLF0_NwAOxHjmKbmJnIhAY6HECRfXQ"

// https://lockbox.thunderbird.dev/fxa?code=5203202272a19d29e2e95f746e0858b6712bc4a89053d00ab55a8331639938af&state=8xSeGiOviRP2bGWhWN-cUGaz4Yz971jbA6Mnr6tLG2k&action=signin&gid=110174056382366451527&utm_campaign=tblockbox_development&utm_source=login&flow_id=6cb4c77900df8e8786b436baa7575a75f8188b546bc84716933fab3aef7061b3&flow_begin_time=1726078886855
