# `@openedx/frontend-base-compat`

A compatibility layer that lets legacy `@edx/frontend-platform` consumers and legacy `@openedx/frontend-plugin-framework` (FPF) `env.config.jsx` configuration run on top of [`@openedx/frontend-base`](https://github.com/openedx/frontend-base) sites, as a migration aid during the FPF deprecation window.

The package does three coupled jobs from one install:

- **`@edx/frontend-platform` drop-in.** It re-exports the i18n and auth surfaces from frontend-base (so `useIntl`, `defineMessages`, `getAuthenticatedHttpClient`, etc. resolve to frontend-base's implementations), and exposes a `getConfig` adapter that reads through to `getSiteConfig()` and `commonAppConfig`. A dependency alias points `@edx/frontend-platform[/...]` at the compat package, so real frontend-platform is never installed.

- **FPF drop-in.** It re-exports the public surface of `@openedx/frontend-plugin-framework` (`Plugin`, `PluginSlot`, `DIRECT_PLUGIN`, `IFRAME_PLUGIN`, `PLUGIN_OPERATIONS`) so the package can stand in for FPF via a second dependency alias.

- **FPF translation.** It exports `createLegacyPluginApp({ appId, envConfig, mfeId?, routeMap?, slotMap?, widgetMap? })`, which invokes a legacy `setConfig` function, translates its `pluginSlots` into a frontend-base `SlotOperation[]`, and returns an `App` whose `slots` carry the result. Pass `mfeId` to scope the translated ops to a single legacy MFE's routes.

See [ADR 0001](docs/decisions/0001-frontend-base-compatibility.rst) for the design and trade-offs.

## What this _doesn't_ do

The compat package only covers the runtime import surface of `@edx/frontend-platform` and `@openedx/frontend-plugin-framework`. The following concerns sit outside that boundary:

### Branding (DOM and CSS)

The shim does not shim DOM or CSS. Brand and plugin stylesheets written against legacy MFE markup no longer match what frontend-base renders, and operators are expected to rewrite the affected selectors or move the styling into brand theming. See [ADR 0001](docs/decisions/0001-frontend-base-compatibility.rst) for why a CSS shim is out of scope.

### Build tooling (`@openedx/frontend-build` / `fedx-scripts`)

The compat package does not provide any shims for `@openedx/frontend-build`. Plugin packages that ship `preinstall` hooks invoking `fedx-scripts` will fail to install in a frontend-base site, because the consumer tree does not have those build tools or the plugin's devDependencies.

## Install

In the site's `package.json`, install the compat package directly (so operator code can `import { createLegacyPluginApp, defaultSlotMap, ... } from '@openedx/frontend-base-compat'`), alias `@edx/frontend-platform` and `@openedx/frontend-plugin-framework` to it, and mirror those aliases in `overrides` with the exact same specs:

```json
{
  "dependencies": {
    "@openedx/frontend-base-compat": "^1.0.0",
    "@edx/frontend-platform": "npm:@openedx/frontend-base-compat@^1.0.0",
    "@openedx/frontend-plugin-framework": "npm:@openedx/frontend-base-compat@^1.0.0"
  },
  "overrides": {
    "@edx/frontend-platform": "npm:@openedx/frontend-base-compat@^1.0.0",
    "@openedx/frontend-plugin-framework": "npm:@openedx/frontend-base-compat@^1.0.0"
  }
}
```

The direct entry puts the compat package at `node_modules/@openedx/frontend-base-compat/` for the site's own imports. The two aliases additionally place the package at `node_modules/@edx/frontend-platform/` and `node_modules/@openedx/frontend-plugin-framework/`, so any import of either legacy name resolves to the stubs. The matching `overrides` entries force every transitive resolution (peer or regular) to the same alias, which is what lets plugins that pin these as peer dependencies at the real version ranges (e.g. `@openedx/frontend-plugin-aspects`, which pins `@edx/frontend-platform: ^8.3.1` and `@openedx/frontend-plugin-framework: ^1.7.0`) install without `ERESOLVE` and without needing `--legacy-peer-deps`. The two specs must match exactly; npm errors if a direct dep and its override disagree.

## `@edx/frontend-platform` compatibility

With the first alias in place, plugin code that imports from `@edx/frontend-platform` keeps working unchanged:

```ts
import { getConfig, camelCaseObject } from '@edx/frontend-platform';
import { useIntl, defineMessages } from '@edx/frontend-platform/i18n';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
```

The i18n and auth subpaths re-export frontend-base's existing implementations directly. `getConfig()` returns a Proxy that resolves UPPER_SNAKE_CASE keys against:

1. A curated translation table mirroring edx-platform's [`SITE_CONFIG_TRANSLATION_MAP`](https://github.com/openedx/edx-platform/blob/master/lms/djangoapps/mfe_config_api/views.py#L25), reading the corresponding camelCase field from `getSiteConfig()`.
2. `getSiteConfig().commonAppConfig` for everything else, which is where edx-platform's compatibility layer puts non-translated `MFE_CONFIG` values (`INDIGO_*`, plugin-specific keys, etc.).

Unknown keys return `undefined`. The Proxy re-reads `getSiteConfig()` on every access, so it stays current under `mergeSiteConfig` updates.

## FPF compatibility

Place the legacy `env.config.jsx` under the site's `src/` directory. (The frontend-base webpack config only runs `ts-loader` over files in `src/`.)  Then, in `site.config.build.tsx` / `site.config.dev.tsx`, import the legacy config and register a shim `App`:

```tsx
import { createLegacyPluginApp } from '@openedx/frontend-base-compat';
import envConfig from './src/env.config.jsx';

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
import envConfig, { compatSlotMap, compatWidgetMap } from './src/env.config.compat.jsx';

createLegacyPluginApp({
  appId: 'org.openedx.frontend.app.compat',
  envConfig,
  slotMap: { ...defaultSlotMap, ...compatSlotMap },
  widgetMap: { ...defaultWidgetMap, ...compatWidgetMap },
});
```

### Scoping a legacy `env.config.jsx` to an MFE's routes

A frontend-base site that hosts more than one legacy MFE in the same shell needs each MFE's plugin ops to fire only on that MFE's routes. Without scoping, a `Hide` for one MFE's chrome would leak into another's, since translated ops apply globally by default. Pass `mfeId` to opt every op for that app into `condition: { active: [...] }`, scoped to the route roles registered by the corresponding frontend-base port:

```tsx
import { createLegacyPluginApp } from '@openedx/frontend-base-compat';
import envConfig from './src/env.config.dashboard.jsx';

createLegacyPluginApp({
  appId: 'org.openedx.frontend.app.compat.learnerDashboard',
  envConfig,
  mfeId: 'learner-dashboard',
});
```

The shim ships `defaultRouteMap`, a curated `mfeId -> routeRoles[]` table covering the legacy MFEs whose frontend-base ports already exist (`learner-dashboard`, `authn`, ...). Override or extend it via the `routeMap` argument the same way as `slotMap`/`widgetMap`.

If `mfeId` is set but neither the supplied `routeMap` nor `defaultRouteMap` has an entry for it, the shim warns once and registers the app as a no-op.

### Supported FPF translations

| FPF op | Translation |
| --- | --- |
| `Insert` (`DIRECT_PLUGIN`) | `WidgetOperationTypes.APPEND` with `component`/`element`. |
| `Insert` (`IFRAME_PLUGIN`) | `WidgetOperationTypes.APPEND` with `url`/`title`. |
| `Hide` | `WidgetOperationTypes.REMOVE`. Against `default_contents` (or `keepDefault: false`), the shim emits the union of three layers: a synthetic `defaultContent` REMOVE per mapped sub-slot, one REMOVE per APPEND/PREPEND discovered in mapped apps' `slots`, and one REMOVE per entry in the slot's curated `targetDefaultContent.widgetMap`. |
| `Wrap` | Best-effort: a `LayoutOperationTypes.REPLACE` whose layout feeds the targeted widget into the FPF wrapper using FPF's `{ component, pluginProps }` shape (pluginProps come from `<PluginSlot pluginProps={...}>`). Wrappers that read FPF-private context warn. |
| `Modify`, `slotOptions.mergeProps` | Not translated; warn once per occurrence. |
| `priority` | Consumed as a sort key over translated ops. |

## Status

This package is a migration aid and is expected to be removed when the MFE deprecation timeline closes.

## License

[AGPL-3.0](LICENSE)
