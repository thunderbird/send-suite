//./plugins/posthog.js

import posthog from 'posthog-js';

export default {
  install(app) {
    app.config.globalProperties.$posthog = posthog.init(
      import.meta.env.VITE_POSTHOG_PROJECT_KEY,
      {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        persistence: 'memory',
      }
    );
    posthog.register({
      service: 'send',
    });
  },
  rest: posthog,
};
