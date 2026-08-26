import PropTypes from 'prop-types';
import { ComponentType, createElement, forwardRef } from 'react';
import { useIntl } from '@openedx/frontend-base';

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
  IntlProvider,
  isRtl,
  LOCALE_CHANGED,
  LOCALE_TOPIC,
  mergeMessages,
  updateLocale,
  useIntl,
} from '@openedx/frontend-base';

/**
 * prop-types is deprecated, but this minimal definition exists to preserve backwards compatibility in this shim, as
 * some MFEs may still be importing `intlShape`.
 * @deprecated
 */
export const intlShape = PropTypes.object;

/* `injectIntl` was dropped from frontend-base's i18n surface, but plenty of
 * legacy code (especially class components) still relies on it, so this shim
 * reimplements it on top of the `useIntl` hook. */

/* Derived from `useIntl` rather than imported by name: frontend-base only
 * started exporting the `IntlShape` type after the release that still shipped
 * its own `injectIntl`, and this shim supports both. */
export type IntlShape = ReturnType<typeof useIntl>;

export interface WrappedComponentProps {
  intl: IntlShape;
}

/* Statics React (or the function object) owns; everything else on the wrapped
 * component is copied onto the wrapper, the way react-intl does via
 * hoist-non-react-statics.  Copying `$$typeof`/`render`/`compare` would turn
 * the wrapper into the component it wraps, so those are excluded too.
 *
 * This code exists so that e.g. something like the following works:
 *   const Card = injectIntl(BaseCard);   // BaseCard.Header, BaseCard.Body
 *   <Card.Header />                      // undefined without hoisting
 */
const nonHoistableStatics = new Set([
  '$$typeof', '_init', '_payload', 'arguments', 'arity', 'callee', 'caller',
  'childContextTypes', 'compare', 'contextType', 'contextTypes', 'defaultProps',
  'displayName', 'getDefaultProps', 'getDerivedStateFromError',
  'getDerivedStateFromProps', 'length', 'mixins', 'name', 'propTypes',
  'prototype', 'render', 'type',
]);

/**
 * Wraps a component so that it receives the current `IntlShape` as an `intl` prop.
 *
 * Refs are forwarded to the wrapped component, so `ref` on the wrapper reaches
 * the same instance/node it would have without the wrapper.  (This matches
 * react-intl's `{ forwardRef: true }`; there's no reason to make it opt-in
 * because the wrapper itself is never a useful ref target.)
 */
export function injectIntl<P extends WrappedComponentProps>(WrappedComponent: ComponentType<P>) {
  const Injected = forwardRef<unknown, Omit<P, 'intl'>>((props, ref) => {
    const intl = useIntl();
    /* `ref` is only set on the element when the caller passed one, so function
     * components that can't take a ref are left alone. */
    return createElement(WrappedComponent, { ...props, intl, ref: ref ?? undefined } as unknown as P);
  });

  Injected.displayName = `injectIntl(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`;

  for (const key of Object.getOwnPropertyNames(WrappedComponent)) {
    if (nonHoistableStatics.has(key)) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(WrappedComponent, key);
    if (descriptor !== undefined) {
      Object.defineProperty(Injected, key, descriptor);
    }
  }

  return Object.assign(Injected, { WrappedComponent });
}
