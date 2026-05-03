import { SlotMap, SlotMappingEntry } from '../types';

/* Direct lookup first, then `sourceAliases`. Returns null if unmapped. */
export function resolveTargetSlot(
  legacyId: string,
  idAliases: string[] | undefined,
  slotMap: SlotMap,
): string | null {
  const entry = resolveSlotEntry(legacyId, idAliases, slotMap);
  return entry ? entry.targetSlotId : null;
}

export function resolveSlotEntry(
  legacyId: string,
  idAliases: string[] | undefined,
  slotMap: SlotMap,
): SlotMappingEntry | null {
  if (slotMap[legacyId]) {
    return slotMap[legacyId];
  }
  const candidates = [legacyId, ...(idAliases ?? [])];
  for (const key of Object.keys(slotMap)) {
    const entry = slotMap[key];
    if (!entry.sourceAliases) {
      continue;
    }
    for (const alias of candidates) {
      if (entry.sourceAliases.includes(alias)) {
        return entry;
      }
    }
  }
  return null;
}
