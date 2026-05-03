import { EnvironmentTypes, SiteConfig } from '@openedx/frontend-base';

/**
 * Minimal site config used only by Jest. Tests that need specific apps call
 * `setSiteConfig(...)` themselves; this just satisfies frontend-base's
 * import-time alias.
 */
const siteConfig: SiteConfig = {
  siteId: 'fpf-compat-test-site',
  siteName: 'FPF Compat Test Site',
  baseUrl: 'http://localhost:8080',
  lmsBaseUrl: 'http://localhost:8000',
  loginUrl: 'http://localhost:8000/login',
  logoutUrl: 'http://localhost:8000/logout',

  environment: EnvironmentTypes?.TEST ?? 'test',
  apps: [],
};

export default siteConfig;
