import { Strategy } from 'passport-openidconnect';
import { findOrCreateUserByProfile } from './models';
import axios from 'axios';

const strategy = new Strategy(
  {
    issuer: `https://accounts.stage.mozaws.net`,
    authorizationURL: `https://accounts.stage.mozaws.net/authorization`,
    tokenURL: `https://oauth.stage.mozaws.net/v1/token`,
    userInfoURL: `https://profile.stage.mozaws.net/v1/profile`,
    clientID: process.env.FXA_CLIENT_ID,
    clientSecret: process.env.FXA_CLIENT_SECRET,
    callbackURL: 'http://localhost:5173/lockbox/fxa',
    scope: `profile`,
  },
  async function (
    issuer,
    mozProfile,
    idProfile,
    context,
    idToken,
    accessToken,
    refreshToken,
    params,
    done
  ) {
    const profile = await findOrCreateUserByProfile(
      mozProfile.id,
      mozProfile._json.avatar,
      accessToken,
      refreshToken
      // also has mozProfile.emails[0]
    );
    if (!profile) {
      console.log(`couldn't find or create profile`);
    }

    // After successfully authenticating, we can save tokens, etc. to the session
    // by passing as the second argument to the `done()` function.
    done(null, {
      profile,
    });
  }
);

export default strategy;
