export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'dummy-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin + '/auth/callback',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphManagerEndpoint: 'https://graph.microsoft.com/v1.0/me/manager',
  graphGroupsEndpoint: 'https://graph.microsoft.com/v1.0/me/memberOf',
};
