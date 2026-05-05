import { RouteMap } from '../types';

/*
 * Curated `mfeId -> routeRoles` map. Role constants are duplicated from each
 * frontend-base port's `src/constants.ts` to keep this package dep-free.
 */
export const defaultRouteMap: RouteMap = {
  authn: [
    'org.openedx.frontend.role.login',
    'org.openedx.frontend.role.register',
    'org.openedx.frontend.role.resetPassword',
    'org.openedx.frontend.role.confirmPassword',
    'org.openedx.frontend.role.welcome',
  ],
  'learner-dashboard': [
    'org.openedx.frontend.role.dashboard',
  ],
};
