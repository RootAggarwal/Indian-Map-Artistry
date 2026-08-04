"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
  useGroupRef,
  usePanelRef,
  type GroupImperativeHandle,
  type Layout,
  type PanelImperativeHandle,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof Group>) => (
  <Group
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

type PanelDefaults = Map<string, string>;
const PanelRegistryContext = React.createContext<{
  defaults: PanelDefaults;
  groupRef: React.RefObject<GroupImperativeHandle | null>;
} | null>(null);

const usePanelRegistry = () => {
  const ctx = React.useContext(PanelRegistryContext);
  return ctx ?? null;
};

/**
 * PanelGroup whose layout is persisted to localStorage under the given id and
 * restored on the next page load.
 *
 * Persistence is implemented imperatively (read after mount, write on layout
 * change) instead of `useDefaultLayout`, whose restore is skipped while the
 * group store is in its initial "deferred" state and whose keyboard/dblclick
 * resizes were computed against a stale group size in this library version.
 */
const ResizablePanelGroupPersist = ({
  id = "geopic:group",
  className,
  children,
  onLayoutChange,
  ...props
}: React.ComponentProps<typeof Group>) => {
  const groupRef = useGroupRef();
  const registry = React.useMemo(() => ({
    defaults: new Map<string, string>(),
    groupRef,
  }), [groupRef]);
  const storageKey = `geopic:${id.replace(/^geopic:/, "")}`;
  const mountTimeRef = React.useRef(typeof window !== "undefined" ? Date.now() : 0);

  // Restore the persisted layout shortly after mount. The group registers with
  // its real size client-side, so the layout map applies cleanly. Retries until
  // the group exposes its panels, because very early reads see an empty layout
  // and would silently skip the restore.
  const restorePendingRef = React.useRef(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const readStored = (): Layout | null => {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(storageKey);
      } catch {
        return null;
      }
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Layout;
      } catch {
        return null;
      }
    };
    let tries = 0;
    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      const stored = readStored();
      if (!stored) {
        restorePendingRef.current = false;
        return;
      }
      if (typeof stored !== "object" || stored === null) {
        restorePendingRef.current = false;
        return;
      }
      const keys = Object.keys(stored);
      if (keys.length === 0 || !keys.every((k) => typeof stored[k] === "number")) {
        restorePendingRef.current = false;
        return;
      }
      const current = groupRef.current?.getLayout() ?? {};
      const panelIds = Object.keys(current);
      if (panelIds.length === 0 || !keys.every((k) => panelIds.includes(k))) {
        if (++tries <= 240) {
          requestAnimationFrame(apply);
          return;
        }
        restorePendingRef.current = false;
        return;
      }
      groupRef.current?.setLayout(stored);
      // Keep suppressing persistent saves briefly: the group may emit the
      // initial/default layout asynchronously after restore wins, which would
      // otherwise overwrite the persisted value we just applied.
      window.setTimeout(() => {
        restorePendingRef.current = false;
      }, 600);
    };
    // Suppress the default-layout save while a stored layout may still be
    // applied: the group registers its panels lazily, and the initial layout
    // event can otherwise clobber the persisted value before restore wins.
    const storedAtMount = (() => {
      const s = readStored();
      if (!s || typeof s !== "object") return false;
      const k = Object.keys(s);
      return k.length > 0 && k.every((x) => typeof s[x] === "number");
    })();
    restorePendingRef.current = storedAtMount;
    // two frames: let the group register and the ResizeObserver fire first
    const raf = requestAnimationFrame(() => requestAnimationFrame(apply));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [storageKey, groupRef]);

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );
  const handleLayoutChanged = React.useCallback(
    (layout: Layout) => {
      onLayoutChange?.(layout);
      if (typeof window === "undefined") return;
      if (restorePendingRef.current) return;
      if (Date.now() - mountTimeRef.current < 1000) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(layout));
        } catch {
          /* storage full/blocked — ignore */
        }
      }, 250);
    },
    [storageKey, onLayoutChange],
  );

  return (
    <PanelRegistryContext.Provider value={registry}>
      <Group
        id={id}
        groupRef={groupRef}
        className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
        onLayoutChanged={handleLayoutChanged}
        {...props}
      >
        {children}
      </Group>
    </PanelRegistryContext.Provider>
  );
};

const ResizablePanel = ({ id, defaultSize, ...props }: React.ComponentProps<typeof Panel>) => {
  const panelRef = usePanelRef();
  const registry = usePanelRegistry();
  React.useEffect(() => {
    if (!registry || !id) return;
    registry.defaults.set(id, String(defaultSize));
    return () => {
      registry.defaults.delete(id);
    };
  }, [registry, id, defaultSize]);
  return <Panel id={id} panelRef={panelRef} defaultSize={defaultSize} {...props} />;
};

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => {
  const registry = usePanelRegistry();
  const handleResetToDefaults = (e: React.MouseEvent<HTMLElement>) => {
    // The library's built-in dblclick passes the panel's defaultSize (a
    // percentage number) to resize(), which treats numbers as pixels — reset
    // to the panel's declared defaultSize instead, with its own units.
    e.preventDefault();
    e.stopPropagation();
    const registryLocal = registry;
    if (!registryLocal) return;
    const el = e.currentTarget;
    const vertical = el.dataset.panelGroupDirection === "vertical";
    const neighbors = [
      el.previousElementSibling as HTMLElement | null,
      el.nextElementSibling as HTMLElement | null,
    ];
    const layout: Layout = {};
    const groupEl = el.parentElement as HTMLElement | null;
    if (!groupEl) return;
    const groupSize = vertical ? groupEl.offsetHeight : groupEl.offsetWidth;
    if (!groupSize) return;
    for (const n of neighbors) {
      const panelId = n?.getAttribute?.("data-panel");
      if (!panelId) continue;
      const defaultSize = registryLocal.defaults.get(panelId);
      if (defaultSize === undefined) continue;
      const numeric = parseFloat(defaultSize);
      if (!Number.isFinite(numeric) || numeric <= 0) continue;
      layout[panelId] = (numeric / groupSize) * 100;
    }
    if (Object.keys(layout).length > 0) {
      registryLocal.groupRef.current?.setLayout(layout);
    }
  };
  return (
    <Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      disableDoubleClick
      {...props}
      onDoubleClick={handleResetToDefaults}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </Separator>
  );
};

export { ResizablePanelGroup, ResizablePanelGroupPersist, ResizablePanel, ResizableHandle };
