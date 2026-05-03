import { ReactNode } from 'react';

interface PluginProps {
  children?: ReactNode,
  /* Accepted for FPF type compatibility; ignored by the stub. */
  className?: string,
  style?: Record<string, unknown>,
  ready?: boolean,
  [key: string]: unknown,
}

/* FPF `<Plugin>` stub. Renders children; lifecycle events from real FPF do not fire. */
export default function Plugin({ children }: PluginProps) {
  return <>{children}</>;
}
