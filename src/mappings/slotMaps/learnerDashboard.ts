import { SlotMap } from '../../types';

const courseCardBannerSlotId = 'org.openedx.frontend.slot.learnerDashboard.courseCardBanner.v1';
const courseCardActionSlotId = 'org.openedx.frontend.slot.learnerDashboard.courseCardAction.v1';
const courseListSlotId = 'org.openedx.frontend.slot.learnerDashboard.courseList.v1';
const dashboardModalSlotId = 'org.openedx.frontend.slot.learnerDashboard.dashboardModal.v1';
const noCoursesViewSlotId = 'org.openedx.frontend.slot.learnerDashboard.noCoursesView.v1';
const widgetSidebarSlotId = 'org.openedx.frontend.slot.learnerDashboard.widgetSidebar.v1';

/*
 * frontend-app-learner-dashboard: legacy ids -> frontend-base ids.
 * Defaults come from JSX children, so no `targetDefaultContent` is needed.
 * The legacy `footer.v1` slot is mapped by the global footer map.
 */
export const learnerDashboardSlotMap: SlotMap = {
  'org.openedx.frontend.learner_dashboard.course_card_banner.v1': {
    targetSlotId: courseCardBannerSlotId,
  },
  'org.openedx.frontend.learner_dashboard.course_card_action.v1': {
    sourceAliases: ['course_card_action_slot'],
    targetSlotId: courseCardActionSlotId,
  },
  'org.openedx.frontend.learner_dashboard.course_list.v1': {
    sourceAliases: ['course_list_slot'],
    targetSlotId: courseListSlotId,
  },
  'org.openedx.frontend.learner_dashboard.dashboard_modal.v1': {
    targetSlotId: dashboardModalSlotId,
  },
  'org.openedx.frontend.learner_dashboard.no_courses_view.v1': {
    sourceAliases: ['no_courses_view_slot'],
    targetSlotId: noCoursesViewSlotId,
  },
  'org.openedx.frontend.learner_dashboard.widget_sidebar.v1': {
    sourceAliases: ['widget_sidebar_slot'],
    targetSlotId: widgetSidebarSlotId,
  },
};
