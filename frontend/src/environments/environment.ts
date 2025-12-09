// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const apiHost = (() => {
  const { protocol, hostname } = window.location;
  const apiPort = 8080;
  return `${protocol}//${hostname}:${apiPort}`;
})();

export const environment = {
  production: false,
  // Resolve backend using the device's current hostname so phones on LAN can reach it
  host: apiHost,
  // Use public CDN for face-api.js models to avoid missing local assets
  faceModelsPath: 'https://justadudewhohacks.github.io/face-api.js/models'
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
