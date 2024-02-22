import { Router } from 'express';
import axios from 'axios';
import { getIssuer, getClient, generateState } from '../auth/client';
import { findOrCreateUserByProfile } from '../models';

const FXA_STATE = 'fxa_state';

const router: Router = Router();

// Route for obtaining an authorization URL
router.get('/login', async (req, res, next) => {
  console.log(`1. get auth url route sees session id ${req.session.id}`);

  // Additional params to include when we request an authorization url
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
    // Log the error, but continue with passport auth
    console.error('Could not initialize metrics flow, error occurred: ', err);
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
  console.log(`authorization url is`);
  console.log(url);

  // Do session setup.
  req.session[FXA_STATE] = state;
  // TODO: get & put user's email in session?

  // Save session and send the auth url to the front end so they
  // can do the redirect.
  req.session.save((err) => {
    if (err) {
      console.log(`💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣`);
      console.log(`couldn't save session`);
      res.status(500).json(err);
      return;
    }

    res.status(200).json({
      url,
    });
  });
});

// OIDC callback handler
router.get('/', async (req, res) => {
  console.log(`2. callback url route sees session id ${req.session.id}`);
  if (req.query.error) {
    return res.redirect('/?error=' + req.query.error);
  }

  // Confirm that we received a code and compare
  // received state to the original
  const { code, state } = req.query;
  const originalState = req.session[FXA_STATE];

  if (!code || (state as string) !== originalState) {
    if (!code) {
      console.log(`no code`);
    }
    if ((state as string) !== originalState) {
      console.log(`state does not match`);
      console.log(`state: ${state}`);
      console.log(`originalState: ${originalState}`);
    }

    res.status(403).json({
      msg: 'Could not authenticate',
    });
    return;
  }

  // Clean up session and continue
  delete req.session[FXA_STATE];
  req.session.save(async (err) => {
    if (err) {
      console.log(`💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣`);
      console.log(`couldn't save session`);
      res.status(500).json(err);
      return;
    }

    const mozIssuer = await getIssuer();
    const client = getClient(mozIssuer);

    // The `params` gives us the string equivalents of req.query.*
    // Here, params == { code, string }
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

    console.log('received and validated tokens %j', tokenSet);
    console.log('validated ID Token claims %j', tokenSet.claims());

    const userinfo: Record<string, any> = await client.userinfo(accessToken);
    console.log('userinfo %j', userinfo);

    // Ready to put into profile:
    // - use our findOrCreate
    // - put the found/created user in the session
    /*
          {"email":"chris@thunderbird.net","locale":"en-US,en;q=0.5","amrValues":["pwd","email"],"twoFactorAuthentication":false,"metricsEnabled":true,"atLeast18AtReg":null,"uid":"668caa503f384f999f292287c5e3af8d","avatar":"https://mozillausercontent.com/e3137631f4e72eb63dfbc18fe216a94a","avatarDefault":false,"sub":"668caa503f384f999f292287c5e3af8d"}
      */

    const { uid, avatar, email } = userinfo;
    const profile = await findOrCreateUserByProfile(
      uid,
      avatar,
      accessToken,
      refreshToken
      // TODO: decide if/how to use email
    );

    // ok, this expects the user, but I think what we really want is the profile.
    // so, I need to flip this around.
    // But first, let's confirm that it exists for the user as they float around.
    req.session['user'] = profile.user;

    res.status(200).json({
      ok: 'not really, just placeholder',
    });
  });
});

router.get('/logout', async (req, res, next) => {
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
  const accessToken = `${req.session?.passport?.user?.profile?.accessToken}`;
  console.log(`

  🛑🛑🛑🛑🛑🛑🛑 logging out of fxa
  `);
  try {
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
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: 'Could not log out',
      error: e,
    });
  }
});

export default router;
