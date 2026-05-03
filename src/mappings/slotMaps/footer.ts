import { SlotMap } from '../../types';

const footerAppId = 'org.openedx.frontend.app.footer';

const footerDesktopSlotId = 'org.openedx.frontend.slot.footer.desktop.v1';
const footerTopSlotId = 'org.openedx.frontend.slot.footer.desktopTop.v1';
const footerCenterSlotId = 'org.openedx.frontend.slot.footer.desktopCenterLinks.v1';
const footerLeftSlotId = 'org.openedx.frontend.slot.footer.desktopLeftLinks.v1';
const footerRightSlotId = 'org.openedx.frontend.slot.footer.desktopRightLinks.v1';
const footerLegalSlotId = 'org.openedx.frontend.slot.footer.desktopLegalNotices.v1';

const allFooterSlotIds = [
  footerDesktopSlotId,
  footerTopSlotId,
  footerCenterSlotId,
  footerLeftSlotId,
  footerRightSlotId,
  footerLegalSlotId,
];

/* frontend-component-footer plugin-slots -> frontend-base/shell/footer sub-slots. */
export const footerSlotMap: SlotMap = {
  'org.openedx.frontend.layout.footer.v1': {
    sourceAliases: ['footer_slot', 'footer_plugin_slot'],
    /* Inserts land alongside the `desktopFooterLayout.v1` widget; pair with
     * `Hide default_contents` for the wholesale-replacement pattern. */
    targetSlotId: footerDesktopSlotId,
    targetDefaultContent: {
      slotIds: allFooterSlotIds,
      fromAppIds: [footerAppId],
    },
  },
  'org.openedx.frontend.layout.studio_footer.v1': {
    sourceAliases: ['studio_footer_slot'],
    targetSlotId: footerDesktopSlotId,
    targetDefaultContent: {
      slotIds: allFooterSlotIds,
      fromAppIds: [footerAppId],
    },
  },
  'org.openedx.frontend.layout.studio_footer_logo.v1': {
    sourceAliases: ['studio_footer_logo_slot'],
    targetSlotId: footerLeftSlotId,
  },
  'org.openedx.frontend.layout.studio_footer_help_button.v1': {
    targetSlotId: footerCenterSlotId,
  },
  'org.openedx.frontend.layout.studio_footer_help_section.v1': {
    targetSlotId: footerCenterSlotId,
  },
  'org.openedx.frontend.layout.studio_footer_help-content.v1': {
    targetSlotId: footerCenterSlotId,
  },
};
