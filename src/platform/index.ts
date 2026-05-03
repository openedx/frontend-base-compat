/* Aggregate of the bare `@edx/frontend-platform` surface served by this
 * package's `.` export entry.  Subpath imports (`/i18n`, `/auth`) hit
 * `./i18n.ts` and `./auth.ts` directly via the package `exports` map. */
export { getConfig, SITE_CONFIG_TRANSLATION_MAP } from './getConfig';
export { camelCaseObject } from '@openedx/frontend-base';
