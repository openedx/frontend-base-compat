import { ComponentType, ReactNode } from 'react';
import { Slot } from '@openedx/frontend-base';

import { defaultSlotMap } from '../mappings/slotMap';
import { resolveTargetSlot } from '../mappings/resolve';
import { SlotMap } from '../types';

interface LegacySlotOptions {
  mergeProps?: boolean,
}

export interface PluginSlotProps {
  as?: ComponentType<any> | string,
  children?: ReactNode,
  id: string,
  idAliases?: string[],
  pluginProps?: Record<string, unknown>,
  slotOptions?: LegacySlotOptions,
  slotErrorFallbackComponent?: ReactNode,
  /* Test-only override; production uses `defaultSlotMap`. */
  slotMap?: SlotMap,
}

/* FPF drop-in. Forwards `pluginProps` nested (not spread) so `Wrap` layouts can read it. */
function PluginSlot({
  children,
  id,
  idAliases,
  pluginProps,
  slotOptions,
  slotMap = defaultSlotMap,
}: PluginSlotProps) {
  const target = resolveTargetSlot(id, idAliases, slotMap);
  if (target === null) {
    warnOnce(`unmapped-slot:${id}`, `[fpf-compat] PluginSlot: no mapping for legacy slot id "${id}"; rendering children only.`);
    return <>{children}</>;
  }

  if (slotOptions?.mergeProps) {
    warnOnce(`mergeProps:${target}`, `[fpf-compat] PluginSlot: slotOptions.mergeProps is not supported; ignoring on slot "${id}".`);
  }

  return (
    <Slot id={target} pluginProps={pluginProps ?? {}}>
      {children}
    </Slot>
  );
}

PluginSlot.displayName = 'PluginSlot';

export default PluginSlot;

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) {
    return;
  }
  warned.add(key);
  console.warn(message);
}
