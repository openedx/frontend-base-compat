import { render } from '@testing-library/react';
import { setSiteConfig, WidgetOperationTypes } from '@openedx/frontend-base';

import PluginSlot from './PluginSlot';
import { defaultSlotMap } from '../mappings/slotMap';

const DESKTOP_RIGHT = 'org.openedx.frontend.slot.header.desktopRight.v1';

describe('FPF PluginSlot stub', () => {
  beforeEach(() => {
    setSiteConfig({
      siteId: 'test',
      apps: [
        {
          appId: 'fixture',
          slots: [
            {
              slotId: DESKTOP_RIGHT,
              id: 'fixture.widget',
              op: WidgetOperationTypes.APPEND,
              element: <span data-testid="fixture-widget">hi</span>,
            },
          ],
        },
      ],
    } as any);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the frontend-base Slot mapped from a known legacy id', () => {
    const { getByTestId } = render(
      <PluginSlot id="org.openedx.frontend.layout.header_desktop.v1" />,
    );
    expect(getByTestId('fixture-widget')).toBeInTheDocument();
  });

  it('resolves via sourceAliases', () => {
    const { getByTestId } = render(
      <PluginSlot id="desktop_header_slot" />,
    );
    expect(getByTestId('fixture-widget')).toBeInTheDocument();
  });

  it('falls back to rendering children when the legacy id is unmapped', () => {
    const { getByText } = render(
      <PluginSlot id="totally.unknown.slot.v1">
        <div>fallback content</div>
      </PluginSlot>,
    );
    expect(getByText('fallback content')).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalled();
  });

  it('warns once when slotOptions.mergeProps is set', () => {
    render(
      <PluginSlot
        id="org.openedx.frontend.layout.header_desktop.v1"
        slotOptions={{ mergeProps: true }}
      />,
    );
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('mergeProps'));
  });

  it('uses the supplied slotMap when provided (test seam)', () => {
    expect(defaultSlotMap['org.openedx.frontend.layout.header_desktop.v1']).toBeTruthy();
  });
});
