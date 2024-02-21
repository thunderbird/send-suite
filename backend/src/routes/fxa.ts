import { Router } from 'express';
// import passport from 'passport';
import axios from 'axios';
import { getIssuer, getClient, generateState } from '../auth/client';

const router: Router = Router();

// Route for obtaining an authorization URL
router.get('/login', async (req, res, next) => {
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
  req.session['fxa_state'] = state;
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
router.get(
  '/',
  async (req, res) => {
    if (req.query.error) {
      return res.redirect('/?error=' + req.query.error);
    }

    // Confirm that we received a code and compare
    // received state to the original
    const { code, state } = req.query;
    const originalState = req.session['fxa_state'];

    if (!code || state !== originalState) {
      res.status(403).json({
        msg: 'Could not authenticate',
      });
      return;
    }

    // Clean up session and continue
    delete req.session['fxa_state'];
    req.session.save(async (err) => {
      if (err) {
        console.log(`💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣💣`);
        console.log(`couldn't save session`);
        res.status(500).json(err);
        return;
      }

      const mozIssuer = await getIssuer();
      const client = getClient(mozIssuer);

      const params = client.callbackParams(req);
      const tokenSet = await client.callback(
        'http://localhost:5173/lockbox/fxa',
        params,
        { state: state as string }
      );
      console.log('received and validated tokens %j', tokenSet);
      console.log('validated ID Token claims %j', tokenSet.claims());

      res.status(200).json({
        ok: 'not really, just placeholder',
      });
    });
  }
  // passport.authenticate(
  //   'openidconnect',
  //   {
  //     failureRedirect: './error',
  //     failureMessage: true,
  //   },
  //   (...args) => {
  //     console.log(`======================================`);
  //     for (let arg of args) {
  //       console.log(arg);
  //     }
  //     console.log(`======================================`);
  //   }
  // ),
  // (req, res) => {
  //   const sessionId = req.session.id;

  //   // We've received the token response and can redirect to the Vue app
  //   res.redirect(`./profile?sessionId=${sessionId}`);
  // }
);

router.get('/logout', async (req, res, next) => {
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
