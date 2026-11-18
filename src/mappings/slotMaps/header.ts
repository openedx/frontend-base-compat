import { SlotMap, SlotMappingEntry } from '../../types';

const headerAppId = 'org.openedx.frontend.app.header';

const desktopLeftSlotId = 'org.openedx.frontend.slot.header.desktopLeft.v1';
const desktopRightSlotId = 'org.openedx.frontend.slot.header.desktopRight.v1';
const primaryLinksSlotId = 'org.openedx.frontend.slot.header.primaryLinks.v1';
const secondaryLinksSlotId = 'org.openedx.frontend.slot.header.secondaryLinks.v1';
const authMenuSlotId = 'org.openedx.frontend.slot.header.authenticatedMenu.v1';
const anonMenuSlotId = 'org.openedx.frontend.slot.header.anonymousMenu.v1';
const mobileCenterSlotId = 'org.openedx.frontend.slot.header.mobileCenter.v1';
const mobileMenuLinksSlotId = 'org.openedx.frontend.slot.header.mobileMenuLinks.v1';
const mobileRightSlotId = 'org.openedx.frontend.slot.header.mobileRight.v1';

/* Curated widget ids that count as legacy defaults of some slot. */
const helpButtonWidgetId = 'org.openedx.frontend.widget.header.help.v1';
const desktopLogoWidgetId = 'org.openedx.frontend.widget.header.desktopLogo.v1';
const mobileLogoWidgetId = 'org.openedx.frontend.widget.header.mobileLogo.v1';
const desktopPrimaryLinksWidgetId = 'org.openedx.frontend.widget.header.desktopPrimaryLinks.v1';
const desktopSecondaryLinksWidgetId = 'org.openedx.frontend.widget.header.desktopSecondaryLinks.v1';
const desktopAuthenticatedMenuWidgetId = 'org.openedx.frontend.widget.header.desktopAuthenticatedMenu.v1';

/* Items of the user dropdown, which desktop and mobile share in the shell. */
const userMenuEntry: SlotMappingEntry = {
  targetSlotId: authMenuSlotId,
  targetDefaultContent: {
    slotIds: [authMenuSlotId],
    fromAppIds: [headerAppId],
  },
};

/* Register/sign-in buttons, only rendered for anonymous users; desktop and mobile share them too. */
const loggedOutItemsEntry: SlotMappingEntry = {
  targetSlotId: anonMenuSlotId,
  targetDefaultContent: {
    slotIds: [anonMenuSlotId],
    fromAppIds: [headerAppId],
  },
};

const secondaryMenuEntry: SlotMappingEntry = {
  targetSlotId: desktopRightSlotId,
  insertBefore: desktopAuthenticatedMenuWidgetId,
  /* Hide must spare auth/anon menus that share desktopRight. */
  targetDefaultContent: {
    widgetMap: { [desktopSecondaryLinksWidgetId]: desktopRightSlotId },
  },
};

/*
 * frontend-component-header plugin-slots -> frontend-base/shell/header sub-slots.
 *
 * Deliberately unmapped, because the shell has no equivalent (ops on them are
 * skipped with a warning):
 *   - `header_desktop_user_menu_toggle.v1`, `header_mobile_user_menu_trigger.v1`
 *     and `header_learning_user_menu_toggle.v1`: the toggle is a fixed
 *     `AvatarButton`, not a slot.
 *   - `header_learning_course_info.v1`: the course bar shows tabs, not the
 *     course org, number and title.
 */
export const headerSlotMap: SlotMap = {
  /* ----- Desktop ----- */
  'org.openedx.frontend.layout.header_desktop.v1': {
    sourceAliases: ['desktop_header_slot'],
    /*
     * The shell equivalent is `header.desktop.v1`, but its layout widget owns
     * the desktop-only media query: anything put next to it (or in its place)
     * would also show on mobile. Landing inside the layout keeps the legacy
     * desktop-only behavior.
     */
    targetSlotId: desktopRightSlotId,
    targetDefaultContent: {
      slotIds: [desktopLeftSlotId, desktopRightSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_logo.v1': {
    sourceAliases: ['logo_slot'],
    targetSlotId: desktopLeftSlotId,
    insertBefore: desktopPrimaryLinksWidgetId,
    /* The legacy slot was rendered by both headers; the shell's mobile logo is a separate widget. */
    extraTargetSlotIds: [mobileCenterSlotId],
    /* Hide must spare the primary nav links that share desktopLeft. */
    targetDefaultContent: {
      widgetMap: {
        [desktopLogoWidgetId]: desktopLeftSlotId,
        [mobileLogoWidgetId]: mobileCenterSlotId,
      },
    },
  },
  'org.openedx.frontend.layout.header_desktop_main_menu.v1': {
    sourceAliases: ['desktop_main_menu_slot'],
    targetSlotId: primaryLinksSlotId,
    /* The links are contributed by whichever apps the site runs, not by the header app. */
    targetDefaultContent: {
      slotIds: [primaryLinksSlotId],
      fromAppIds: '*',
    },
  },
  'org.openedx.frontend.layout.header_desktop_secondary_menu.v1': {
    sourceAliases: ['desktop_secondary_menu_slot'],
    ...secondaryMenuEntry,
  },
  'org.openedx.frontend.layout.header_desktop_secondary_menu.v2': secondaryMenuEntry,
  'org.openedx.frontend.layout.header_desktop_user_menu.v1': {
    sourceAliases: ['desktop_user_menu_slot'],
    ...userMenuEntry,
  },
  'org.openedx.frontend.layout.header_desktop_logged_out_items.v1': {
    sourceAliases: ['desktop_logged_out_items_slot'],
    ...loggedOutItemsEntry,
  },

  /* ----- Mobile ----- */
  'org.openedx.frontend.layout.header_mobile.v1': {
    sourceAliases: ['mobile_header_slot'],
    /* Inside the layout rather than `header.mobile.v1`, for the same reason as `header_desktop.v1`. */
    targetSlotId: mobileRightSlotId,
    targetDefaultContent: {
      slotIds: [mobileCenterSlotId, mobileMenuLinksSlotId, mobileRightSlotId],
      fromAppIds: [headerAppId],
    },
  },
  'org.openedx.frontend.layout.header_mobile_main_menu.v1': {
    sourceAliases: ['mobile_main_menu_slot'],
    /*
     * No `fromAppIds`: the header app's only widget here is the language
     * switcher, which was never part of the legacy menu, so Hide spares it.
     */
    targetSlotId: mobileMenuLinksSlotId,
    targetDefaultContent: {
      slotIds: [mobileMenuLinksSlotId],
    },
  },
  'org.openedx.frontend.layout.header_mobile_user_menu.v1': {
    sourceAliases: ['mobile_user_menu_slot'],
    ...userMenuEntry,
  },
  'org.openedx.frontend.layout.header_mobile_logged_out_items.v1': {
    sourceAliases: ['mobile_logged_out_items_slot'],
    ...loggedOutItemsEntry,
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
    ...userMenuEntry,
  },
  'org.openedx.frontend.layout.header_learning_logged_out_items.v1': {
    sourceAliases: ['learning_logged_out_items_slot'],
    ...loggedOutItemsEntry,
  },
  'org.openedx.frontend.layout.learning_header_actions.v1': {
    targetSlotId: desktopRightSlotId,
  },
  'org.openedx.frontend.layout.learning_header_actions.v2': {
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
