/* Smoke test: the symbols re-exported from `./i18n`, `./auth`, and the
 * platform-aggregate `./` are the same object identities frontend-base
 * exports.  Catches accidental wrappers that would silently desync from
 * the underlying implementation. */
import * as base from '@openedx/frontend-base';

import * as platformAuth from './auth';
import { camelCaseObject } from './index';
import * as platformI18n from './i18n';

describe('platform re-exports', () => {
  it('i18n surface is identical to frontend-base', () => {
    expect(platformI18n.useIntl).toBe(base.useIntl);
    expect(platformI18n.defineMessages).toBe(base.defineMessages);
    expect(platformI18n.IntlProvider).toBe(base.IntlProvider);
    expect(platformI18n.injectIntl).toBe(base.injectIntl);
    expect(platformI18n.FormattedMessage).toBe(base.FormattedMessage);
    expect(platformI18n.configureI18n).toBe(base.configureI18n);
  });

  it('auth surface is identical to frontend-base', () => {
    expect(platformAuth.getAuthenticatedHttpClient).toBe(base.getAuthenticatedHttpClient);
    expect(platformAuth.getAuthenticatedUser).toBe(base.getAuthenticatedUser);
    expect(platformAuth.configureAuth).toBe(base.configureAuth);
    expect(platformAuth.AxiosJwtAuthService).toBe(base.AxiosJwtAuthService);
  });

  it('camelCaseObject re-exported from the bare entry is identical to frontend-base', () => {
    expect(camelCaseObject).toBe(base.camelCaseObject);
  });
});
