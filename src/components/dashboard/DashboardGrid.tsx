import React, { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, LayoutGrid, Sparkles, RefreshCw } from "lucide-react";
import { Card, Button, Skeleton } from "../ui";
import { useUIStore } from "../../stores/uiStore";
import { DashboardWidget } from "../../types";
import { getWidgetById, WidgetRegistryItem } from "./widgets";

// Loading skeleton for widgets
const WidgetSkeleton: React.FC = () => (
  <Card className="h-full p-5">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <Skeleton className="h-32 w-full rounded-lg" />
  </Card>
);

// Empty state component
const EmptyDashboard: React.FC<{ onAddWidget: () => void }> = ({
  onAddWidget,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex flex-col items-center justify-center py-20 px-8"
  >
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
        <LayoutGrid className="w-12 h-12 text-orange-600" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
    </div>

    <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
      Welcome to Your Custom Dashboard
    </h2>
    <p className="text-gray-500 text-center max-w-md mb-8">
      Personalize your dashboard by adding widgets that matter most to you.
      Track sales, monitor leads, and stay on top of your team's performance.
    </p>

    <Button
      variant="primary"
      size="lg"
      onClick={onAddWidget}
      className="rounded-xl shadow-lg shadow-orange-500/25"
    >
      <Plus className="w-5 h-5 mr-2" />
      Add Your First Widget
    </Button>

    <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        10+ Widgets Available
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        Fully Customizable
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        Auto-saves Layout
      </div>
    </div>
  </motion.div>
);

// Widget wrapper with controls
interface WidgetWrapperProps {
  widget: DashboardWidget;
  widgetDef: WidgetRegistryItem;
  onRemove: () => void;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widget,
  widgetDef,
  onRemove,
}) => {
  const WidgetComponent = widgetDef.component;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <WidgetComponent
          instanceId={widget.instanceId}
          onRemove={onRemove}
          size={widget.size}
        />
      </Suspense>
    </motion.div>
  );
};

// Main Dashboard Grid Component
export const DashboardGrid: React.FC = () => {
  const { dashboardWidgets, openWidgetLibrary, removeWidget, resetDashboard } =
    useUIStore();

  const hasWidgets = dashboardWidgets.length > 0;

  return (
    <div className="space-y-6">
      {/* Grid Header */}
      {hasWidgets && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              {dashboardWidgets.length} widget
              {dashboardWidgets.length !== 1 ? "s" : ""} • Drag to rearrange
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDashboard}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openWidgetLibrary}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          </div>
        </motion.div>
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {hasWidgets ? (
            dashboardWidgets.map((widget: DashboardWidget) => {
              const widgetDef = getWidgetById(widget.widgetId);

              if (!widgetDef) {
                // Widget definition not found, skip rendering
                return null;
              }

              return (
                <WidgetWrapper
                  key={widget.instanceId}
                  widget={widget}
                  widgetDef={widgetDef}
                  onRemove={() => removeWidget(widget.instanceId)}
                />
              );
            })
          ) : (
            <EmptyDashboard key="empty" onAddWidget={openWidgetLibrary} />
          )}
        </AnimatePresence>
      </div>

      {/* Add More Widget Card (shown when there are widgets) */}
      {hasWidgets && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={openWidgetLibrary}
            className="w-full p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
          >
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-orange-600 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add More Widgets</span>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardGrid;
