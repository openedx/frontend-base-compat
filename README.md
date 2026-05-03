# `@openedx/frontend-base-compat`

A compatibility layer that lets legacy `@edx/frontend-platform` consumers and legacy `@openedx/frontend-plugin-framework` (FPF) `env.config.jsx` configuration run on top of [`@openedx/frontend-base`](https://github.com/openedx/frontend-base) sites, as a migration aid during the FPF deprecation window.

The package does three coupled jobs from one install:

- **`@edx/frontend-platform` drop-in.** It re-exports the i18n and auth surfaces from frontend-base (so `useIntl`, `defineMessages`, `getAuthenticatedHttpClient`, etc. resolve to frontend-base's implementations), and exposes a `getConfig` adapter that reads through to `getSiteConfig()` and `commonAppConfig`. An `overrides` entry routes `@edx/frontend-platform[/...]` to the compat package, so real frontend-platform is never installed.

- **FPF drop-in.** It re-exports the public surface of `@openedx/frontend-plugin-framework` (`Plugin`, `PluginSlot`, `DIRECT_PLUGIN`, `IFRAME_PLUGIN`, `PLUGIN_OPERATIONS`) so the package can stand in for FPF via a second `overrides` entry.

- **FPF translation.** It exports `createLegacyPluginApp({ envConfig, appId, slotMap?, widgetMap? })`, which invokes a legacy `setConfig` function, translates its `pluginSlots` into a frontend-base `SlotOperation[]`, and returns an `App` whose `slots` carry the result.

See [ADR 0001](docs/decisions/0001-frontend-base-compatibility.rst) for the design and trade-offs.

## Install

```sh
npm install @openedx/frontend-base-compat
```

Then, in the site's `package.json`, add an `overrides` block so any frontend-platform or FPF import in the dependency tree resolves to the compat package's stubs and neither real package is installed:

```json
{
  "dependencies": {
    "@openedx/frontend-base-compat": "^1.0.0"
  },
  "overrides": {
    "@edx/frontend-platform":
      "npm:@openedx/frontend-base-compat@^1.0.0",
    "@openedx/frontend-plugin-framework":
      "npm:@openedx/frontend-base-compat@^1.0.0"
  }
}
```

## `@edx/frontend-platform` compatibility

With the first `overrides` entry in place, plugin code that imports from `@edx/frontend-platform` keeps working unchanged:

```ts
import { getConfig, camelCaseObject } from '@edx/frontend-platform';
import { useIntl, defineMessages } from '@edx/frontend-platform/i18n';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
```

The i18n and auth subpaths re-export frontend-base's existing implementations directly. `getConfig()` returns a Proxy that resolves UPPER_SNAKE_CASE keys against:

1. A curated translation table mirroring edx-platform's `SITE_CONFIG_TRANSLATION_MAP` (`SITE_NAME`, `BASE_URL`, `LMS_BASE_URL`, `LOGIN_URL`, `LOGOUT_URL`, `LOGO_URL → headerLogoImageUrl`, `ACCESS_TOKEN_COOKIE_NAME`, `LANGUAGE_PREFERENCE_COOKIE_NAME`, `USER_INFO_COOKIE_NAME`, `CSRF_TOKEN_API_PATH`, `REFRESH_ACCESS_TOKEN_API_PATH`, `SEGMENT_KEY`), reading the corresponding camelCase field from `getSiteConfig()`.
2. `getSiteConfig().commonAppConfig` for everything else, which is where edx-platform's compatibility layer puts non-translated `MFE_CONFIG` values (`INDIGO_*`, plugin-specific keys, etc.).

Unknown keys return `undefined`. The Proxy re-reads `getSiteConfig()` on every access, so it stays current under `mergeSiteConfig` updates.

## FPF compatibility

In `site.config.build.tsx` / `site.config.dev.tsx`, import the legacy `env.config.jsx` and register a shim `App`:

```tsx
import { createLegacyPluginApp } from '@openedx/frontend-base-compat';
import envConfig from './env.config.jsx';

const config: SiteConfig = {
  // ...
  apps: [
    // ... regular frontend-base Apps ...
    createLegacyPluginApp({
      appId: 'org.openedx.frontend.app.compat',
      envConfig,
    }),
  ],
};
```

`createLegacyPluginApp` also accepts optional `slotMap` and `widgetMap` arguments that override or extend the shim's curated `defaultSlotMap` and `defaultWidgetMap`. The typical pattern is to spread the defaults and add site- or plugin-specific deltas:

```tsx
import {
  createLegacyPluginApp,
  defaultSlotMap,
  defaultWidgetMap,
} from '@openedx/frontend-base-compat';
import envConfig, { compatSlotMap, compatWidgetMap } from './env.config.compat.jsx';

createLegacyPluginApp({
  appId: 'org.openedx.frontend.app.compat',
  envConfig,
  slotMap: { ...defaultSlotMap, ...compatSlotMap },
  widgetMap: { ...defaultWidgetMap, ...compatWidgetMap },
});
```

Tutor sites get this wiring out of the box from `tutor-mfe`'s `env.config.compat.jsx` template, where downstream Tutor plugins contribute deltas via `ENV_PATCHES` hooks.

## Supported FPF translations

| FPF op | Translation |
| --- | --- |
| `Insert` (`DIRECT_PLUGIN`) | `WidgetOperationTypes.APPEND` with `component`/`element`. |
| `Insert` (`IFRAME_PLUGIN`) | `WidgetOperationTypes.APPEND` with `url`/`title`. |
| `Hide` | `WidgetOperationTypes.REMOVE`. Against `default_contents` (or `keepDefault: false`), the shim emits the union of three layers: a synthetic `defaultContent` REMOVE per mapped sub-slot, one REMOVE per APPEND/PREPEND discovered in mapped apps' `slots`, and one REMOVE per entry in the slot's curated `targetDefaultContent.widgetMap`. |
| `Wrap` | Best-effort: a `LayoutOperationTypes.REPLACE` whose layout feeds the targeted widget into the FPF wrapper using FPF's `{ component, pluginProps }` shape (pluginProps come from `<PluginSlot pluginProps={...}>`). Wrappers that read FPF-private context warn. |
| `Modify`, `slotOptions.mergeProps` | Not translated; warn once per occurrence. |
| `priority` | Consumed as a sort key over translated ops. |

## Status

This package is a migration aid and is expected to be removed when the FPF deprecation timeline closes.

## License

[AGPL-3.0](LICENSE)
