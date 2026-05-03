import { ComponentType, isValidElement, ReactElement } from 'react';
import {
  App,
  IFrameWidget,
  LayoutOperationTypes,
  SlotOperation,
  WidgetOperationTypes,
} from '@openedx/frontend-base';

import { resolveSlotEntry } from './mappings/resolve';
import {
  LegacyEnvConfig,
  LegacyHideEntry,
  LegacyInsertEntry,
  LegacyPluginEntry,
  LegacyWrapEntry,
  SlotMap,
  SlotMappingEntry,
  TranslateOutput,
  WidgetMap,
} from './types';
import { createWrapLayout } from './wrap';

interface TranslateArgs {
  envConfig: LegacyEnvConfig,
  slotMap: SlotMap,
  widgetMap: WidgetMap,
  apps: App[],
}

const SYNTHETIC_DEFAULT_CONTENT_ID = 'defaultContent';

/* Pure translation. The lazy `slots` getter calls this once; tests call it directly. */
export function translate({
  envConfig,
  slotMap,
  widgetMap,
  apps,
}: TranslateArgs): TranslateOutput {
  const ops: SlotOperation[] = [];
  const pluginSlots = envConfig.pluginSlots ?? {};

  for (const [legacyId, slotConfig] of Object.entries(pluginSlots)) {
    const entry = resolveSlotEntry(legacyId, undefined, slotMap);
    if (entry === null) {
      warnOnce(`unmapped:${legacyId}`, `[fpf-compat] no mapping for legacy slot id "${legacyId}"; skipping ${slotConfig.plugins?.length ?? 0} op(s).`);
      continue;
    }

    if (slotConfig.slotOptions?.mergeProps) {
      warnOnce(`mergeProps:${legacyId}`, `[fpf-compat] slotOptions.mergeProps is not supported; ignoring on slot "${legacyId}".`);
    }

    /* FPF priority ascending; missing defaults to 50 (FPF's default_contents priority). */
    const sorted = [...(slotConfig.plugins ?? [])].sort(
      (a, b) => priorityOf(a) - priorityOf(b),
    );

    if (slotConfig.keepDefault === false) {
      ops.push(...emitHideDefaults(entry, apps));
    }

    for (const plugin of sorted) {
      switch (plugin.op) {
        case 'insert':
          ops.push(...emitInsert(plugin, entry, widgetMap));
          break;
        case 'hide':
          ops.push(...emitHide(plugin, entry, widgetMap, apps));
          break;
        case 'wrap':
          ops.push(...emitWrap(plugin, entry, widgetMap, apps));
          break;
        case 'modify':
          warnOnce(
            `modify:${legacyId}:${plugin.widgetId}`,
            `[fpf-compat] PLUGIN_OPERATIONS.Modify is not supported; ignoring on slot "${legacyId}" widgetId "${plugin.widgetId}".`,
          );
          break;
        default:
          warnOnce(
            `unknown-op:${legacyId}:${(plugin as LegacyPluginEntry).op}`,
            `[fpf-compat] unknown plugin op "${(plugin as LegacyPluginEntry).op}" on slot "${legacyId}"; ignoring.`,
          );
      }
    }
  }

  return ops;
}

function priorityOf(entry: LegacyPluginEntry): number {
  if (entry.op === 'insert') {
    return entry.widget.priority ?? 50;
  }
  return 50;
}

function emitInsert(
  entry: LegacyInsertEntry,
  mapping: SlotMappingEntry,
  widgetMap: WidgetMap,
): SlotOperation[] {
  const widget = entry.widget;
  const overrideSlotId = widgetMap[widget.id];
  const slotId = overrideSlotId ?? mapping.targetSlotId;

  /* Anchor only applies when the widget lands in the slot the mapping declared. */
  const anchor = overrideSlotId ? null : resolveInsertAnchor(mapping);

  if (widget.type === 'IFRAME_PLUGIN') {
    return [withAnchor({
      slotId,
      id: widget.id,
      element: <IFrameWidget url={widget.url} title={widget.title} />,
    }, anchor)];
  }

  if (widget.type === 'DIRECT_PLUGIN') {
    const renderer = widget.RenderWidget;
    if (isValidElement(renderer)) {
      return [withAnchor({
        slotId,
        id: widget.id,
        element: renderer,
      }, anchor)];
    }
    return [withAnchor({
      slotId,
      id: widget.id,
      component: renderer as ComponentType,
    }, anchor)];
  }

  /* Cast lets us read `id`/`type` after the union has been exhausted above. */
  const unknown = widget as { id?: string, type?: string };
  warnOnce(
    `unknown-widget-type:${unknown.id}`,
    `[fpf-compat] unknown widget type "${unknown.type}" for "${unknown.id}"; skipping.`,
  );
  return [];
}

type InsertAnchor = { op: WidgetOperationTypes.INSERT_BEFORE | WidgetOperationTypes.INSERT_AFTER, relatedId: string };

function resolveInsertAnchor(mapping: SlotMappingEntry): InsertAnchor | null {
  if (mapping.insertBefore) {
    return { op: WidgetOperationTypes.INSERT_BEFORE, relatedId: mapping.insertBefore };
  }
  if (mapping.insertAfter) {
    return { op: WidgetOperationTypes.INSERT_AFTER, relatedId: mapping.insertAfter };
  }
  return null;
}

function withAnchor(
  base: { slotId: string, id: string, element?: ReactElement, component?: ComponentType },
  anchor: InsertAnchor | null,
): SlotOperation {
  if (anchor) {
    return { ...base, op: anchor.op, relatedId: anchor.relatedId } as SlotOperation;
  }
  return { ...base, op: WidgetOperationTypes.APPEND } as SlotOperation;
}

function emitHide(
  entry: LegacyHideEntry,
  mapping: ReturnType<typeof resolveSlotEntry>,
  widgetMap: WidgetMap,
  apps: App[],
): SlotOperation[] {
  if (mapping === null) {
    return [];
  }
  if (entry.widgetId === 'default_contents') {
    return emitHideDefaults(mapping, apps);
  }

  const owningSlot = locateOwningSlot(entry.widgetId, mapping, widgetMap, apps);
  if (owningSlot === null) {
    warnOnce(
      `hide-untraced:${entry.widgetId}`,
      `[fpf-compat] PLUGIN_OPERATIONS.Hide for widgetId "${entry.widgetId}" could not locate the owning slot; emitting REMOVE on default target.`,
    );
  }
  return [{
    slotId: owningSlot ?? mapping.targetSlotId,
    op: WidgetOperationTypes.REMOVE,
    relatedId: entry.widgetId,
  }];
}

function emitHideDefaults(
  mapping: NonNullable<ReturnType<typeof resolveSlotEntry>>,
  apps: App[],
): SlotOperation[] {
  const target = mapping.targetDefaultContent ?? {
    slotIds: [mapping.targetSlotId],
  };
  const slotIds = target.slotIds ?? [];
  const fromAppIds = target.fromAppIds ?? [];
  const out: SlotOperation[] = [];

  /* 1. Synthetic JSX-children defaultContent. */
  for (const slotId of slotIds) {
    out.push({
      slotId,
      op: WidgetOperationTypes.REMOVE,
      relatedId: SYNTHETIC_DEFAULT_CONTENT_ID,
    });
  }

  /* 2. APPEND/PREPEND ops on `slotIds` from `fromAppIds` apps; dynamic so renames propagate. */
  const targetIds = new Set(slotIds);
  for (const app of apps) {
    if (!fromAppIds.includes(app.appId)) {
      continue;
    }
    if (!Array.isArray(app.slots)) {
      continue;
    }
    for (const op of app.slots) {
      if (!targetIds.has(op.slotId)) {
        continue;
      }
      if (
        op.op !== WidgetOperationTypes.APPEND
        && op.op !== WidgetOperationTypes.PREPEND
      ) {
        continue;
      }
      const id = (op as { id?: string }).id;
      if (typeof id !== 'string') {
        continue;
      }
      out.push({
        slotId: op.slotId,
        op: WidgetOperationTypes.REMOVE,
        relatedId: id,
      });
    }
  }

  /* 3. Curated widgets the dynamic scan can't see (e.g. helper-registered). */
  if (mapping.targetDefaultContent?.widgetMap) {
    for (const [widgetId, slotId] of Object.entries(mapping.targetDefaultContent.widgetMap)) {
      out.push({
        slotId,
        op: WidgetOperationTypes.REMOVE,
        relatedId: widgetId,
      });
    }
  }

  return out;
}

function locateOwningSlot(
  widgetId: string,
  mapping: NonNullable<ReturnType<typeof resolveSlotEntry>>,
  widgetMap: WidgetMap,
  apps: App[],
): string | null {
  if (widgetMap[widgetId]) {
    return widgetMap[widgetId];
  }

  const candidateSlots = new Set<string>([
    mapping.targetSlotId,
    ...(mapping.targetDefaultContent?.slotIds ?? []),
  ]);

  for (const app of apps) {
    if (!Array.isArray(app.slots)) {
      continue;
    }
    for (const op of app.slots) {
      if (!candidateSlots.has(op.slotId) && mapping.targetDefaultContent) {
        continue;
      }
      const id = (op as { id?: string }).id;
      if (id === widgetId) {
        return op.slotId;
      }
    }
  }

  /* Fallback: widget may live outside the curated sub-slots. */
  for (const app of apps) {
    if (!Array.isArray(app.slots)) {
      continue;
    }
    for (const op of app.slots) {
      const id = (op as { id?: string }).id;
      if (id === widgetId) {
        return op.slotId;
      }
    }
  }

  return null;
}

function emitWrap(
  entry: LegacyWrapEntry,
  mapping: NonNullable<ReturnType<typeof resolveSlotEntry>>,
  widgetMap: WidgetMap,
  apps: App[],
): SlotOperation[] {
  const wrapper = entry.wrapper as ComponentType<{
    component: ReactElement,
    idx?: number,
    count?: number,
  }> | undefined;
  if (typeof wrapper !== 'function') {
    warnOnce(
      `wrap-no-fn:${entry.widgetId}`,
      `[fpf-compat] PLUGIN_OPERATIONS.Wrap on widgetId "${entry.widgetId}" has no wrapper component; skipping.`,
    );
    return [];
  }

  if (entry.widgetId === 'default_contents') {
    const splitSlotIds = mapping.targetDefaultContent?.slotIds ?? [];
    const isSplit = splitSlotIds.length > 1
      || (splitSlotIds.length === 1 && splitSlotIds[0] !== mapping.targetSlotId);
    if (!isSplit) {
      /* Atomized: wrap only the synthetic defaultContent widget so Inserts stay untouched. */
      return [{
        slotId: mapping.targetSlotId,
        op: LayoutOperationTypes.REPLACE,
        component: createWrapLayout({ wrapper, widgetId: SYNTHETIC_DEFAULT_CONTENT_ID }),
      }];
    }
    /* Split: best-effort wrap of every widget in each sub-slot (over-wraps Inserts). */
    return splitSlotIds.map((slotId) => ({
      slotId,
      op: LayoutOperationTypes.REPLACE,
      component: createWrapLayout({ wrapper }),
    }));
  }

  const owningSlot = locateOwningSlot(entry.widgetId, mapping, widgetMap, apps)
    ?? mapping.targetSlotId;
  return [{
    slotId: owningSlot,
    op: LayoutOperationTypes.REPLACE,
    component: createWrapLayout({ wrapper, widgetId: entry.widgetId }),
  }];
}

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) {
    return;
  }
  warned.add(key);
  console.warn(message);
}

/* Test-only: clear the once-per-process warning cache. */
export function _resetWarnings() {
  warned.clear();
}
