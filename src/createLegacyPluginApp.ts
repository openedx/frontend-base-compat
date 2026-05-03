import { App, getSiteConfig, SlotOperation } from '@openedx/frontend-base';

import { defaultSlotMap } from './mappings/slotMap';
import { defaultWidgetMap } from './mappings/widgetMap';
import { translate } from './translate';
import {
  LegacyEnvConfig,
  LegacyEnvConfigInput,
  LegacyPluginAppArgs,
} from './types';

/*
 * App.slots is a lazy getter so the translator can introspect siblings (ADR 0001).
 * frontend-base reads `app.slots` on every <Slot> render via getSlotOperations,
 * so we memoize translate() output and re-run only when getSiteConfig().apps
 * is replaced (setSiteConfig / mergeSiteConfig both swap the apps reference).
 */
export function createLegacyPluginApp({
  appId,
  envConfig,
  slotMap = defaultSlotMap,
  widgetMap = defaultWidgetMap,
}: LegacyPluginAppArgs): App {
  const legacyConfig = resolveEnvConfig(envConfig);
  let cachedApps: App[] | undefined;
  let cachedOps: SlotOperation[] = [];

  return {
    appId,
    get slots(): SlotOperation[] {
      const apps = getSiteConfig().apps;
      if (apps !== cachedApps) {
        cachedApps = apps;
        cachedOps = translate({
          envConfig: legacyConfig,
          slotMap,
          widgetMap,
          apps: apps?.filter((a) => a.appId !== appId) ?? [],
        });
      }
      return cachedOps;
    },
  };
}

function resolveEnvConfig(input: LegacyEnvConfigInput): LegacyEnvConfig {
  /* Accept function, value, or ES-module namespace whose `default` is either. */
  const unwrapped = isModuleNamespace(input) ? input.default : input;
  if (typeof unwrapped === 'function') {
    return (unwrapped as () => LegacyEnvConfig)();
  }
  return unwrapped as LegacyEnvConfig;
}

function isModuleNamespace(
  input: LegacyEnvConfigInput,
): input is { default: any } {
  return (
    typeof input === 'object'
    && input !== null
    && 'default' in input
    && typeof (input as { default: unknown }).default !== 'undefined'
  );
}
