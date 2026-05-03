import { ComponentType, ReactElement } from 'react';
import { App, SlotOperation } from '@openedx/frontend-base';

/* Compared by string only; the shim never imports FPF. See `fpf/constants.ts`. */
export type LegacyOperation = 'insert' | 'hide' | 'modify' | 'wrap';

export type LegacyPluginType = 'DIRECT_PLUGIN' | 'IFRAME_PLUGIN';

export interface LegacyDirectWidget {
  id: string,
  type: 'DIRECT_PLUGIN',
  priority?: number,
  RenderWidget: ComponentType<any> | ReactElement,
}

export interface LegacyIframeWidget {
  id: string,
  type: 'IFRAME_PLUGIN',
  priority?: number,
  url: string,
  title: string,
}

export type LegacyWidget = LegacyDirectWidget | LegacyIframeWidget;

export interface LegacyInsertEntry {
  op: 'insert',
  widget: LegacyWidget,
}

export interface LegacyHideEntry {
  op: 'hide',
  widgetId: string,
}

export interface LegacyModifyEntry {
  op: 'modify',
  widgetId: string,
  fn: (...args: unknown[]) => unknown,
}

export interface LegacyWrapEntry {
  op: 'wrap',
  widgetId: string,
  wrapper: ComponentType<{ component: ReactElement, idx?: number, count?: number }>,
}

export type LegacyPluginEntry =
  | LegacyInsertEntry
  | LegacyHideEntry
  | LegacyModifyEntry
  | LegacyWrapEntry;

export interface LegacySlotOptions {
  mergeProps?: boolean,
  [key: string]: unknown,
}

export interface LegacyPluginSlotConfig {
  keepDefault?: boolean,
  plugins: LegacyPluginEntry[],
  slotOptions?: LegacySlotOptions,
}

export interface LegacyEnvConfig {
  pluginSlots?: Record<string, LegacyPluginSlotConfig>,
  [key: string]: unknown,
}

export type LegacySetConfig = () => LegacyEnvConfig;

export type LegacyEnvConfigInput =
  | LegacySetConfig
  | LegacyEnvConfig
  | { default: LegacySetConfig | LegacyEnvConfig };

/* Routing override: `widgetId` -> frontend-base slot id. */
export type WidgetMap = Record<string, string>;

export interface SlotMappingEntry {
  /* Legacy `idAliases` accepted by the old slot. */
  sourceAliases?: string[],
  /* Default landing slot for `Insert`; per-widget routing overrides via `widgetMap`. */
  targetSlotId: string,
  /*
   * Optional positional anchor for `Insert`. When set, emit an
   * INSERT_BEFORE / INSERT_AFTER op against the named widget id in
   * `targetSlotId` instead of APPEND. Compensates for FPF having no
   * concept of position relative to default content. Ignored when
   * `widgetMap` routes the widget to a different slot. If both are
   * set, `insertBefore` wins.
   */
  insertBefore?: string,
  insertAfter?: string,
  /*
   * Used by `Hide default_contents` / `keepDefault: false`. Additive layers:
   *   - `slotIds`: REMOVE synthetic `defaultContent` on each (covers JSX-children defaults).
   *   - `fromAppIds`: REMOVE every APPEND/PREPEND in those apps whose slotId is in `slotIds`.
   *   - `widgetMap`: curated `widgetId -> slotId` for widgets the dynamic scan can't see.
   * Omit the field to fall back to a synthetic REMOVE on `targetSlotId`.
   */
  targetDefaultContent?: {
    slotIds?: string[],
    fromAppIds?: string[],
    widgetMap?: WidgetMap,
  },
}

export type SlotMap = Record<string, SlotMappingEntry>;

export interface LegacyPluginAppArgs {
  appId: string,
  envConfig: LegacyEnvConfigInput,
  slotMap?: SlotMap,
  widgetMap?: WidgetMap,
}

/* Decoupled from the lazy `slots` getter so `translate()` is pure-function-testable. */
export interface TranslateInput {
  envConfig: LegacyEnvConfig,
  slotMap: SlotMap,
  widgetMap: WidgetMap,
  apps: App[],
}

export type TranslateOutput = SlotOperation[];
