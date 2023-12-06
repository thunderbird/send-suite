import { Router } from 'express';
import passport from 'passport';

const router: Router = Router();

router.get(
  '/login',
  passport.authenticate('openidconnect', { failureRedirect: '/login' })
);

/* processing the redirection request */
router.get(
  '/',
  function (req, res, next) {
    /*
    checking if an error is present in the response from the OP; if it is -
    redirecting to the Home screen and not processing the request any further
  */
    console.log(`we are at ${req.originalUrl}`);

    console.log(`req.query coming up 🍵🍵🍵🍵`);
    console.log(req.query);

    if (req.query.error) {
      return res.redirect('/?error=' + req.query.error);
    }

    /*
    if no error is encountered, proceeding to the next step,
    in which passport.authenticate middleware is used to make the token request
    with the configured strategy referenced by its default name
  */
    next();
  },
  passport.authenticate('openidconnect', {
    failureRedirect: '/whoops',
    failureMessage: true,
  }),
  function (req, res) {
    /*
    when the token response is received and processed in the strategy callback,
    redirecting to a desired route, which in this case is the user profile screen
  */
    console.log(`you shall pass`);
    res.redirect('/profile');
  }
);

export default router;

/*
Here's what I got back

https://lockbox.thunderbird.dev/fxa?code=154e56910537251554a3ea69eb1b547dab4d8c350c8b9ccd2c18f14397ac9724&state=r0MpPp2LUxXVwABuO4MQQIT3&action=signin

*/
