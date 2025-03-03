import { createLoginSession, deleteSession, getLoginSession } from '@/models';
import axios from 'axios';
import { createHash } from 'crypto';
import { Request, Router } from 'express';
import {
  checkAllowList,
  clearCookie,
  generateState,
  getClient,
  getIssuer,
  registerTokens,
} from '../auth/client';
import { ENVIRONMENT } from '../config';
import {
  addErrorHandling,
  AUTH_ERRORS,
  wrapAsyncHandler,
} from '../errors/routes';
import {
  findOrCreateUserProfileByMozillaId,
  updateUniqueHash,
} from '../models/users';
import { AuthResponse } from './auth';

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
      console.error(`Could not initialize metrics flow.`, err);
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
    try {
      await createLoginSession(state);
    } catch (err) {
      if (err) {
        console.error('Could not save session in /login.', err);
        res.status(500).json(err);
        return;
      }
    }

    // Save session and send the auth url to the front end
    // so they can do the redirect.
    res.status(200).json({
      url: url,
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

    const originalState = await getLoginSession(state as string);

    if (!code || state !== originalState?.fxasession) {
      res.status(403).json({
        msg: 'Could not authenticate',
      });
      return;
    }

    // Clean up session and continue
    await deleteSession(originalState?.fxasession);
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
    const { access_token: accessToken, refresh_token: refreshToken } = tokenSet;

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

      const uniqueHash = createHash('sha256').update(uid).digest('hex');
      user.uniqueHash = uniqueHash;

      await updateUniqueHash(user.id, uniqueHash);

      // We'll use this data to sign the JWTs
      const signedData: AuthResponse = {
        uniqueHash,
        id: user.id,
        email: user.email,
        tier: user.tier,
      };

      registerTokens(signedData, res);

      res.redirect('/login-success.html');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      res.redirect('/login-failed.html');
    }
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

    clearCookie('authorization', res);
    clearCookie('refresh_token', res);

    const destroyUrl = `https://oauth.stage.mozaws.net/v1/destroy`;
    const accessToken = null; // this is still todo, adding null to avoid unnecessary errors
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
