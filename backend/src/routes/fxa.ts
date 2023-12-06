import { Router } from 'express';
import passport from 'passport';

const router: Router = Router();

// The "login page" just sends us through the Moz Accounts auth flow.
router.get(
  '/login',
  passport.authenticate('openidconnect', { failureRedirect: './login' })
);

// handler for the callbackURL
router.get(
  '/',
  (req, res, next) => {
    // If the OP sent back an error, redirect.
    console.log(`we are at ${req.originalUrl}`);

    console.log(`req.query coming up 🍵🍵🍵🍵`);
    console.log(req.query);

    if (req.query.error) {
      return res.redirect('/?error=' + req.query.error);
    }
    // Otherwise, move on to the passport.authenticate middleware,
    // which should(?) make the token request using the `openidconnect` strategy
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
