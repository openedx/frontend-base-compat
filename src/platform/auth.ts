/* Drop-in stand-in for `@edx/frontend-platform/auth`.
 *
 * Re-exports frontend-base's full auth surface.  Sites alias
 * `@edx/frontend-platform` to this package via an npm `overrides` entry,
 * which routes any `import ... from '@edx/frontend-platform/auth'` here. */
export {
  AUTHENTICATED_USER_CHANGED,
  AUTHENTICATED_USER_TOPIC,
  AxiosJwtAuthService,
  configureAuth,
  ensureAuthenticatedUser,
  fetchAuthenticatedUser,
  getAuthenticatedHttpClient,
  getAuthenticatedUser,
  getAuthService,
  getHttpClient,
  getLoginRedirectUrl,
  getLogoutRedirectUrl,
  hydrateAuthenticatedUser,
  MockAuthService,
  redirectToLogin,
  redirectToLogout,
  setAuthenticatedUser,
} from '@openedx/frontend-base';
