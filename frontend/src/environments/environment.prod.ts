// Production environment - deployed on Netlify
// API requests are routed through Netlify rewrites to Railway backend

export const environment = {
  production: true,
  // Use /api path - Netlify netlify.toml rewrites this to Railway backend
  // Or directly use the Railway backend URL if needed
  host: '/api' || window.location.origin, // Falls back to current origin for API
  // Load face-api.js models from bundled assets
  faceModelsPath: 'assets/models',
  offline: false
};

