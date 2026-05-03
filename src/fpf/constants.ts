/* Duck-typed copies of FPF's `src/plugins/data/constants.js` values. */

export const DIRECT_PLUGIN = 'DIRECT_PLUGIN';
export const IFRAME_PLUGIN = 'IFRAME_PLUGIN';

export const PLUGIN_OPERATIONS = {
  Insert: 'insert',
  Hide: 'hide',
  Modify: 'modify',
  Wrap: 'wrap',
} as const;

export const PLUGIN_MOUNTED = 'PLUGIN_MOUNTED';
export const PLUGIN_READY = 'PLUGIN_READY';
export const PLUGIN_UNMOUNTED = 'PLUGIN_UNMOUNTED';
export const PLUGIN_RESIZE = 'PLUGIN_RESIZE';
