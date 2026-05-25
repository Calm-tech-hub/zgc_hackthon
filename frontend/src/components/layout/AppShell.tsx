import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
    AgentConstellation,
    AgentInspector,
    useActivityFeedStream,
    useAgentInspectorStore,
} from "../../features/agents";
import { useAgentTurnsIngest } from "../../features/agents/useAgentTurnsIngest";
import { ChatPanel, useChatDrawerOpener } from "../../features/chat";
import {
    AnomalyBanner,
    EQUIPMENT_KEY,
    KpiBar,
    validateEquipmentSelection,
} from "../../features/control-room";
import { DemoControlStrip } from "../../features/demo";
import type { EquipmentSelection } from "../../lib/hierarchy";
import { useLocalStorage } from "../../lib/useLocalStorage";
import { Icons } from "../ui";
import { pageTransition } from "../ui/motion";
import { DRAWER_DEFAULT_WIDTH, DRAWER_MAX_WIDTH, DRAWER_MIN_WIDTH, Drawer } from "./Drawer";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED, Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface ChatDrawerState {
    open: boolean;
    width: number;
}

const CHAT_DRAWER_KEY = "aria.chatDrawer";
const SIDEBAR_KEY = "aria.sidebar";
const INSPECTOR_HEIGHT = "40vh";

interface SidebarState {
    collapsed: boolean;
}

const DEFAULT_SIDEBAR_STATE: SidebarState = { collapsed: false };

function sanitizeSidebar(state: SidebarState | null | undefined): SidebarState {
    return { collapsed: Boolean(state?.collapsed) };
}

const DEFAULT_DRAWER_STATE: ChatDrawerState = {
    open: true,
    width: DRAWER_DEFAULT_WIDTH,
};

function sanitizeDrawer(state: ChatDrawerState): ChatDrawerState {
    return {
        open: Boolean(state.open),
        width: Math.max(
            DRAWER_MIN_WIDTH,
            Math.min(DRAWER_MAX_WIDTH, Math.round(state.width ?? DRAWER_DEFAULT_WIDTH)),
        ),
    };
}

export function AppShell() {
    // Singleton bus consumers — keep both buffers (agent turns + activity
    // feed) alive regardless of whether the Inspector or the Activity modal
    // is currently mounted. Without this the feed only starts collecting
    // events the first time the user opens the modal, missing prior handoffs.
    useAgentTurnsIngest();
    useActivityFeedStream();

    const [drawer, setDrawer] = useLocalStorage<ChatDrawerState>(
        CHAT_DRAWER_KEY,
        DEFAULT_DRAWER_STATE,
    );
    const [sidebar, setSidebar] = useLocalStorage<SidebarState>(SIDEBAR_KEY, DEFAULT_SIDEBAR_STATE);
    const [selection, setSelection] = useLocalStorage<EquipmentSelection | null>(
        EQUIPMENT_KEY,
        null,
        { validator: validateEquipmentSelection },
    );
    const inspectorAgent = useAgentInspectorStore((s) => s.agent);
    const [constellationOpen, setConstellationOpen] = useState(false);

    // Hotkey `A` toggles the constellation overlay. Ignored while typing in
    // inputs/textareas/contenteditable so the letter still types normally.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "a" && e.key !== "A") return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
                return;
            }
            e.preventDefault();
            setConstellationOpen((prev) => !prev);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const safeDrawer = sanitizeDrawer(drawer);
    const safeSidebar = sanitizeSidebar(sidebar);
    const drawerId = useId();

    const toggleDrawer = useCallback(() => {
        const next = { ...safeDrawer, open: !safeDrawer.open };
        setDrawer(next);
    }, [setDrawer, safeDrawer]);

    // Any feature can request the chat drawer to open via
    // ``useChatDrawerOpener.requestOpen()`` (e.g. AnomalyBanner Investigate
    // CTA, AnomaliesList row action). We watch the monotonic counter and
    // flip the drawer open if it is currently closed.
    const drawerOpenRequestId = useChatDrawerOpener((s) => s.requestOpenId);
    useEffect(() => {
        if (drawerOpenRequestId === 0) return;
        if (safeDrawer.open) return;
        setDrawer({ ...safeDrawer, open: true });
    }, [drawerOpenRequestId, safeDrawer, setDrawer]);

    const toggleSidebar = useCallback(() => {
        const next = { collapsed: !safeSidebar.collapsed };
        setSidebar(next);
    }, [setSidebar, safeSidebar.collapsed]);

    const setDrawerWidth = useCallback(
        (width: number) => {
            setDrawer((prev) => ({ ...sanitizeDrawer(prev), width }));
        },
        [setDrawer],
    );

    const sidebarWidth = safeSidebar.collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

    const location = useLocation();
    const isMasterFix = location.pathname.startsWith("/masterfix");
    const drawerVisible = !isMasterFix && safeDrawer.open;
    const activeInspectorAgent = isMasterFix ? null : inspectorAgent;
    // Group sub-routes (e.g. /work-orders/:id) under their parent so
    // navigating between siblings doesn't always replay the full transition.
    const routeKey = location.pathname.split("/")[1] || "/";

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <Sidebar collapsed={safeSidebar.collapsed} />
            <div
                className="flex min-w-0 flex-1 flex-col"
                style={{
                    width: `calc(100% - ${sidebarWidth}px)`,
                }}
            >
                {isMasterFix ? (
                    <MasterFixTopBar
                        sidebarCollapsed={safeSidebar.collapsed}
                        onSidebarToggle={toggleSidebar}
                    />
                ) : (
                    <>
                        <TopBar
                            selection={selection}
                            onSelectionChange={setSelection}
                            drawerOpen={safeDrawer.open}
                            drawerControlsId={drawerId}
                            onDrawerToggle={toggleDrawer}
                            sidebarCollapsed={safeSidebar.collapsed}
                            onSidebarToggle={toggleSidebar}
                            kpiSlot={<KpiBar selection={selection} />}
                            onConstellationToggle={() => setConstellationOpen((prev) => !prev)}
                        />
                        <AnomalyBanner />
                    </>
                )}
                <div
                    className="grid min-h-0 flex-1"
                    style={{
                        gridTemplateColumns: drawerVisible
                            ? `minmax(0, 1fr) ${safeDrawer.width}px`
                            : "minmax(0, 1fr) 0",
                        transition: `grid-template-columns var(--motion-base) var(--ease-out-soft)`,
                    }}
                >
                    <main className="relative flex min-h-0 flex-col overflow-hidden">
                        <div
                            className="min-h-0 flex-1 overflow-auto"
                            style={{
                                paddingBottom: activeInspectorAgent ? INSPECTOR_HEIGHT : undefined,
                                transition:
                                    "padding-bottom var(--motion-base) var(--ease-out-soft)",
                            }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={routeKey}
                                    variants={pageTransition}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="h-full"
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <AgentInspector />
                    </main>
                    <Drawer
                        id={drawerId}
                        open={drawerVisible}
                        width={safeDrawer.width}
                        onWidthChange={setDrawerWidth}
                    >
                        <ChatPanel selection={selection} />
                    </Drawer>
                </div>
            </div>
            <AgentConstellation
                open={constellationOpen}
                onClose={() => setConstellationOpen(false)}
            />
            {/*
             * DEV-only demo dock (#54 / M9.4). Bottom-right, collapsed by
             * default so it does not intrude on the main canvas during a
             * recording. Vite tree-shakes the import in prod; the backend
             * endpoints it calls are additionally gated server-side behind
             * `ARIA_DEMO_ENABLED`.
             */}
            {import.meta.env.DEV && <DemoControlStrip />}
        </div>
    );
}

function MasterFixTopBar({
    sidebarCollapsed,
    onSidebarToggle,
}: {
    sidebarCollapsed: boolean;
    onSidebarToggle: () => void;
}) {
    const SidebarIcon = sidebarCollapsed ? Icons.PanelLeftOpen : Icons.PanelLeftClose;

    return (
        <header className="sticky top-0 z-30 flex h-14 flex-none items-center gap-3 border-b border-sidebar-border/40 bg-sidebar pl-2 pr-4">
            <button
                type="button"
                onClick={onSidebarToggle}
                aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                aria-pressed={!sidebarCollapsed}
                className={ChromeButton}
            >
                <SidebarIcon className="size-4" aria-hidden />
            </button>
            <div aria-hidden className="h-5 w-px bg-sidebar-border/60" />
            <div className="min-w-0">
                <div className="text-sm font-semibold text-sidebar-foreground">
                    MasterFix 管理端
                </div>
                <div className="hidden text-xs text-sidebar-muted-foreground sm:block">
                    工单、Skill、Tool 与维修知识统一治理
                </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <span className="hidden rounded-md border border-sidebar-border bg-sidebar-accent px-2 py-1 text-xs text-sidebar-muted-foreground md:inline-flex">
                    Demo workspace
                </span>
            </div>
        </header>
    );
}

const ChromeButton = [
    "inline-flex h-8 w-8 flex-none items-center justify-center rounded-md",
    "text-sidebar-muted-foreground transition-colors duration-150",
    "hover:bg-sidebar-accent hover:text-sidebar-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
].join(" ");
