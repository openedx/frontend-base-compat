import { SlotMap } from '../../types';

/*
 * frontend-app-catalog: `legacy-mfe` slot ids -> frontend-base port ids.
 * A 1:1 rename, snake_case page paths to camelCase leaves. Every default comes
 * from JSX children (the port registers no widgets on these slots), so
 * synthetic-defaultContent removal is enough, and the legacy slots declare no
 * `idAliases`.
 */
export const catalogSlotMap: SlotMap = {
  /* ----- Course about page ----- */
  'org.openedx.frontend.catalog.course_about_page.course_image': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutCourseImage.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.course_media': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutCourseMedia.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.enrollment_button': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutEnrollmentButton.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.intro': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutIntro.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.intro_video_button': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutIntroVideoButton.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.intro_video_modal': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutIntroVideoModal.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.intro_video_modal_content': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutIntroVideoModalContent.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.overview': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutOverview.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.sidebar': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutSidebar.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.sidebar.details.course_price': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutSidebarCoursePrice.v1',
  },
  'org.openedx.frontend.catalog.course_about_page.sidebar.social': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseAboutSidebarSocial.v1',
  },

  /* ----- Course catalog page ----- */
  'org.openedx.frontend.catalog.course_catalog_page.data_table': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogDataTable.v1',
  },
  'org.openedx.frontend.catalog.course_catalog_page.data_table.card_view': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogDataTableCardView.v1',
  },
  'org.openedx.frontend.catalog.course_catalog_page.data_table.control_bar': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogDataTableControlBar.v1',
  },
  'org.openedx.frontend.catalog.course_catalog_page.data_table.course_card': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogDataTableCourseCard.v1',
  },
  'org.openedx.frontend.catalog.course_catalog_page.data_table.table_footer': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogDataTableTableFooter.v1',
  },
  'org.openedx.frontend.catalog.course_catalog_page.intro': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogIntro.v1',
  },
  'org.openedx.frontend.catalog.course_catalog_page.search_field': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.courseCatalogSearchField.v1',
  },

  /* ----- Home page ----- */
  'org.openedx.frontend.catalog.home_page.banner': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homeBanner.v1',
  },
  'org.openedx.frontend.catalog.home_page.course_card': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homeCourseCard.v1',
  },
  'org.openedx.frontend.catalog.home_page.courses_list': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homeCoursesList.v1',
  },
  'org.openedx.frontend.catalog.home_page.overlay_html': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homeOverlayHtml.v1',
  },
  'org.openedx.frontend.catalog.home_page.promo_video_button': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homePromoVideoButton.v1',
  },
  'org.openedx.frontend.catalog.home_page.promo_video_modal': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homePromoVideoModal.v1',
  },
  'org.openedx.frontend.catalog.home_page.promo_video_modal_content': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.homePromoVideoModalContent.v1',
  },

  /* ----- Generic ----- */
  'org.openedx.frontend.catalog.generic.loader': {
    targetSlotId: 'org.openedx.frontend.slot.catalog.loader.v1',
  },
};
