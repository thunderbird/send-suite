import { Strategy } from 'passport-openidconnect';
import { findOrCreateUserByProfile } from './models';
import axios from 'axios';

// Hit the metrics flow prior prior to requesting the Authorization URL
Strategy.prototype.authorizationParams = (options) => {
  const utm_campaign = `${process.env.ENTRYPOINT}_${process.env.APP_ENV}`;
  const utm_source = 'login';

  // The HTTP GET request before the authorization call
  return axios
    .get(process.env.FXA_METRICS_FLOW_URL, {
      params: {
        entrypoint: process.env.ENTRYPOINT,
        form_type: 'email',
        utm_campaign: utm_campaign,
        utm_source: utm_source,
      },
    })
    .then((response) => response.data)
    .catch((err) => {
      console.error('Could not initialize metrics flow, error occurred: ', err);
      return {};
    })
    .then((flow_values) => ({
      access_type: 'offline',
      entrypoint: process.env.ENTRYPOINT,
      action: 'email',
      email: options.email, // TODO
      flow_begin_time: flow_values.flowBeginTime,
      flow_id: flow_values.flowId,
      utm_campaign: utm_campaign,
      utm_source: utm_source,
    }));
};

const strategy = new Strategy(
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
    // Use the accessToken to retrieve the user's avatar
    const profileResp = await axios.get(
      `https://profile.stage.mozaws.net/v1/profile`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log(`🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄`);
    console.log(profileResp.data.avatar);
    // {
    // email: 'chris@thunderbird.net',
    // locale: 'en-US,en;q=0.5',
    // amrValues: [ 'pwd', 'email' ],
    // twoFactorAuthentication: false,
    // metricsEnabled: true,
    // uid: '668caa503f384f999f292287c5e3af8d',
    // avatar: 'https://mozillausercontent.com/e3137631f4e72eb63dfbc18fe216a94a',
    // avatarDefault: false,
    // sub: '668caa503f384f999f292287c5e3af8d'
    // }

    // MozAccountId is sub.id, but also:
    // - profileResp.data.sub
    // - profileResp.data.uid
    const profile = await findOrCreateUserByProfile(
      sub.id,
      profileResp.data.avatar
    );
    if (!profile) {
      console.log(`🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑`);
      console.log(`couldn't find or create profile`);
    }

    // After successfully authenticating, we can save tokens, etc. to the session
    // by passing as the second argument to the `done()` function.
    done(null, {
      profile: mozProfile,
      accessToken: {
        token: accessToken,
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        refreshToken,
      },
      idToken: {
        token: tokenResponse.id_token,
        claims: jwtClaims,
      },
    });
  }
);

export default strategy;
