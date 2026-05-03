/* Drop-in stand-in for `@edx/frontend-platform/i18n`.
 *
 * Re-exports frontend-base's full i18n surface.  Sites alias
 * `@edx/frontend-platform` to this package via an npm `overrides` entry,
 * which routes any `import ... from '@edx/frontend-platform/i18n'` here.
 *
 * The list mirrors `@openedx/frontend-base`'s i18n exports rather than only
 * the symbols observed in the current FPF plugin inventory, so the override
 * stays robust against future plugin additions. */
export {
  configureI18n,
  createIntl,
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  FormattedPlural,
  FormattedRelativeTime,
  FormattedTime,
  getLocale,
  getLocalizedLanguageName,
  getMessages,
  getPrimaryLanguageSubtag,
  getSupportedLanguageList,
  handleRtl,
  injectIntl,
  IntlProvider,
  intlShape,
  isRtl,
  LOCALE_CHANGED,
  LOCALE_TOPIC,
  mergeMessages,
  updateLocale,
  useIntl,
} from '@openedx/frontend-base';
