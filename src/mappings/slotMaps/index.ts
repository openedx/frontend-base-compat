import { SlotMap } from '../../types';

import { authnSlotMap } from './authn';
import { footerSlotMap } from './footer';
import { headerSlotMap } from './header';
import { learnerDashboardSlotMap } from './learnerDashboard';

export { authnSlotMap } from './authn';
export { footerSlotMap } from './footer';
export { headerSlotMap } from './header';
export { learnerDashboardSlotMap } from './learnerDashboard';

/* Per-app slot maps. Add new apps here; on legacy-id collision the later entry wins. */
export const slotMaps: SlotMap[] = [
  headerSlotMap,
  footerSlotMap,
  authnSlotMap,
  learnerDashboardSlotMap,
];
