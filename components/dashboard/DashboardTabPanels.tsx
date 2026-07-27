"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DashboardDataProvider, useDashboardData } from "@/contexts/DashboardDataContext";
import DashboardHomePanel from "./DashboardHomePanel";
import DashboardAnalyticsPanel from "./DashboardAnalyticsPanel";
import DashboardCalendarPanel from "./DashboardCalendarPanel";
import DashboardExportPanel from "./DashboardExportPanel";

function DashboardExportPanelWrapper() {
  const { participants, eventName } = useDashboardData();
  return <DashboardExportPanel participants={participants} eventName={eventName} />;
}

const TAB_PANELS = [
  { path: "/dashboard", Component: DashboardHomePanel, needsSuspense: true },
  { path: "/dashboard/analytics", Component: DashboardAnalyticsPanel, needsSuspense: false },
  { path: "/dashboard/calendar", Component: DashboardCalendarPanel, needsSuspense: false },
  { path: "/dashboard/export", Component: DashboardExportPanelWrapper, needsSuspense: false },
] as const;

function PanelFallback() {
  return (
    <div className="bd flex min-h-[50vh] items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--primary)" }}>
        progress_activity
      </span>
    </div>
  );
}

function TabPanel({
  path,
  activePath,
  children,
}: {
  path: string;
  activePath: string;
  children: React.ReactNode;
}) {
  const isActive = activePath === path;

  return (
    <div
      style={{
        display: isActive ? "block" : "none",
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function DashboardTabPanels() {
  const pathname = usePathname();

  return (
    <DashboardDataProvider>
      {TAB_PANELS.map(({ path, Component, needsSuspense }) => {
        const content = needsSuspense ? (
          <Suspense fallback={<PanelFallback />}>
            <Component />
          </Suspense>
        ) : (
          <Component />
        );

        return (
          <TabPanel key={path} path={path} activePath={pathname}>
            {content}
          </TabPanel>
        );
      })}
    </DashboardDataProvider>
  );
}
