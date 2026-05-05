############################################
Compatibility shim for legacy frontend code
############################################

Status
======

Proposed


Context
=======

Before ``frontend-base``, MFEs were customized through two cooperating
libraries: ``@edx/frontend-platform`` (runtime services: config, i18n, auth,
logging) and ``@openedx/frontend-plugin-framework`` (FPF, slot-based plugin
configuration via per-MFE ``env.config.jsx`` files).

``@openedx/frontend-base`` redesigns both surface areas.

On the FPF side, slot operations are different (``WidgetOperationTypes`` and
``LayoutOperationTypes`` instead of ``Insert``/``Hide``/``Modify``/``Wrap``),
``Wrap`` is rejected outright (`ADR 0011
<https://github.com/openedx/frontend-base/blob/main/docs/decisions/0011-no-slot-wrapping-operation.rst>`__),
``Modify``/``mergeProps`` are gone, slot identifiers are hierarchical
reverse-DNS strings (ADR 0009), and configuration lives in site-level
``site.config.{build,dev}.tsx`` files rather than per-MFE files.  A
frontend-base site is a single SPA: each former MFE registers as an ``App``
with its own ``appId``, and there is no per-MFE bundle, so legacy
``process.env.APP_ID`` differentiation has no equivalent.

On the frontend-platform side, frontend-base re-exports byte-identical
replacements for nearly every symbol legacy plugins use (the ``react-intl``
helpers, the auth surface, ``camelCaseObject``/etc.).  The exception is
``getConfig``: frontend-platform exposed a flat SCREAMING_SNAKE_CASE bag
(``LMS_BASE_URL``, ``INDIGO_ENABLE_DARK_TOGGLE``, ...), but frontend-base
splits the same data into a typed camelCase ``SiteConfig``
(``lmsBaseUrl``, ...) plus a per-site grab-bag at
``SiteConfig.commonAppConfig``.  edx-platform performs the split server-side
using a curated translation table in
``lms/djangoapps/mfe_config_api/views.py`` (``SITE_CONFIG_TRANSLATION_MAP``).

A frontend-base site cannot install real ``@edx/frontend-platform``
alongside ``@openedx/frontend-base``: the two packages overlap on globals
(auth client, config, i18n, pub/sub topics, logging) and would conflict at
runtime.  The same is true of FPF's ``PluginSlot`` once frontend-base owns
slot rendering.  Sites need a way for those imports to resolve to something
that returns equivalent behavior on a frontend-base runtime, without
dragging either real package into the dependency tree.

Existing FPF plugin code is non-trivial: real React components that
reference frontend-platform APIs.  The goal of this ADR is to let operators
keep those components running on top of a frontend-base site with as little
change as possible during the transition off both legacy packages.


Decision
========

We will ship a **legacy compatibility shim** as a separate package
(``@openedx/frontend-base-compat``) that does three coupled jobs from one
install:

- **frontend-platform drop-in.** Re-exports frontend-base's i18n and auth
  surfaces via ``./i18n`` and ``./auth`` subpath exports, and exposes a
  ``getConfig`` adapter and ``camelCaseObject`` from the bare entry.

- **FPF drop-in.** Re-exports the public surface of
  ``@openedx/frontend-plugin-framework`` (``Plugin``, ``PluginSlot``,
  ``DIRECT_PLUGIN``, ``IFRAME_PLUGIN``, ``PLUGIN_OPERATIONS``).  The
  ``Plugin`` and ``PluginSlot`` components are thin stubs: ``PluginSlot``
  looks the legacy id up in the slot-mapping table and renders
  frontend-base's ``<Slot>`` for the matched target.

- **FPF translation.** Exports ``createLegacyPluginApp({ appId, envConfig,
  mfeId?, routeMap?, slotMap?, widgetMap? })``, which invokes a legacy
  ``setConfig`` function, translates its ``pluginSlots`` into a
  ``SlotOperation[]``, and returns a frontend-base ``App``.  The optional
  ``mfeId`` opts every translated op into a route-role ``condition`` so a
  legacy ``env.config.jsx`` only takes effect on its MFE's routes (see
  "Configuration loading" below).

Both legacy packages are wired up via a single npm ``overrides`` block in
the site's ``package.json`` that aliases both ``@edx/frontend-platform`` and
``@openedx/frontend-plugin-framework`` to ``@openedx/frontend-base-compat``.
npm alias overrides redirect bare and subpath imports alike, so the compat
package's ``./i18n``/``./auth`` subpaths cover the platform subpaths and
the bare entries cover the rest.  Real frontend-platform and real FPF are
never fetched.

The shim's only declared dependency is ``@openedx/frontend-base``: it reads
``env.config.jsx`` output via duck-typed string constants
(``'DIRECT_PLUGIN'``, ``'insert'``, etc.) rather than importing FPF
symbols, so it doesn't pull FPF into sites that don't already use it.

The shim lives outside frontend-base because frontend-base is meant to be
lean (sites that don't need legacy compatibility shouldn't ship it), and
because the shim has its own sunset on the FPF deprecation timeline and
can be archived independently.

The shim is opt-in at the site level.  A site that does not register a
shim ``App`` and does not declare the ``overrides`` entries pays no
runtime cost and sees no behavior change.


``getConfig`` adapter
=====================

A ``Proxy`` that resolves UPPER_SNAKE_CASE keys against two sources, both
read from ``getSiteConfig()`` on every property access:

- A **curated UPPER_SNAKE -> camelCase table** mirroring edx-platform's
  ``SITE_CONFIG_TRANSLATION_MAP`` verbatim.  Lockstep with that table is
  the reliability story; divergence would silently make the same key
  resolve differently on the two ends.

- **Fall-through to** ``getSiteConfig().commonAppConfig`` for every other key.
  edx-platform populates ``commonAppConfig`` with whatever ``MFE_CONFIG``
  values it doesn't translate, so plugin-specific keys land there.

Unknown keys return ``undefined``, matching legacy behavior.
``Object.keys``, ``for ... in``, ``'KEY' in config``, and destructuring
all enumerate the union of mapped + bag keys.


FPF slot ID mapping
===================

The shim ships a curated, versioned mapping table from legacy FPF slot IDs
(and their ``idAliases``) to one or more frontend-base slot IDs.  Each
entry names a default ``targetSlotId`` for ``Insert`` ops, optional
``sourceAliases`` matching FPF's ``idAliases``, and -- for legacy slots
whose defaults have been atomized into App-registered widgets -- a
``targetDefaultContent`` descriptor used to reconstruct the legacy
"hide all defaults" semantics on slots that no longer have a single
``defaultContent`` to remove.

For 1:1 mappings, ``targetSlotId`` is enough.  For slots that have been
split into a finer-grained set, ``Insert`` routing falls back to a
per-widget table (``widgetMap``, defaulting to the shim's exported
``defaultWidgetMap``) so that known FPF plugins land on the right
sub-slot; operators extend it via the ``widgetMap`` argument to
``createLegacyPluginApp``, typically as ``{ ...defaultWidgetMap, ... }``.

Routing always resolves to a real frontend-base ``slotId``, so widgets
render via whatever ``<Slot id="..." />`` already lives in the shipped
layout.  No layout in ``shell/`` needs to change for legacy widgets to
appear.  Plugin code is never modified; routing decisions live in the
compat package or in the site config, never in ``env.config.jsx``.

When a legacy slot has no acceptable target, the shim logs a single
warning per slot at startup and skips its operations, giving plugin
authors a clear signal to migrate that specific slot.


Lazy slot resolution
====================

Some translations (``Hide`` against ``default_contents`` and
``keepDefault: false``) need to introspect other apps' ``slots`` arrays to
discover which widgets currently provide the legacy defaults.  But
``createLegacyPluginApp`` is invoked during ``site.config.*.tsx``
evaluation, before the site's full ``apps`` array exists.  The shim
resolves this without any frontend-base runtime change by exposing the
returned ``App``'s ``slots`` field as a lazy, cached getter that runs the
first time the runtime walks the apps list.


FPF operation translation
=========================

For each mapped slot, the shim sorts FPF plugin entries by ``priority``
ascending and then translates as follows:

``Insert`` (``DIRECT_PLUGIN``)
  ``WidgetOperationTypes.APPEND`` on the mapped slot, using
  ``RenderWidget`` as the widget ``component`` (or ``element`` when props
  must be passed).  Plugin ``id`` is preserved.

``Insert`` (``IFRAME_PLUGIN``)
  ``WidgetOperationTypes.APPEND`` using the widget's iframe renderer
  (``url``, ``title``).

``Hide``
  ``WidgetOperationTypes.REMOVE`` targeting the resolved owning slot.
  Against the synthetic ``default_contents`` id (or ``keepDefault:
  false``), the shim emits the union of three layers from the slot's
  ``targetDefaultContent`` descriptor: ``REMOVE 'defaultContent'`` per
  sub-slot, ``REMOVE`` per dynamically-discovered ``APPEND``/``PREPEND`` in
  named apps' ``slots``, and ``REMOVE`` per curated entry.

``Wrap``
  Best-effort.  ADR 0011 deliberately rejects a generic widget-wrapping
  operation, so faithful translation is not always achievable.  The shim
  implements a ``LayoutOperationTypes.REPLACE`` whose layout resolves the
  slot's widgets via ``useWidgets()`` and feeds the matched widget into
  the FPF wrapper using FPF's prop shape ``{ component, pluginProps }``.
  A specific ``widgetId`` wraps just that widget; ``default_contents``
  against an atomized 1:1 slot wraps only the synthetic
  ``defaultContent``; ``default_contents`` against a split slot has no
  synthetic target and falls back to wrapping every widget on each
  sub-slot (over-wraps any inserted plugins on those sub-slots).
  Wrappers that read FPF-private context, mutate ``RenderWidget`` props
  in non-trivial ways, or compose with other ``Wrap`` ops on the same
  target are reported as unsupported and warn.

``Modify`` and ``slotOptions.mergeProps``
  Not translated.  Each occurrence warns once and is skipped.

``priority``
  Consumed as a sort key over the translated operations for the same
  target slot, preserving FPF ordering for slots whose default contents
  also use ``APPEND``.


Configuration loading
=====================

The shim is wired into the site config. Operators import each
``env.config.jsx`` directly from ``site.config.*.tsx`` and register one shim
``App`` per file via ``createLegacyPluginApp``.  ``env.config.jsx`` files are
not auto-discovered: a frontend-base site is a single SPA, there is no per-MFE
bundle entry point, and a single magic alias would resolve to one file with no
built-in way to host multiple legacy compat files side by side.  Explicit
per-file imports avoid the ambiguity, let multiple sources coexist without a
global "legacy config" namespace, and keep the build graph explicit.

The shim ``App`` has no ``routes`` or ``providers`` of its own; its only
job is to deliver translated operations into the site's runtime.

Once more than one MFE's config is hosted in the same shell, every app's
slot ops would otherwise apply on every route, and a ``Hide`` declared
in one MFE's ``env.config.jsx`` could leak onto another MFE's chrome.
Operators opt in to per-MFE scoping by passing ``mfeId``.  The shim
resolves it through a curated ``mfeId -> routeRoles[]`` table and
attaches a route-role ``condition`` to every emitted op, so the legacy
config only takes effect on its MFE's routes.  When ``mfeId`` is set
but the table has no entry for it, the shim warns and registers the
app as a no-op; falling back to the unscoped path would defeat the
opt-in.


Scope
=====

This ADR commits to:

- A standalone package serving as a drop-in alias target for both
  ``@edx/frontend-platform`` and ``@openedx/frontend-plugin-framework``
  via npm overrides, exporting ``createLegacyPluginApp``, the slot and
  widget mapping tables, the FPF surface re-exports, the ``getConfig``
  adapter, and frontend-base's i18n/auth surfaces under
  frontend-platform-shaped subpaths.
- A ``defaultRouteMap`` of legacy ``mfeId -> routeRoles[]``.
- A ``defaultSlotMap``, split into per-app files for drop-in extension.
- A ``defaultWidgetMap``.
- A ``getConfig`` adapter whose curated map mirrors edx-platform's
  ``SITE_CONFIG_TRANSLATION_MAP`` exactly, with fall-through to
  ``commonAppConfig``.
- Translations for ``Insert``, ``Hide``, ``Wrap`` (best-effort), and
  ``priority``-based ordering; warnings (not errors) for ``Modify``,
  ``mergeProps``, unsupported ``Wrap`` shapes, and unmapped slot IDs.

It does not commit to:

- Translating ``Modify`` or ``mergeProps``.
- Supporting plugins that rely on private React context.
- Translating non-curated ``getConfig`` keys via algorithmic
  snake-to-camel.
- Per-app ``getConfig`` (FPF plugins are appId-agnostic by design).
- Shimming legacy DOM markup or CSS selectors so that brand and plugin
  stylesheets written against the old chrome keep matching.
- Long-term maintenance: the shim is a migration aid, expected to be
  removed when the FPF deprecation window closes.


Consequences
============

Operators with FPF customizations get a path to keep their existing
plugin components running on a frontend-base site by installing the
compat package, declaring two ``overrides`` entries, importing each
legacy config into ``site.config.*.tsx``, and registering one shim
``App`` per config.  Plugin code that imports from
``@edx/frontend-platform`` keeps working unchanged.  Most ``Insert`` and
``Hide`` ops work without further change; ``Wrap`` works for the common
single-widget decorator pattern; ``Modify`` and ``mergeProps`` warn and
need to migrate.

Two curated tables must stay in lockstep with their upstreams.  The
slot-mapping table tracks frontend-base slot evolution: header refactors in
frontend-base will need a coordinated shim release. The ``getConfig``
translation table tracks edx-platform's ``SITE_CONFIG_TRANSLATION_MAP``: drift
means legacy plugins reading those keys see ``undefined``.  Both contracts are
the same kind any third-party consumer already lives against.

The shim is explicitly a migration aid and will be removed once the FPF
deprecation timeline is complete.  An entry to that effect should be
added to the deprecation tracking issue when the shim lands.


Rejected alternatives
=====================

Translating ``Modify`` and ``mergeProps``
-----------------------------------------

A ``Modify`` op replaces a widget's render function with the result of
an arbitrary user-supplied function.  Faithfully reproducing this
requires the same widget-pipeline bypass that ADR 0011 rejects for
``Wrap``, with strictly fewer constraints on what the replacement may
do.  ``mergeProps`` could be partially reproduced for inserted widgets
and for the synthetic ``defaultContent`` on non-split slots, but for
split-slot ``default_contents`` there is no single ReactNode to merge
into.  Rather than ship a half-translation that works in some cases and
warns in others, both operations are treated as untranslated and warn
uniformly; plugin authors are expected to migrate to widget options.

Shimming legacy DOM markup or CSS selectors
-------------------------------------------

Brand and plugin stylesheets written against legacy MFE markup
(``header.site-header-desktop``, ``.studio-header``,
``footer.footer .footer-top``, ...) no longer match what frontend-base
renders.  A chrome-level shim that wraps each slot in a legacy outer
element was considered and rejected: legacy CSS can reach into
descendants whose class hooks frontend-base does not preserve, so the
foothold covers very little of the affected styling.  A faithful shim
would require either DOM rewriting (brittle, every-render cost) or
build-time selector translation (requires a curated mapping per
selector), neither of which is a defensible commitment for a
finite-lifetime migration aid.  Operators are expected to rewrite
affected CSS to target current frontend-base markup, or apply the
equivalent overrides through brand theming.

Splitting frontend-platform and FPF shims into separate packages
----------------------------------------------------------------

A separate platform shim would let a site install only what it needs.
Rejected because the FPF and platform shims share an audience (operators
with legacy plugin code) and a sunset (they go away together when FPF
is deprecated).  One package, one ``overrides`` target pair, one
maintenance surface.
