import { render } from '@testing-library/react';
import {
  App,
  LayoutOperationTypes,
  Slot,
  WidgetOperationTypes,
  setSiteConfig,
} from '@openedx/frontend-base';

import { defaultSlotMap } from './mappings/slotMap';
import { translate, _resetWarnings } from './translate';
import {
  LegacyEnvConfig,
  LegacyPluginEntry,
  SlotMap,
} from './types';

const HEADER_APP_ID = 'org.openedx.frontend.app.header';
const DESKTOP_LEFT = 'org.openedx.frontend.slot.header.desktopLeft.v1';
const DESKTOP_RIGHT = 'org.openedx.frontend.slot.header.desktopRight.v1';
const HEADER_DESKTOP_LEGACY = 'org.openedx.frontend.layout.header_desktop.v1';
const HEADER_LOGO_LEGACY = 'org.openedx.frontend.layout.header_logo.v1';

function fakeHeaderApp(): App {
  return {
    appId: HEADER_APP_ID,
    slots: [
      {
        slotId: DESKTOP_LEFT,
        id: 'org.openedx.frontend.widget.header.desktopLogo.v1',
        op: WidgetOperationTypes.APPEND,
        element: null,
      },
      {
        slotId: DESKTOP_LEFT,
        id: 'org.openedx.frontend.widget.header.desktopPrimaryLinks.v1',
        op: WidgetOperationTypes.APPEND,
        element: null,
      },
      {
        slotId: DESKTOP_RIGHT,
        id: 'org.openedx.frontend.widget.header.desktopSecondaryLinks.v1',
        op: WidgetOperationTypes.APPEND,
        element: null,
      },
      {
        slotId: DESKTOP_RIGHT,
        id: 'org.openedx.frontend.widget.header.desktopAuthenticatedMenu.v1',
        op: WidgetOperationTypes.APPEND,
        element: null,
      },
    ] as App['slots'],
  };
}

function envConfig(plugins: LegacyPluginEntry[], opts: { keepDefault?: boolean, slotId?: string, slotOptions?: Record<string, unknown> } = {}): LegacyEnvConfig {
  return {
    pluginSlots: {
      [opts.slotId ?? HEADER_DESKTOP_LEGACY]: {
        keepDefault: opts.keepDefault,
        plugins,
        slotOptions: opts.slotOptions,
      },
    },
  };
}

const SimpleWidget = () => null;
const Wrapper = ({ component }: { component: any }) => component;

describe('translate', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    _resetWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('translates Insert + DIRECT_PLUGIN to APPEND with component', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'insert',
        widget: { id: 'acme.help_link', type: 'DIRECT_PLUGIN', priority: 60, RenderWidget: SimpleWidget },
      }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toEqual([
      {
        slotId: DESKTOP_RIGHT,
        id: 'acme.help_link',
        op: WidgetOperationTypes.APPEND,
        component: SimpleWidget,
      },
    ]);
  });

  it('translates Insert + IFRAME_PLUGIN to APPEND with iframe element', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'insert',
        widget: { id: 'acme.iframe', type: 'IFRAME_PLUGIN', url: 'https://x', title: 'X' },
      }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toHaveLength(1);
    const op = ops[0] as any;
    expect(op.slotId).toBe(DESKTOP_RIGHT);
    expect(op.op).toBe(WidgetOperationTypes.APPEND);
    expect(op.element).toBeTruthy();
  });

  it('routes Insert through widgetMap when present', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'insert',
        widget: { id: 'acme.logo', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }]),
      widgetMap: { 'acme.logo': DESKTOP_LEFT },
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toHaveLength(1);
    expect((ops[0] as any).slotId).toBe(DESKTOP_LEFT);
  });

  it('emits INSERT_BEFORE when the slot mapping declares insertBefore', () => {
    const map: SlotMap = {
      'legacy.v1': {
        targetSlotId: 'fb.slot.a',
        insertBefore: 'fb.widget.anchor',
      },
    };
    const ops = translate({
      envConfig: { pluginSlots: { 'legacy.v1': { plugins: [{
        op: 'insert',
        widget: { id: 'acme.x', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }] } } },
      slotMap: map,
      widgetMap: {},
      apps: [],
    });
    expect(ops).toEqual([
      {
        slotId: 'fb.slot.a',
        id: 'acme.x',
        op: WidgetOperationTypes.INSERT_BEFORE,
        relatedId: 'fb.widget.anchor',
        component: SimpleWidget,
      },
    ]);
  });

  it('emits INSERT_AFTER when the slot mapping declares insertAfter', () => {
    const map: SlotMap = {
      'legacy.v1': {
        targetSlotId: 'fb.slot.a',
        insertAfter: 'fb.widget.anchor',
      },
    };
    const ops = translate({
      envConfig: { pluginSlots: { 'legacy.v1': { plugins: [{
        op: 'insert',
        widget: { id: 'acme.x', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }] } } },
      slotMap: map,
      widgetMap: {},
      apps: [],
    });
    expect((ops[0] as any).op).toBe(WidgetOperationTypes.INSERT_AFTER);
    expect((ops[0] as any).relatedId).toBe('fb.widget.anchor');
  });

  it('falls back to APPEND when widgetMap routes the Insert to a different slot than the mapping', () => {
    const map: SlotMap = {
      'legacy.v1': {
        targetSlotId: 'fb.slot.a',
        insertBefore: 'fb.widget.anchor',
      },
    };
    const ops = translate({
      envConfig: { pluginSlots: { 'legacy.v1': { plugins: [{
        op: 'insert',
        widget: { id: 'acme.x', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }] } } },
      slotMap: map,
      widgetMap: { 'acme.x': 'fb.slot.b' },
      apps: [],
    });
    expect(ops).toEqual([
      {
        slotId: 'fb.slot.b',
        id: 'acme.x',
        op: WidgetOperationTypes.APPEND,
        component: SimpleWidget,
      },
    ]);
  });

  it('orders Inserts by priority ascending', () => {
    const ops = translate({
      envConfig: envConfig([
        { op: 'insert', widget: { id: 'second', type: 'DIRECT_PLUGIN', priority: 60, RenderWidget: SimpleWidget } },
        { op: 'insert', widget: { id: 'first', type: 'DIRECT_PLUGIN', priority: 10, RenderWidget: SimpleWidget } },
      ]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops.map((o) => (o as any).id)).toEqual(['first', 'second']);
  });

  it('translates Hide of a specific widgetId to a single REMOVE on the owning slot', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'hide',
        widgetId: 'org.openedx.frontend.widget.header.desktopLogo.v1',
      }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [fakeHeaderApp()],
    });
    expect(ops).toEqual([
      {
        slotId: DESKTOP_LEFT,
        op: WidgetOperationTypes.REMOVE,
        relatedId: 'org.openedx.frontend.widget.header.desktopLogo.v1',
      },
    ]);
  });

  it('Hide of a widgetId prefers a match in the mapping\'s curated sub-slots over an unrelated slot', () => {
    /* Pins the "prefer candidate, fall back to anywhere" tie-breaker in
     * locateOwningSlot. A duplicate id in an off-target slot shouldn\'t win
     * over the curated one. */
    const map: SlotMap = {
      'legacy.v1': {
        targetSlotId: 'fb.slot.curated',
        targetDefaultContent: {
          slotIds: ['fb.slot.curated'],
          fromAppIds: ['fixture'],
        },
      },
    };
    const apps: App[] = [{
      appId: 'fixture',
      slots: [
        { slotId: 'fb.slot.unrelated', id: 'shared.id', op: WidgetOperationTypes.APPEND, element: null },
        { slotId: 'fb.slot.curated', id: 'shared.id', op: WidgetOperationTypes.APPEND, element: null },
      ] as App['slots'],
    }];
    const ops = translate({
      envConfig: { pluginSlots: { 'legacy.v1': { plugins: [{ op: 'hide', widgetId: 'shared.id' }] } } },
      slotMap: map,
      widgetMap: {},
      apps,
    });
    expect(ops).toEqual([{
      slotId: 'fb.slot.curated',
      op: WidgetOperationTypes.REMOVE,
      relatedId: 'shared.id',
    }]);
  });

  it('Hide of a widgetId falls back to a non-curated slot when no curated match exists', () => {
    const map: SlotMap = {
      'legacy.v1': {
        targetSlotId: 'fb.slot.curated',
        targetDefaultContent: {
          slotIds: ['fb.slot.curated'],
          fromAppIds: ['fixture'],
        },
      },
    };
    const apps: App[] = [{
      appId: 'fixture',
      slots: [
        { slotId: 'fb.slot.unrelated', id: 'orphan.id', op: WidgetOperationTypes.APPEND, element: null },
      ] as App['slots'],
    }];
    const ops = translate({
      envConfig: { pluginSlots: { 'legacy.v1': { plugins: [{ op: 'hide', widgetId: 'orphan.id' }] } } },
      slotMap: map,
      widgetMap: {},
      apps,
    });
    expect(ops).toEqual([{
      slotId: 'fb.slot.unrelated',
      op: WidgetOperationTypes.REMOVE,
      relatedId: 'orphan.id',
    }]);
  });

  it('translates Hide default_contents into a fan-out REMOVE per sub-slot widget plus synthetic defaultContent', () => {
    const ops = translate({
      envConfig: envConfig([{ op: 'hide', widgetId: 'default_contents' }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [fakeHeaderApp()],
    });
    const removes = ops.filter((o) => o.op === WidgetOperationTypes.REMOVE) as any[];
    /* 2 synthetic defaultContent removes (per sub-slot) + 4 derived from fakeHeaderApp. */
    expect(removes).toHaveLength(6);
    expect(removes.filter((r) => r.relatedId === 'defaultContent')).toHaveLength(2);
    const realRemoves = removes
      .filter((r) => r.relatedId !== 'defaultContent')
      .map((r) => `${r.slotId}::${r.relatedId}`)
      .sort();
    expect(realRemoves).toEqual([
      `${DESKTOP_LEFT}::org.openedx.frontend.widget.header.desktopLogo.v1`,
      `${DESKTOP_LEFT}::org.openedx.frontend.widget.header.desktopPrimaryLinks.v1`,
      `${DESKTOP_RIGHT}::org.openedx.frontend.widget.header.desktopAuthenticatedMenu.v1`,
      `${DESKTOP_RIGHT}::org.openedx.frontend.widget.header.desktopSecondaryLinks.v1`,
    ]);
  });

  it('expands Hide default_contents into a REMOVE for each curated targetDefaultContent.widgetMap entry', () => {
    const map: SlotMap = {
      'legacy.v1': {
        targetSlotId: 'fb.slot.a',
        targetDefaultContent: {
          slotIds: ['fb.slot.a'],
          fromAppIds: [],
          widgetMap: {
            'fb.widget.x': 'fb.slot.a',
            'fb.widget.y': 'fb.slot.b',
          },
        },
      },
    };
    const ops = translate({
      envConfig: { pluginSlots: { 'legacy.v1': { plugins: [{ op: 'hide', widgetId: 'default_contents' }] } } },
      slotMap: map,
      widgetMap: {},
      apps: [],
    });
    /* 1 synthetic defaultContent + 2 curated REMOVEs. */
    expect(ops).toHaveLength(3);
    const summary = ops.map((o) => `${o.slotId}::${(o as any).relatedId}`).sort();
    expect(summary).toEqual([
      'fb.slot.a::defaultContent',
      'fb.slot.a::fb.widget.x',
      'fb.slot.b::fb.widget.y',
    ]);
  });

  it('Hide default_contents on legacy footer.v1 wipes desktopTop too, alongside the column sub-slots', () => {
    /* Without `desktopTop` in the fan-out, a third-party widget there would survive. */
    const ops = translate({
      envConfig: {
        pluginSlots: {
          'org.openedx.frontend.layout.footer.v1': {
            plugins: [{ op: 'hide', widgetId: 'default_contents' }],
          },
        },
      },
      slotMap: defaultSlotMap,
      widgetMap: {},
      apps: [],
    });
    const removeSlots = ops
      .filter((o) => o.op === WidgetOperationTypes.REMOVE && (o as any).relatedId === 'defaultContent')
      .map((o) => o.slotId)
      .sort();
    expect(removeSlots).toContain('org.openedx.frontend.slot.footer.desktop.v1');
    expect(removeSlots).toContain('org.openedx.frontend.slot.footer.desktopTop.v1');
    expect(removeSlots).toContain('org.openedx.frontend.slot.footer.desktopCenterLinks.v1');
    expect(removeSlots).toContain('org.openedx.frontend.slot.footer.desktopLeftLinks.v1');
    expect(removeSlots).toContain('org.openedx.frontend.slot.footer.desktopRightLinks.v1');
    expect(removeSlots).toContain('org.openedx.frontend.slot.footer.desktopLegalNotices.v1');
  });

  it('logo_slot Hide default_contents removes only the logo, sparing the primary nav links on the same sub-slot', () => {
    /* Regression: tutor-indigo's `logo_slot` Hide must not wipe the primary
     * nav menu that shares `desktopLeft.v1` with the logo widget. */
    const ops = translate({
      envConfig: {
        pluginSlots: {
          logo_slot: { plugins: [{ op: 'hide', widgetId: 'default_contents' }] },
        },
      },
      slotMap: defaultSlotMap,
      widgetMap: {},
      apps: [fakeHeaderApp()],
    });
    const removedIds = ops
      .filter((o) => o.op === WidgetOperationTypes.REMOVE)
      .map((o) => (o as any).relatedId)
      .sort();
    expect(removedIds).toEqual(['org.openedx.frontend.widget.header.desktopLogo.v1']);
  });

  it('uses the curated widgetMap to remove the help button widget for learning_help_slot Hide default_contents', () => {
    /* Spot-check that the curated `widgetMap` catches helper-registered widgets. */
    const ops = translate({
      envConfig: {
        pluginSlots: {
          learning_help_slot: { plugins: [{ op: 'hide', widgetId: 'default_contents' }] },
        },
      },
      slotMap: defaultSlotMap,
      widgetMap: {},
      apps: [],
    });
    const removes = ops.filter((o) => o.op === WidgetOperationTypes.REMOVE) as any[];
    const helpButtonRemove = removes.find((r) => r.relatedId === 'org.openedx.frontend.widget.header.help.v1');
    expect(helpButtonRemove).toBeDefined();
    expect(helpButtonRemove.slotId).toBe('org.openedx.frontend.slot.header.secondaryLinks.v1');
  });

  it('treats keepDefault: false the same as Hide default_contents', () => {
    const ops = translate({
      envConfig: envConfig([], { keepDefault: false }),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [fakeHeaderApp()],
    });
    expect(ops.filter((o) => o.op === WidgetOperationTypes.REMOVE)).toHaveLength(6);
  });

  it('translates Wrap on a specific widget into a layout REPLACE on its owning slot', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'wrap',
        widgetId: 'org.openedx.frontend.widget.header.desktopLogo.v1',
        wrapper: Wrapper,
      }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [fakeHeaderApp()],
    });
    expect(ops).toHaveLength(1);
    const op = ops[0] as any;
    expect(op.slotId).toBe(DESKTOP_LEFT);
    expect(op.op).toBe(LayoutOperationTypes.REPLACE);
    expect(typeof op.component).toBe('function');
    expect(op.component.displayName).toBe(
      'FpfWrapLayout(org.openedx.frontend.widget.header.desktopLogo.v1)',
    );
  });

  it('translates Wrap default_contents on an atomized 1:1 slot to a layout that wraps only the synthetic defaultContent widget', () => {
    /* Atomized slot (no targetDefaultContent fan-out); Inserts on the same slot must stay unwrapped. */
    const ops = translate({
      envConfig: envConfig([{ op: 'wrap', widgetId: 'default_contents', wrapper: Wrapper }],
        { slotId: 'org.openedx.frontend.layout.header_notifications_tray.v1' }),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toHaveLength(1);
    const op = ops[0] as any;
    expect(op.op).toBe(LayoutOperationTypes.REPLACE);
    expect(op.component.displayName).toBe('FpfWrapLayout(defaultContent)');
  });

  it('translates Wrap default_contents into one layout REPLACE per sub-slot', () => {
    const ops = translate({
      envConfig: envConfig([{ op: 'wrap', widgetId: 'default_contents', wrapper: Wrapper }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toHaveLength(2);
    expect(ops.every((o) => o.op === LayoutOperationTypes.REPLACE)).toBe(true);
    expect(ops.map((o) => o.slotId).sort()).toEqual([DESKTOP_LEFT, DESKTOP_RIGHT]);
  });

  it('warns and skips Modify', () => {
    const ops = translate({
      envConfig: envConfig([{ op: 'modify', widgetId: 'x', fn: () => null }]),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Modify is not supported'));
  });

  it('warns once on slotOptions.mergeProps and proceeds', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'insert',
        widget: { id: 'x', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }], { slotOptions: { mergeProps: true } }),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('mergeProps'));
  });

  it('warns and skips unmapped legacy slot ids', () => {
    const ops = translate({
      envConfig: { pluginSlots: { 'unknown.slot': { plugins: [] } } },
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect(ops).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no mapping for legacy slot id'));
  });

  it('resolves slots via sourceAliases', () => {
    const map: SlotMap = {
      'real.target.v1': {
        sourceAliases: ['legacy_alias_only'],
        targetSlotId: 'frontend.base.target',
      },
    };
    const ops = translate({
      envConfig: { pluginSlots: { legacy_alias_only: { plugins: [{
        op: 'insert',
        widget: { id: 'x', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }] } } },
      widgetMap: {},
      slotMap: map,
      apps: [],
    });
    expect(ops).toHaveLength(1);
    expect((ops[0] as any).slotId).toBe('frontend.base.target');
  });

  it('routes a non-split legacy slot Insert to the single targetSlotId', () => {
    const ops = translate({
      envConfig: envConfig([{
        op: 'insert',
        widget: { id: 'logo.thing', type: 'DIRECT_PLUGIN', RenderWidget: SimpleWidget },
      }], { slotId: HEADER_LOGO_LEGACY }),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });
    expect((ops[0] as any).slotId).toBe(DESKTOP_LEFT);
  });

  it('end-to-end renders Insert + Wrap default_contents on an atomized slot, scoping the wrap to the synthetic JSX children and forwarding pluginProps', () => {
    /* Mirrors `frontend-plugin-aspects`'s sidebar config against an atomized header slot. */
    const InsertedWidget = () => <div data-testid="inserted-widget" />;
    const TaggingWrapper = ({
      component,
      pluginProps,
    }: {
      component: any,
      pluginProps?: Record<string, unknown>,
    }) => (
      <div data-testid="wrapper" data-tag={String(pluginProps?.tag ?? '')}>
        {component}
      </div>
    );

    const ATOMIZED_LEGACY = 'org.openedx.frontend.layout.header_notifications_tray.v1';
    const ATOMIZED_TARGET = defaultSlotMap[ATOMIZED_LEGACY].targetSlotId;

    const ops = translate({
      envConfig: envConfig([
        {
          op: 'insert',
          widget: { id: 'inserted', type: 'DIRECT_PLUGIN', priority: 1, RenderWidget: InsertedWidget },
        },
        { op: 'wrap', widgetId: 'default_contents', wrapper: TaggingWrapper },
      ], { slotId: ATOMIZED_LEGACY }),
      widgetMap: {},
      slotMap: defaultSlotMap,
      apps: [],
    });

    setSiteConfig({
      siteId: 'render-test',
      apps: [{ appId: 'org.openedx.frontend.app.compat', slots: ops }],
    } as any);

    const { getByTestId, queryByTestId } = render(
      <Slot id={ATOMIZED_TARGET} pluginProps={{ tag: 'hello' }}>
        <div data-testid="legacy-default-children">defaults</div>
      </Slot>,
    );

    /* Wrapper renders around the JSX children with pluginProps threaded through. */
    const wrapped = getByTestId('wrapper');
    expect(wrapped).toContainElement(getByTestId('legacy-default-children'));
    expect(wrapped).toHaveAttribute('data-tag', 'hello');
    /* Inserted plugins stay unwrapped (FPF semantics). */
    expect(getByTestId('inserted-widget')).toBeInTheDocument();
    expect(queryByTestId('inserted-widget')!.parentElement).not.toBe(wrapped);
  });
});
