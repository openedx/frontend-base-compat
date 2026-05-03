import { ComponentType, ReactElement, isValidElement } from 'react';
import { useSlotContext, useWidgets } from '@openedx/frontend-base';

interface WrapLayoutArgs {
  wrapper: ComponentType<{ component: ReactElement, pluginProps?: Record<string, unknown> }>,
  /* Wraps only this id; if absent, wraps every widget. */
  widgetId?: string,
}

/* Layout that decorates one (or all) widgets via an FPF-shaped wrapper. Best effort per ADR 0001. */
export function createWrapLayout({ wrapper: Wrapper, widgetId }: WrapLayoutArgs) {
  function WrapLayout() {
    const widgets = useWidgets();
    const ctx = useSlotContext() as { pluginProps?: Record<string, unknown> };
    const pluginProps = ctx.pluginProps ?? {};
    const identified = widgets.identified;
    const items = identified.map((entry, idx) => {
      const node = entry.node;
      if (!isValidElement(node)) {
        return node;
      }
      const shouldWrap = widgetId === undefined || entry.id === widgetId;
      if (!shouldWrap) {
        return node;
      }
      return (
        <Wrapper
          key={entry.id ?? idx}
          component={node as ReactElement}
          pluginProps={pluginProps}
        />
      );
    });
    return <>{items}</>;
  }
  WrapLayout.displayName = widgetId
    ? `FpfWrapLayout(${widgetId})`
    : 'FpfWrapLayout(default_contents)';
  return WrapLayout;
}
