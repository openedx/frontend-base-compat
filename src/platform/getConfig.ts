import { getSiteConfig } from '@openedx/frontend-base';

/**
 * Mirrors edx-platform's `SITE_CONFIG_TRANSLATION_MAP`
 * (`lms/djangoapps/mfe_config_api/views.py`).  The two ends must stay in
 * lockstep: any key edx-platform lifts from `MFE_CONFIG` to a first-class
 * frontend-base `SiteConfig` field is read back via the camelCase name on
 * `getSiteConfig()`; everything else flows through `commonAppConfig`.
 *
 * `LOGO_URL -> headerLogoImageUrl` is a semantic rename, not a snake-to-camel
 * transform.  Curated rather than algorithmic both because of cases like that
 * and because the lockstep contract is the whole point.
 */
export const SITE_CONFIG_TRANSLATION_MAP: Record<string, string> = {
  /* RequiredSiteConfig */
  SITE_NAME: 'siteName',
  BASE_URL: 'baseUrl',
  LMS_BASE_URL: 'lmsBaseUrl',
  LOGIN_URL: 'loginUrl',
  LOGOUT_URL: 'logoutUrl',
  /* OptionalSiteConfig */
  LOGO_URL: 'headerLogoImageUrl',
  ACCESS_TOKEN_COOKIE_NAME: 'accessTokenCookieName',
  LANGUAGE_PREFERENCE_COOKIE_NAME: 'languagePreferenceCookieName',
  USER_INFO_COOKIE_NAME: 'userInfoCookieName',
  CSRF_TOKEN_API_PATH: 'csrfTokenApiPath',
  REFRESH_ACCESS_TOKEN_API_PATH: 'refreshAccessTokenApiPath',
  SEGMENT_KEY: 'segmentKey',
};

/* Public-API shape: legacy callers do `getConfig().LMS_BASE_URL`, which only
 * type-checks against `any`-valued properties. */
type LegacyConfig = Record<string, any>;

function lookup(prop: string): { found: boolean, value: unknown } {
  const site = getSiteConfig();
  if (Object.prototype.hasOwnProperty.call(SITE_CONFIG_TRANSLATION_MAP, prop)) {
    const camel = SITE_CONFIG_TRANSLATION_MAP[prop];
    const value = Reflect.get(site, camel) as unknown;
    return { found: value !== undefined, value };
  }
  const bag = site.commonAppConfig;
  if (bag && Object.prototype.hasOwnProperty.call(bag, prop)) {
    return { found: true, value: bag[prop] };
  }
  return { found: false, value: undefined };
}

const handler: ProxyHandler<LegacyConfig> = {
  get(_target, prop) {
    if (typeof prop !== 'string') {
      return undefined;
    }
    return lookup(prop).value;
  },

  has(_target, prop) {
    if (typeof prop !== 'string') {
      return false;
    }
    return lookup(prop).found;
  },

  ownKeys() {
    const site = getSiteConfig();
    const keys = new Set<string>();
    for (const upper of Object.keys(SITE_CONFIG_TRANSLATION_MAP)) {
      const camel = SITE_CONFIG_TRANSLATION_MAP[upper];
      if (Reflect.get(site, camel) !== undefined) {
        keys.add(upper);
      }
    }
    const bag = site.commonAppConfig;
    if (bag) {
      for (const k of Object.keys(bag)) {
        keys.add(k);
      }
    }
    return Array.from(keys);
  },

  getOwnPropertyDescriptor(_target, prop) {
    if (typeof prop !== 'string') {
      return undefined;
    }
    const { found, value } = lookup(prop);
    if (!found) {
      return undefined;
    }
    return { configurable: true, enumerable: true, writable: false, value };
  },
};

const proxy: LegacyConfig = new Proxy<LegacyConfig>({}, handler);

/**
 * Drop-in replacement for `@edx/frontend-platform`'s `getConfig()`.
 *
 * Returns a Proxy that re-reads `getSiteConfig()` on every property access,
 * so it stays current under `mergeSiteConfig` / `setSiteConfig` updates.
 * UPPER_SNAKE_CASE keys are resolved against `SITE_CONFIG_TRANSLATION_MAP`
 * first; unmatched keys fall through to `getSiteConfig().commonAppConfig`.
 */
export function getConfig(): LegacyConfig {
  return proxy;
}
