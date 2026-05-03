export { createLegacyPluginApp } from './createLegacyPluginApp';
export { defaultWidgetMap } from './mappings/widgetMap';
export { defaultSlotMap } from './mappings/slotMap';
export { resolveTargetSlot, resolveSlotEntry } from './mappings/resolve';
export { translate } from './translate';
export * from './fpf';
export * from './platform';
export type {
  LegacyEnvConfig,
  LegacyEnvConfigInput,
  LegacyPluginAppArgs,
  LegacyPluginEntry,
  LegacyPluginSlotConfig,
  LegacyWidget,
  LegacyDirectWidget,
  LegacyIframeWidget,
  SlotMap,
  SlotMappingEntry,
  WidgetMap,
} from './types';
