import { SlotMap } from '../types';
import { slotMaps } from './slotMaps';

/* Composed from per-app contributions in `./slotMaps/`. See ADR 0001 for semantics. */
export const defaultSlotMap: SlotMap = Object.assign({}, ...slotMaps);
