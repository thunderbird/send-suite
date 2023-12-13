import { Router } from 'express';
import passport from 'passport';
import axios from 'axios';
import { Strategy } from 'passport-openidconnect';

const router: Router = Router();

router.get('/login', async (req, res, next) => {
  try {
    const utm_campaign = `${process.env.ENTRYPOINT}_${process.env.APP_ENV}`;
    const utm_source = 'login';

    // Fetch the flowValues before you call the Passport middleware
    const flow_values = await axios
      .get(process.env.FXA_METRICS_FLOW_URL, {
        params: {
          entrypoint: process.env.ENTRYPOINT,
          form_type: 'email',
          utm_campaign: utm_campaign,
          utm_source: utm_source,
        },
      })
      .then((response) => response.data);

    // Patch the `authorizationParams` so that we can include custom params.
    Strategy.prototype.authorizationParams = function (options) {
      return {
        ...options,
        access_type: 'offline',
        entrypoint: process.env.ENTRYPOINT,
        action: 'email',
        email: options.email, // Where should this come from?
        flow_begin_time: flow_values.flowBeginTime,
        flow_id: flow_values.flowId,
        utm_campaign: utm_campaign,
        utm_source: utm_source,
      };
    };
  } catch (err) {
    // Log the error, but continue with passport auth
    console.error('Could not initialize metrics flow, error occurred: ', err);
  }

  // Manually call `.authenticate()(req, res, next)`
  // instead of using it as middleware
  passport.authenticate('openidconnect', {
    failureRedirect: './login',
  })(req, res, next);
});

router.get('/logout', async (req, res, next) => {});

// handler for the callbackURL
router.get(
  '/',
  (req, res, next) => {
    // If the OP sent back an error, redirect.
    if (req.query.error) {
      return res.redirect('/?error=' + req.query.error);
    }

    // Otherwise, move on to the passport.authenticate middleware
    next();
  },
  passport.authenticate('openidconnect', {
    failureRedirect: './error',
    failureMessage: true,
  }),
  (req, res) => {
    // We've received the token response and can redirect to the Vue app
    res.redirect('./profile');
  }
);

export default router;
