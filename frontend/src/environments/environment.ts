// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

const apiHost = (() => {
  const { protocol, hostname } = window.location;
  const apiPort = 8080;
  // Local development: connect to localhost:8080
  return `${protocol}//${hostname}:${apiPort}`;
})();

export const environment = {
  production: false,
  host: apiHost,
  // Load face-api.js models from bundled assets
  faceModelsPath: 'assets/models',
  offline: false
};

