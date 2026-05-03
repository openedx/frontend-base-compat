import { setSiteConfig, WidgetOperationTypes } from '@openedx/frontend-base';

import { createLegacyPluginApp } from './createLegacyPluginApp';
import { _resetWarnings } from './translate';

const HEADER_APP_ID = 'org.openedx.frontend.app.header';
const DESKTOP_LEFT = 'org.openedx.frontend.slot.header.desktopLeft.v1';
const DESKTOP_RIGHT = 'org.openedx.frontend.slot.header.desktopRight.v1';
const COMPAT_APP_ID = 'org.openedx.frontend.app.compat';

const SimpleWidget = () => null;

describe('createLegacyPluginApp', () => {
  beforeEach(() => {
    _resetWarnings();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an App whose lazy slots getter translates env.config.jsx', () => {
    const setConfig = () => ({
      pluginSlots: {
        'org.openedx.frontend.layout.header_desktop.v1': {
          keepDefault: true,
          plugins: [{
            op: 'insert' as const,
            widget: { id: 'acme.help', type: 'DIRECT_PLUGIN' as const, priority: 60, RenderWidget: SimpleWidget },
          }],
        },
      },
    });

    const app = createLegacyPluginApp({
      appId: COMPAT_APP_ID,
      envConfig: setConfig,
    });

    setSiteConfig({
      siteId: 'test',
      apps: [
        { appId: HEADER_APP_ID, slots: [] },
        app,
      ],
    } as any);

    expect(app.appId).toBe(COMPAT_APP_ID);
    const slots = app.slots!;
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({
      slotId: DESKTOP_RIGHT,
      id: 'acme.help',
      op: WidgetOperationTypes.APPEND,
    });
  });

  it('reuses translated slots across reads while the apps reference is unchanged', () => {
    const app = createLegacyPluginApp({
      appId: COMPAT_APP_ID,
      envConfig: () => ({ pluginSlots: {} }),
    });

    setSiteConfig({ siteId: 'test', apps: [app] } as any);

    expect(app.slots).toBe(app.slots);
  });

  it('re-translates when getSiteConfig().apps is replaced', () => {
    /* setSiteConfig and mergeSiteConfig both swap the apps reference, so the
     * cache must invalidate or the compat app would render stale ops against
     * apps that registered later. */
    const app = createLegacyPluginApp({
      appId: COMPAT_APP_ID,
      envConfig: () => ({
        pluginSlots: {
          'org.openedx.frontend.layout.header_desktop.v1': {
            keepDefault: false,
            plugins: [],
          },
        },
      }),
    });

    setSiteConfig({ siteId: 'test', apps: [app] } as any);
    const before = app.slots!;
    /* No header app yet -> only the synthetic defaultContent REMOVEs. */
    expect(before.some((op) => (op as any).relatedId === 'org.openedx.frontend.widget.header.desktopLogo.v1')).toBe(false);

    setSiteConfig({
      siteId: 'test',
      apps: [
        {
          appId: HEADER_APP_ID,
          slots: [
            {
              slotId: DESKTOP_LEFT,
              id: 'org.openedx.frontend.widget.header.desktopLogo.v1',
              op: WidgetOperationTypes.APPEND,
              element: null,
            },
          ],
        },
        app,
      ],
    } as any);

    const after = app.slots!;
    expect(after).not.toBe(before);
    expect(after.some((op) => (op as any).relatedId === 'org.openedx.frontend.widget.header.desktopLogo.v1')).toBe(true);
  });

  it('filters its own appId out of the apps it introspects', () => {
    /* Without the self-filter, the getter would re-enter itself and explode. */
    const setConfig = () => ({
      pluginSlots: {
        'org.openedx.frontend.layout.header_desktop.v1': {
          keepDefault: false,
          plugins: [],
        },
      },
    });

    const app = createLegacyPluginApp({
      appId: COMPAT_APP_ID,
      envConfig: setConfig,
    });

    /* No header app -> only synthetic defaultContent REMOVEs (one per split sub-slot). */
    setSiteConfig({ siteId: 'test', apps: [app] } as any);
    const slots = app.slots!;
    expect(slots).toHaveLength(2);
    slots.forEach((op) => {
      expect(op.op).toBe(WidgetOperationTypes.REMOVE);
      expect((op as any).relatedId).toBe('defaultContent');
    });
  });

  it('introspects sibling apps registered before it in the apps array', () => {
    const setConfig = () => ({
      pluginSlots: {
        'org.openedx.frontend.layout.header_desktop.v1': {
          keepDefault: false,
          plugins: [],
        },
      },
    });

    const app = createLegacyPluginApp({
      appId: COMPAT_APP_ID,
      envConfig: setConfig,
    });

    setSiteConfig({
      siteId: 'test',
      apps: [
        {
          appId: HEADER_APP_ID,
          slots: [
            {
              slotId: DESKTOP_LEFT,
              id: 'org.openedx.frontend.widget.header.desktopLogo.v1',
              op: WidgetOperationTypes.APPEND,
              element: null,
            },
          ],
        },
        app,
      ],
    } as any);

    const slots = app.slots!;
    const realRemoves = slots.filter(
      (op) => op.op === WidgetOperationTypes.REMOVE && (op as any).relatedId !== 'defaultContent',
    );
    expect(realRemoves).toHaveLength(1);
    expect((realRemoves[0] as any).relatedId).toBe('org.openedx.frontend.widget.header.desktopLogo.v1');
  });

  it('accepts an env.config module namespace whose default is a setConfig function', () => {
    const moduleNamespace = {
      default: () => ({
        pluginSlots: {
          'org.openedx.frontend.layout.header_desktop.v1': {
            keepDefault: true,
            plugins: [{
              op: 'insert' as const,
              widget: { id: 'acme.x', type: 'DIRECT_PLUGIN' as const, RenderWidget: SimpleWidget },
            }],
          },
        },
      }),
    };

    const app = createLegacyPluginApp({
      appId: COMPAT_APP_ID,
      envConfig: moduleNamespace,
    });
    setSiteConfig({ siteId: 'test', apps: [app] } as any);
    expect(app.slots!).toHaveLength(1);
  });
});
