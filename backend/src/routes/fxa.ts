import { Router } from 'express';
import axios from 'axios';
import { getIssuer, getClient, generateState } from '../auth/client';
import { findOrCreateUserProfileByMozillaId } from '../models/users';
import logger from '../logger';
import {
  wrapAsyncHandler,
  addErrorHandling,
  AUTH_ERRORS,
} from '../errors/routes';

const FXA_STATE = 'fxa_state';

const router: Router = Router();

// Route for obtaining an authorization URL for Mozilla account.
router.get(
  '/login',
  addErrorHandling(AUTH_ERRORS.LOG_IN_FAILED),
  wrapAsyncHandler(async (req, res, next) => {
    // Params to include when we request an authorization url
    let additionalParams: Record<string, any> = {
      access_type: 'offline',
      action: 'email',
      // email: options.email, // Where should this come from?
    };

    // Set up Metrics Flow
    try {
      const utm_campaign = `${process.env.FXA_ENTRYPOINT}_${process.env.APP_ENV}`;
      const utm_source = 'login';

      // Fetch the flowValues before requesting the auth url
      const flow_values = await axios
        .get(process.env.FXA_METRICS_FLOW_URL, {
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

    // Add state code to session.
    // We'll attempt to match this in the callback.
    req.session[FXA_STATE] = state;

    // Save session and send the auth url to the front end
    // so they can do the redirect.
    req.session.save((err) => {
      if (err) {
        logger.error('Could not save session in /login.');
        logger.error(err);
        res.status(500).json(err);
        return;
      }

      res.status(200).json({
        url,
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
      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        id_token: idToken,
      } = tokenSet;

      const userinfo: Record<string, any> = await client.userinfo(accessToken);

      const { uid, avatar, email } = userinfo;
      const user = await findOrCreateUserProfileByMozillaId(
        uid,
        avatar,
        email,
        accessToken,
        refreshToken
      );
      console.log(`saving user to session after logging into mozilla account`);
      console.log(user);
      // TODO: strip out backup keys before storing to session.
      req.session['user'] = user;
      req.session.save((err) => {
        if (err) {
          logger.error('Could not save session in / callback.');
          logger.error(err);
          throw Error(`Could not save session in fxa callback`);
        }

        res.redirect('/login-success.html');
      });
    });
  })
);

router.get(
  '/logout',
  addErrorHandling(AUTH_ERRORS.LOG_OUT_FAILED),
  wrapAsyncHandler(async (req, res, next) => {
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
