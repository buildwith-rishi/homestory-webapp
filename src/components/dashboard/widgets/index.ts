import React from "react";
import { WidgetCategory } from "../../../types";

// Widget Registry Item Interface
export interface WidgetRegistryItem {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  featured?: boolean;
  defaultSize: { w: number; h: number };
  component: React.LazyExoticComponent<React.ComponentType<WidgetProps>>;
}

// Widget Component Props
export interface WidgetProps {
  instanceId: string;
  onRemove: () => void;
  size?: { w: number; h: number };
}

// Lazy load widget components
const RevenueTargetWidget = React.lazy(() => import("./RevenueTargetWidget"));
const SalesPipelineWidget = React.lazy(() => import("./SalesPipelineWidget"));
const MonthlyTrendWidget = React.lazy(() => import("./MonthlyTrendWidget"));
const HotLeadsWidget = React.lazy(() => import("./HotLeadsWidget"));
const LeadSourceWidget = React.lazy(() => import("./LeadSourceWidget"));
const StaleDealsWidget = React.lazy(() => import("./StaleDealsWidget"));
const LeaderboardWidget = React.lazy(() => import("./LeaderboardWidget"));
const ActivityWidget = React.lazy(() => import("./ActivityWidget"));
const QuickAddWidget = React.lazy(() => import("./QuickAddWidget"));
const NotesWidget = React.lazy(() => import("./NotesWidget"));

// Widget Registry
export const WIDGET_REGISTRY: WidgetRegistryItem[] = [
  // Sales Metrics
  {
    id: "revenue-target",
    name: "Revenue vs Target",
    description:
      "Track your monthly revenue progress against goals with a visual progress indicator.",
    category: "sales",
    icon: "TrendingUp",
    featured: true,
    defaultSize: { w: 1, h: 1 },
    component: RevenueTargetWidget,
  },
  {
    id: "sales-pipeline",
    name: "Sales Pipeline Funnel",
    description:
      "Visualize your sales funnel stages from New Leads to Closed Won deals.",
    category: "sales",
    icon: "BarChart3",
    featured: true,
    defaultSize: { w: 1, h: 1 },
    component: SalesPipelineWidget,
  },
  {
    id: "monthly-trend",
    name: "Monthly Revenue Trend",
    description:
      "View revenue trends over the last 30 days with interactive charts.",
    category: "sales",
    icon: "Activity",
    defaultSize: { w: 2, h: 1 },
    component: MonthlyTrendWidget,
  },

  // Lead Analytics
  {
    id: "hot-leads",
    name: "High-Priority Leads",
    description:
      "Quick access to leads with >80% probability score requiring immediate attention.",
    category: "leads",
    icon: "Target",
    featured: true,
    defaultSize: { w: 1, h: 1 },
    component: HotLeadsWidget,
  },
  {
    id: "lead-source",
    name: "Lead Source Distribution",
    description:
      "Breakdown of leads by acquisition channel (Website, Referrals, Social, etc.).",
    category: "leads",
    icon: "PieChart",
    defaultSize: { w: 1, h: 1 },
    component: LeadSourceWidget,
  },
  {
    id: "stale-deals",
    name: "Stale Opportunities Alert",
    description:
      "Highlight high-value deals stuck in Proposal stage for 14+ days.",
    category: "leads",
    icon: "AlertTriangle",
    defaultSize: { w: 1, h: 1 },
    component: StaleDealsWidget,
  },

  // Team Performance
  {
    id: "leaderboard",
    name: "Top Performers",
    description:
      "Rank sales reps by deals closed and revenue generated this month.",
    category: "team",
    icon: "UserCheck",
    featured: true,
    defaultSize: { w: 1, h: 1 },
    component: LeaderboardWidget,
  },
  {
    id: "activity-feed",
    name: "Recent Activity Feed",
    description: "Real-time timeline of team actions, calls, and deal updates.",
    category: "team",
    icon: "Users",
    defaultSize: { w: 1, h: 1 },
    component: ActivityWidget,
  },

  // Quick Actions
  {
    id: "quick-add",
    name: "Quick Add",
    description: "Instantly create new Leads, Contacts, or schedule Meetings.",
    category: "actions",
    icon: "FileText",
    defaultSize: { w: 1, h: 1 },
    component: QuickAddWidget,
  },
  {
    id: "notes",
    name: "Dashboard Notes",
    description:
      "Jot down quick notes and reminders that persist across sessions.",
    category: "actions",
    icon: "StickyNote",
    defaultSize: { w: 1, h: 1 },
    component: NotesWidget,
  },
];

// Get widget by ID
export const getWidgetById = (id: string): WidgetRegistryItem | undefined => {
  return WIDGET_REGISTRY.find((w) => w.id === id);
};

// Get widgets by category
export const getWidgetsByCategory = (
  category: WidgetCategory,
): WidgetRegistryItem[] => {
  return WIDGET_REGISTRY.filter((w) => w.category === category);
};

// Get featured widgets
export const getFeaturedWidgets = (): WidgetRegistryItem[] => {
  return WIDGET_REGISTRY.filter((w) => w.featured);
};
