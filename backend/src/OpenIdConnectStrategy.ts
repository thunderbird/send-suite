import OpenIDConnectStrategy from 'passport-openidconnect';
import { findOrCreateUserByProfile } from './models';

const strategy = new OpenIDConnectStrategy(
  {
    issuer: `https://accounts.stage.mozaws.net`,
    authorizationURL: `https://accounts.stage.mozaws.net/authorization`,
    tokenURL: `https://oauth.stage.mozaws.net/v1/token`,
    userInfoURL: `https://profile.stage.mozaws.net/v1/profile`,
    clientID: process.env.FXA_CLIENT_ID,
    clientSecret: process.env.FXA_CLIENT_SECRET,
    // This is `redirect_uri` for Mozilla Accounts
    callbackURL: 'http://localhost:5173/lockbox/fxa',
    scope: `profile`,
  },
  async function (
    issuer,
    sub,
    mozProfile,
    jwtClaims,
    accessToken,
    refreshToken,
    tokenResponse,
    done
  ) {
    // console.log(`🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄`);
    // console.log(`issuer: ${issuer}`);
    // console.log(`sub:`);
    // console.log(sub);
    // console.log(`profile:`);
    // console.log(mozProfile);
    // console.log(`jwtClaims: ${jwtClaims}`);
    // console.log(`accessToken: ${accessToken}`);
    // console.log(`refreshToken: ${refreshToken}`);
    // console.log(`tokenResponse:`);
    // console.log(tokenResponse);

    // MozAccountId is sub.id
    const profile = await findOrCreateUserByProfile(sub.id);

    // After successfully authenticating, we can save tokens, etc. to the session
    // by passing as the second argument to the `done()` function.
    done(null, {
      profile: mozProfile,
      accessToken: {
        token: accessToken,
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
      },
      idToken: {
        token: tokenResponse.id_token,
        claims: jwtClaims,
      },
    });
  }
);

export default strategy;
