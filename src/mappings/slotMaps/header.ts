import { SlotMap } from '../../types';

const headerAppId = 'org.openedx.frontend.app.header';

const desktopLeftSlotId = 'org.openedx.frontend.slot.header.desktopLeft.v1';
const desktopRightSlotId = 'org.openedx.frontend.slot.header.desktopRight.v1';
const authMenuSlotId = 'org.openedx.frontend.slot.header.authenticatedMenu.v1';
const mobileCenterSlotId = 'org.openedx.frontend.slot.header.mobileCenter.v1';
const mobileMenuSlotId = 'org.openedx.frontend.slot.header.mobileMenu.v1';
const mobileRightSlotId = 'org.openedx.frontend.slot.header.mobileRight.v1';
const courseNavBarSlotId = 'org.openedx.frontend.slot.header.courseNavigationBar.v1';
const secondaryLinksSlotId = 'org.openedx.frontend.slot.header.secondaryLinks.v1';

/* Curated widget ids that count as legacy defaults of some slot. */
const helpButtonWidgetId = 'org.openedx.frontend.widget.header.help.v1';
const desktopLogoWidgetId = 'org.openedx.frontend.widget.header.desktopLogo.v1';
const desktopPrimaryLinksWidgetId = 'org.openedx.frontend.widget.header.desktopPrimaryLinks.v1';
const desktopSecondaryLinksWidgetId = 'org.openedx.frontend.widget.header.desktopSecondaryLinks.v1';

/* frontend-component-header plugin-slots -> frontend-base/shell/header sub-slots. */
export const headerSlotMap: SlotMap = {
  /* ----- Desktop ----- */
  'org.openedx.frontend.layout.header_desktop.v1': {
    sourceAliases: ['desktop_header_slot'],
    targetSlotId: desktopRightSlotId,
    targetDefaultContent: {
      slotIds: [desktopLeftSlotId, desktopRightSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_logo.v1': {
    sourceAliases: ['logo_slot'],
    targetSlotId: desktopLeftSlotId,
    /* Hide must spare the primary nav links that share desktopLeft. */
    targetDefaultContent: {
      widgetMap: { [desktopLogoWidgetId]: desktopLeftSlotId },
    },
  },
  'org.openedx.frontend.layout.header_desktop_main_menu.v1': {
    sourceAliases: ['desktop_main_menu_slot'],
    targetSlotId: desktopLeftSlotId,
    targetDefaultContent: {
      widgetMap: { [desktopPrimaryLinksWidgetId]: desktopLeftSlotId },
    },
  },
  'org.openedx.frontend.layout.header_desktop_secondary_menu.v2': {
    sourceAliases: ['desktop_secondary_menu_slot'],
    targetSlotId: desktopRightSlotId,
    /* Hide must spare auth/anon menus that share desktopRight. */
    targetDefaultContent: {
      widgetMap: { [desktopSecondaryLinksWidgetId]: desktopRightSlotId },
    },
  },
  'org.openedx.frontend.layout.header_desktop_user_menu.v1': {
    sourceAliases: ['desktop_user_menu_slot'],
    targetSlotId: authMenuSlotId,
    targetDefaultContent: {
      slotIds: [authMenuSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_desktop_user_menu_toggle.v1': {
    targetSlotId: desktopRightSlotId,
  },
  'org.openedx.frontend.layout.header_desktop_logged_out_items.v1': {
    sourceAliases: ['desktop_logged_out_items_slot'],
    targetSlotId: desktopRightSlotId,
  },

  /* ----- Mobile ----- */
  'org.openedx.frontend.layout.header_mobile.v1': {
    sourceAliases: ['mobile_header_slot'],
    targetSlotId: mobileRightSlotId,
    targetDefaultContent: {
      slotIds: [mobileCenterSlotId, mobileMenuSlotId, mobileRightSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_mobile_main_menu.v1': {
    sourceAliases: ['mobile_main_menu_slot'],
    targetSlotId: mobileMenuSlotId,
    targetDefaultContent: {
      slotIds: [mobileMenuSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_mobile_user_menu.v1': {
    sourceAliases: ['mobile_user_menu_slot'],
    targetSlotId: mobileRightSlotId,
  },
  'org.openedx.frontend.layout.header_mobile_user_menu_trigger.v1': {
    targetSlotId: mobileRightSlotId,
  },
  'org.openedx.frontend.layout.header_mobile_logged_out_items.v1': {
    sourceAliases: ['mobile_logged_out_items_slot'],
    targetSlotId: mobileRightSlotId,
  },

  /* ----- Misc ----- */
  'org.openedx.frontend.layout.header_notifications_tray.v1': {
    targetSlotId: desktopRightSlotId,
  },

  /* ----- Learning ----- */
  'org.openedx.frontend.layout.header_learning_help.v1': {
    sourceAliases: ['learning_help_slot'],
    targetSlotId: secondaryLinksSlotId,
    /* Help button is registered by `helpButtonSlotOperation` per app; name it explicitly. */
    targetDefaultContent: {
      widgetMap: {
        [helpButtonWidgetId]: secondaryLinksSlotId,
      },
    },
  },
  'org.openedx.frontend.layout.header_learning_user_menu.v1': {
    sourceAliases: ['learning_user_menu_slot'],
    targetSlotId: authMenuSlotId,
    targetDefaultContent: {
      slotIds: [authMenuSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_learning_user_menu_toggle.v1': {
    targetSlotId: desktopRightSlotId,
  },
  'org.openedx.frontend.layout.header_learning_logged_out_items.v1': {
    sourceAliases: ['learning_logged_out_items_slot'],
    targetSlotId: desktopRightSlotId,
  },
  'org.openedx.frontend.layout.header_learning_course_info.v1': {
    sourceAliases: ['course_info_slot'],
    targetSlotId: courseNavBarSlotId,
  },
  'org.openedx.frontend.layout.learning_header_actions.v1': {
    targetSlotId: desktopRightSlotId,
  },

  /* ----- Studio ----- */
  'org.openedx.frontend.layout.studio_header_actions.v1': {
    targetSlotId: desktopRightSlotId,
  },
  'org.openedx.frontend.layout.studio_header_search_button_slot.v1': {
    targetSlotId: desktopRightSlotId,
  },
};
