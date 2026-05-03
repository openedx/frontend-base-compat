import { App, getSiteConfig, SlotOperation } from '@openedx/frontend-base';

import { defaultSlotMap } from './mappings/slotMap';
import { defaultWidgetMap } from './mappings/widgetMap';
import { translate } from './translate';
import {
  LegacyEnvConfig,
  LegacyEnvConfigInput,
  LegacyPluginAppArgs,
} from './types';

/* App.slots is a lazy getter so the translator can introspect siblings (ADR 0001). */
export function createLegacyPluginApp({
  appId,
  envConfig,
  slotMap = defaultSlotMap,
  widgetMap = defaultWidgetMap,
}: LegacyPluginAppArgs): App {
  const legacyConfig = resolveEnvConfig(envConfig);
  let cached: SlotOperation[] | null = null;

  return {
    appId,
    get slots(): SlotOperation[] {
      if (cached === null) {
        cached = translate({
          envConfig: legacyConfig,
          slotMap,
          widgetMap,
          apps: getSiteConfig().apps?.filter((a) => a.appId !== appId) ?? [],
        });
      }
      return cached;
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
