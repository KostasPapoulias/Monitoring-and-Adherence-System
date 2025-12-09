const apiHost = (() => {
  const { protocol, hostname } = window.location;
  const apiPort = 8080;
  return `${protocol}//${hostname}:${apiPort}`;
})();

export const environment = {
  production: true,
  // Resolve backend using the device's current hostname so phones on LAN can reach it
  host: apiHost,
  // Use public CDN for face-api.js models to avoid missing local assets
  faceModelsPath: 'https://justadudewhohacks.github.io/face-api.js/models'
};
