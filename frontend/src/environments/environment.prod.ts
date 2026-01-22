const apiHost = (() => {
  const { protocol, hostname } = window.location;
  const apiPort = 8080;
  return `${protocol}//${hostname}:${apiPort}`;
})();

export const environment = {
  production: true,
  // Resolve backend using the device's current hostname so phones on LAN can reach it
  host: apiHost,
  // Load face-api.js models from bundled assets
  faceModelsPath: 'assets/models',
  offline: false
};
