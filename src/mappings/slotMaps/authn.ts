import { SlotMap } from '../../types';

const loginComponentSlotId = 'org.openedx.frontend.slot.authn.loginComponent.v1';

/*
 * frontend-app-authn: legacy slot ids -> frontend-app-authn-frontend-base ids.
 * Defaults come from JSX children, so synthetic-defaultContent removal is enough.
 */
export const authnSlotMap: SlotMap = {
  'org.openedx.frontend.authn.login_component.v1': {
    targetSlotId: loginComponentSlotId,
  },
};
