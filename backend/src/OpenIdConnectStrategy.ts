import OpenIDConnectStrategy from 'passport-openidconnect';

const strategy = new OpenIDConnectStrategy(
  {
    issuer: `https://accounts.stage.mozaws.net`,
    authorizationURL: `https://accounts.stage.mozaws.net/authorization`,
    tokenURL: `https://oauth.stage.mozaws.net/v1/token`,
    userInfoURL: `https://profile.stage.mozaws.net/v1/profile`,
    clientID: process.env.FXA_CLIENT_ID,
    clientSecret: process.env.FXA_CLIENT_SECRET,

    // This becomes the `redirect_uri`
    callbackURL: 'http://localhost:5173/lockbox/fxa',
    scope: `profile`,
  },
  function (
    issuer,
    sub,
    profile,
    jwtClaims,
    accessToken,
    refreshToken,
    tokenResponse,
    done
  ) {
    /*
    tokens received from the token endpoint after successful authentication and authorization
    are saved for future use by passing the information received from the OP to the next handler
    in a single object provided as the second argument to the `done` method,
    allowing Passport to attach it to the request object (and to preserve it in the session), e.g.:
  */

    /*
TODO:
- add fxa user id field to User model
- look for a user with that fxa user id
- if one doesn't exist, create one


    */

    console.log(`👿👿👿👿👿👿👿👿👿👿👿`);
    console.log(`did I get a refreshToken?`);
    console.log(refreshToken);

    done(null, {
      profile: profile,
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

console.log(`created an OpenIdConnectStrategy`);

console.log(strategy);

export default strategy;
