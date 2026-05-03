import { setSiteConfig } from '@openedx/frontend-base';

import { getConfig } from './getConfig';

const SITE_BASE = {
  siteId: 'test',
  siteName: 'Test Site',
  baseUrl: 'http://localhost:8080',
  lmsBaseUrl: 'http://localhost:8000',
  loginUrl: 'http://localhost:8000/login',
  logoutUrl: 'http://localhost:8000/logout',
};

describe('getConfig adapter', () => {
  it('translates curated UPPER_SNAKE keys to camelCase SiteConfig fields', () => {
    setSiteConfig({ ...SITE_BASE, apps: [] } as any);
    const config = getConfig();
    expect(config.LMS_BASE_URL).toBe('http://localhost:8000');
    expect(config.LOGIN_URL).toBe('http://localhost:8000/login');
    expect(config.SITE_NAME).toBe('Test Site');
    expect(config.BASE_URL).toBe('http://localhost:8080');
  });

  it('handles the LOGO_URL -> headerLogoImageUrl semantic rename', () => {
    setSiteConfig({
      ...SITE_BASE,
      headerLogoImageUrl: 'https://cdn.example.com/logo.png',
      apps: [],
    } as any);
    expect(getConfig().LOGO_URL).toBe('https://cdn.example.com/logo.png');
  });

  it('falls through unmatched keys to commonAppConfig', () => {
    setSiteConfig({
      ...SITE_BASE,
      commonAppConfig: {
        INDIGO_ENABLE_DARK_TOGGLE: true,
        INDIGO_FOOTER_NAV_LINKS: [{ url: '/about', title: 'About' }],
      },
      apps: [],
    } as any);
    const config = getConfig();
    expect(config.INDIGO_ENABLE_DARK_TOGGLE).toBe(true);
    expect(config.INDIGO_FOOTER_NAV_LINKS).toEqual([{ url: '/about', title: 'About' }]);
  });

  it('returns undefined for keys absent from both sources', () => {
    setSiteConfig({ ...SITE_BASE, commonAppConfig: {}, apps: [] } as any);
    expect(getConfig().NEVER_SET).toBeUndefined();
  });

  it('returns undefined when commonAppConfig itself is missing', () => {
    setSiteConfig({ ...SITE_BASE, apps: [] } as any);
    expect(getConfig().INDIGO_ANYTHING).toBeUndefined();
  });

  it('supports "in" checks for both mapped and bag keys', () => {
    setSiteConfig({
      ...SITE_BASE,
      commonAppConfig: { INDIGO_ENABLE_DARK_TOGGLE: true },
      apps: [],
    } as any);
    const config = getConfig();
    expect('LMS_BASE_URL' in config).toBe(true);
    expect('INDIGO_ENABLE_DARK_TOGGLE' in config).toBe(true);
    expect('UNKNOWN_KEY' in config).toBe(false);
  });

  it('enumerates the union of mapped + bag keys via Object.keys', () => {
    setSiteConfig({
      ...SITE_BASE,
      commonAppConfig: { INDIGO_FLAG: 1, OTHER: 2 },
      apps: [],
    } as any);
    const keys = Object.keys(getConfig()).sort();
    expect(keys).toEqual(expect.arrayContaining([
      'BASE_URL',
      'INDIGO_FLAG',
      'LMS_BASE_URL',
      'LOGIN_URL',
      'LOGOUT_URL',
      'OTHER',
      'SITE_NAME',
    ]));
  });

  it('omits mapped keys whose underlying SiteConfig field is undefined', () => {
    setSiteConfig({ ...SITE_BASE, apps: [] } as any);
    /* No headerLogoImageUrl set, so LOGO_URL must not appear in keys. */
    expect(Object.keys(getConfig())).not.toContain('LOGO_URL');
  });

  it('survives destructuring after binding to a local', () => {
    /* Mirrors `const config = getConfig(); config.LMS_BASE_URL` patterns from
     * IndigoFooter.jsx and MobileViewHeader.jsx. */
    setSiteConfig({
      ...SITE_BASE,
      commonAppConfig: { INDIGO_FOOTER_NAV_LINKS: [{ url: '/x' }] },
      apps: [],
    } as any);
    const config = getConfig();
    const lms = config.LMS_BASE_URL;
    const links = config.INDIGO_FOOTER_NAV_LINKS;
    expect(lms).toBe('http://localhost:8000');
    expect(links).toEqual([{ url: '/x' }]);
  });

  it('reflects mergeSiteConfig updates without re-calling getConfig', () => {
    setSiteConfig({ ...SITE_BASE, apps: [] } as any);
    const config = getConfig();
    expect(config.LMS_BASE_URL).toBe('http://localhost:8000');
    setSiteConfig({ ...SITE_BASE, lmsBaseUrl: 'https://prod.example.com', apps: [] } as any);
    expect(config.LMS_BASE_URL).toBe('https://prod.example.com');
  });
});
