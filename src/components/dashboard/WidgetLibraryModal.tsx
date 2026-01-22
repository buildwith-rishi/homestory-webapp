import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Plus,
  Star,
  TrendingUp,
  Users,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  AlertTriangle,
  FileText,
  StickyNote,
  Check,
} from "lucide-react";
import { Button, Badge } from "../ui";
import { useUIStore } from "../../stores/uiStore";
import { WidgetCategory } from "../../types";
import { WIDGET_REGISTRY } from "./widgets";

interface CategoryItem {
  id: WidgetCategory | "all";
  name: string;
  icon: React.ElementType;
  count: number;
}

const getWidgetIcon = (iconName: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    TrendingUp,
    BarChart3,
    Activity,
    Target,
    PieChart,
    AlertTriangle,
    UserCheck,
    Users,
    FileText,
    StickyNote,
  };
  return iconMap[iconName] || TrendingUp;
};

export const WidgetLibraryModal: React.FC = () => {
  const { widgetLibraryOpen, closeWidgetLibrary, addWidget, dashboardWidgets } =
    useUIStore();
  const [selectedCategory, setSelectedCategory] = useState<
    WidgetCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedWidgets, setAddedWidgets] = useState<Set<string>>(new Set());

  // Calculate category counts
  const categories: CategoryItem[] = useMemo(() => {
    const counts: Record<string, number> = { all: WIDGET_REGISTRY.length };
    WIDGET_REGISTRY.forEach((widget) => {
      counts[widget.category] = (counts[widget.category] || 0) + 1;
    });

    return [
      { id: "all", name: "All Widgets", icon: Star, count: counts.all },
      {
        id: "featured",
        name: "Featured",
        icon: Star,
        count: counts.featured || 0,
      },
      {
        id: "sales",
        name: "Sales Metrics",
        icon: TrendingUp,
        count: counts.sales || 0,
      },
      {
        id: "leads",
        name: "Lead Analytics",
        icon: Target,
        count: counts.leads || 0,
      },
      {
        id: "team",
        name: "Team Performance",
        icon: Users,
        count: counts.team || 0,
      },
      {
        id: "actions",
        name: "Quick Actions",
        icon: Zap,
        count: counts.actions || 0,
      },
    ];
  }, []);

  // Filter widgets based on category and search
  const filteredWidgets = useMemo(() => {
    return WIDGET_REGISTRY.filter((widget) => {
      const matchesCategory =
        selectedCategory === "all" || widget.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Check if widget is already on dashboard
  const isWidgetOnDashboard = (widgetId: string) => {
    return dashboardWidgets.some(
      (w: { widgetId: string }) => w.widgetId === widgetId,
    );
  };

  const handleAddWidget = (widgetId: string) => {
    addWidget(widgetId);
    setAddedWidgets((prev) => new Set(prev).add(widgetId));

    // Show success feedback
    setTimeout(() => {
      setAddedWidgets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(widgetId);
        return newSet;
      });
    }, 1500);
  };

  if (!widgetLibraryOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {widgetLibraryOpen && (
        <>
          {/* Backdrop - covers entire viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeWidgetLibrary}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(17, 24, 39, 0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 9998,
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ pointerEvents: "auto" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Widget Library
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Add widgets to customize your dashboard
                  </p>
                </div>
                <button
                  onClick={closeWidgetLibrary}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-56 border-r border-gray-200 p-4 flex-shrink-0 bg-gray-50">
                  <nav className="space-y-1">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isActive = selectedCategory === category.id;

                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-orange-100 text-orange-700"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${isActive ? "text-orange-600" : "text-gray-400"}`}
                            />
                            <span>{category.name}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-orange-200 text-orange-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {category.count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search widgets..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Widget Grid */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredWidgets.map((widget) => {
                        const Icon = getWidgetIcon(widget.icon);
                        const isOnDashboard = isWidgetOnDashboard(widget.id);
                        const justAdded = addedWidgets.has(widget.id);

                        return (
                          <motion.div
                            key={widget.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer"
                          >
                            {/* Widget Preview Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  widget.category === "sales"
                                    ? "bg-emerald-100"
                                    : widget.category === "leads"
                                      ? "bg-blue-100"
                                      : widget.category === "team"
                                        ? "bg-purple-100"
                                        : widget.category === "actions"
                                          ? "bg-orange-100"
                                          : "bg-gray-100"
                                }`}
                              >
                                <Icon
                                  className={`w-5 h-5 ${
                                    widget.category === "sales"
                                      ? "text-emerald-600"
                                      : widget.category === "leads"
                                        ? "text-blue-600"
                                        : widget.category === "team"
                                          ? "text-purple-600"
                                          : widget.category === "actions"
                                            ? "text-orange-600"
                                            : "text-gray-600"
                                  }`}
                                />
                              </div>
                              {widget.featured && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Featured
                                </Badge>
                              )}
                            </div>

                            {/* Widget Info */}
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                              {widget.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                              {widget.description}
                            </p>

                            {/* Add Button */}
                            <Button
                              variant={isOnDashboard ? "secondary" : "primary"}
                              size="sm"
                              className="w-full rounded-xl"
                              onClick={() =>
                                !isOnDashboard && handleAddWidget(widget.id)
                              }
                              disabled={isOnDashboard}
                            >
                              {justAdded ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Added!
                                </>
                              ) : isOnDashboard ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  On Dashboard
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Widget
                                </>
                              )}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Empty State */}
                    {filteredWidgets.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          No widgets found
                        </h3>
                        <p className="text-sm text-gray-500">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  {dashboardWidgets.length} widget
                  {dashboardWidgets.length !== 1 ? "s" : ""} on your dashboard
                </p>
                <Button
                  variant="primary"
                  onClick={closeWidgetLibrary}
                  className="rounded-xl"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default WidgetLibraryModal;
